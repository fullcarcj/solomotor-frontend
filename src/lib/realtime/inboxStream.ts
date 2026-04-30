type Listener = (event: string, data: unknown) => void;

/** Tamaño máximo del ring buffer de IDs vistos para dedup multi-pestaña. */
const SEEN_MAX = 500;
/** Al llegar al límite, descartar los más viejos hasta quedar con este tamaño. */
const SEEN_TRIM_TO = 400;

class InboxStream {
  private es: EventSource | null = null;
  private readonly listeners = new Set<Listener>();

  /** Último id: recibido. Persiste entre reconexiones para gap detection. */
  private lastEventId: string | null = null;
  /** Ring buffer para dedup de eventos en múltiples pestañas. */
  private seenIds = new Set<string>();
  /** Contador de intentos de reconexión consecutivos (reset en onopen). */
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (typeof window === "undefined") return;
    if (this.es) return;

    // Incluir lastEventId como query param para reconexiones manuales
    // (es.close() + new EventSource()). El header Last-Event-ID automático
    // del browser solo aplica cuando el mismo objeto EventSource se reconecta
    // internamente, pero aquí siempre creamos uno nuevo.
    const url = this.lastEventId
      ? `/api/realtime/stream?lastEventId=${encodeURIComponent(this.lastEventId)}`
      : "/api/realtime/stream";

    this.es = new EventSource(url, { withCredentials: true });

    const events = [
      "connected",
      "chat_taken",
      "clear_notification",
      "presence_update",
      "new_message",
      "chat_reopened",
      "chat_attended",
      "chat_released",
      "urgent_alert",
      "sla_started",
      "new_sale",
      "chat_discarded",
    ];

    for (const name of events) {
      this.es.addEventListener(name, (ev: MessageEvent) => {
        // Dedup: si ya procesamos este id: (otra pestaña, reintento de red), descartar.
        if (ev.lastEventId) {
          if (this.seenIds.has(ev.lastEventId)) return;
          this.seenIds.add(ev.lastEventId);
          if (this.seenIds.size > SEEN_MAX) {
            const arr = Array.from(this.seenIds);
            this.seenIds = new Set(arr.slice(arr.length - SEEN_TRIM_TO));
          }
          this.lastEventId = ev.lastEventId;
        }

        try {
          const data = ev.data ? (JSON.parse(ev.data) as unknown) : null;
          this.listeners.forEach((l) => l(name, data));
        } catch {
          /* ignore malformed payloads */
        }
      });
    }

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.nextDelay());
    };

    this.es.onopen = () => {
      this.reconnectAttempts = 0;

      // Gap detection: si es una reconexión (tenemos un lastEventId previo),
      // consultar el cursor del servidor para saber si se perdieron eventos.
      if (!this.lastEventId) return;
      void this.checkGap();
    };
  }

  /**
   * Calcula el delay de reconexión con exponential backoff + jitter.
   * Incrementa reconnectAttempts antes de retornar para que la próxima llamada
   * use el siguiente nivel.
   */
  private nextDelay(): number {
    const attempt = this.reconnectAttempts;
    this.reconnectAttempts = attempt + 1;
    const base = Math.min(1000 * Math.pow(1.5, attempt), 30000);
    const jitter = Math.random() * 1000;
    return Math.floor(base + jitter);
  }

  /**
   * Compara lastEventId con el cursor del servidor.
   * Si hay gap (current > lastEventId), emite "gap_detected" para que el
   * consumidor (useInboxRealtime) invalide su caché.
   */
  private async checkGap(): Promise<void> {
    try {
      const r = await fetch("/api/realtime/cursor", { cache: "no-store" });
      if (!r.ok) return;
      const body = (await r.json()) as { current?: string };
      const current = body.current;
      if (!current || !this.lastEventId) return;
      if (BigInt(current) > BigInt(this.lastEventId)) {
        this.listeners.forEach((l) =>
          l("gap_detected", { since: this.lastEventId, current })
        );
      }
    } catch {
      /* silencioso: gap detection es best-effort */
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.es?.close();
    this.es = null;
  }
}

export const inboxStream = new InboxStream();
