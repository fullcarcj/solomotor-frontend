type Listener = (event: string, data: unknown) => void;

class InboxStream {
  private es: EventSource | null = null;
  private readonly listeners = new Set<Listener>();
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (typeof window === "undefined") return;
    if (this.es) return;

    this.es = new EventSource("/api/realtime/stream", { withCredentials: true });

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
    ];
    for (const name of events) {
      this.es.addEventListener(name, (ev: MessageEvent) => {
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
      const wait = this.reconnectDelay;
      this.reconnectDelay = Math.min(Math.floor(this.reconnectDelay * 1.5), 30000);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, wait);
    };

    this.es.onopen = () => {
      this.reconnectDelay = 1000;
    };
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
