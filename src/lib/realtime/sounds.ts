/** Máximo un sonido por ventana corta (evita spam si llegan muchos SSE). */
let lastInboxSoundAt = 0;
const INBOX_THROTTLE_MS = 400;

/** Cooldown aparte para venta nueva (puede coincidir en el tiempo con mensaje). */
let lastSaleSoundAt = 0;
const SALE_THROTTLE_MS = 800;

let lastUrgentSoundAt = 0;
const URGENT_THROTTLE_MS = 400;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    audioCtx = new AC();
  } catch {
    return null;
  }
  return audioCtx;
}

/**
 * Desbloquea reproducción (políticas de autoplay del navegador).
 * Llamar una vez tras gesto del usuario (p. ej. primer click en bandeja).
 */
export function unlockBandejaAudio(): void {
  const c = getAudioContext();
  if (!c) return;
  void c.resume().catch(() => {});
}

/**
 * Pitido corto vía Web Audio (no depende de archivos en /public).
 */
function playBeep(freqHz: number, durationSec: number): void {
  const c = getAudioContext();
  if (!c) return;
  void c.resume().catch(() => {});
  if (c.state === "suspended") void c.resume().catch(() => {});
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freqHz;
    osc.connect(g);
    g.connect(c.destination);
    const t0 = c.currentTime;
    const vol = 0.09;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + durationSec);
    osc.start(t0);
    osc.stop(t0 + durationSec + 0.02);
  } catch {
    /* ignore */
  }
}

function playUrlOrBeep(url: string, beepHz: number): void {
  if (typeof window === "undefined") return;
  const a = new Audio(url);
  void a.play().catch(() => {
    playBeep(beepHz, 0.14);
  });
}

function inboxSoundThrottleOk(): boolean {
  const now = Date.now();
  if (now - lastInboxSoundAt < INBOX_THROTTLE_MS) return false;
  lastInboxSoundAt = now;
  return true;
}

/**
 * TTS corto para inbound WhatsApp (sin archivo WAV): "Mensaje en WhatsApp."
 * Requiere gesto previo del usuario (unlockBandejaAudio / pointer) en muchos navegadores.
 */
function speakWhatsappInboundCue(): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) {
    playBeep(620, 0.14);
    return;
  }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance("Mensaje en WhatsApp.");
    u.lang = "es-419";
    u.rate = 0.95;
    const voices = synth.getVoices();
    const pick =
      voices.find((v) => /^es/i.test(v.lang) && /419|latam|america|mex|argent|colom|venez|ecua|peru/i.test(`${v.lang} ${v.name}`)) ||
      voices.find((v) => /^es/i.test(v.lang));
    if (pick) u.voice = pick;
    u.onerror = () => {
      playBeep(620, 0.14);
    };
    synth.speak(u);
  } catch {
    playBeep(620, 0.14);
  }
}

/**
 * Mensaje entrante omnicanal (SSE `new_message` / `chat_reopened`).
 * Sonidos por `source_type`: WA → TTS; pregunta ML → preguntas.wav; pack ML → ml-message.wav.
 */
export function playInboxInboundSound(sourceType: string | null | undefined): void {
  if (!inboxSoundThrottleOk()) return;
  unlockBandejaAudio();
  const st = (sourceType != null ? String(sourceType) : "").trim().toLowerCase();

  if (st === "wa_inbound" || st === "wa" || st === "wa_ml_linked") {
    speakWhatsappInboundCue();
    return;
  }
  if (st === "ml_question") {
    playUrlOrBeep("/sounds/preguntas.wav", 880);
    return;
  }
  if (st === "ml_message" || st === "ml") {
    playUrlOrBeep("/sounds/ml-message.wav", 760);
    return;
  }
  if (st === "fb_page") {
    playBeep(700, 0.12);
    playBeep(900, 0.09);
    return;
  }
  playUrlOrBeep("/sounds/preguntas.wav", 880);
}

/** @deprecated Usar `playInboxInboundSound`; se mantiene para llamadas sin tipo. */
export function playNewMessageSound(): void {
  playInboxInboundSound(null);
}

/** Nueva venta importada a `sales_orders` (SSE `new_sale` desde API import ML). */
export function playNewSaleSound(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastSaleSoundAt < SALE_THROTTLE_MS) return;
  lastSaleSoundAt = now;
  unlockBandejaAudio();
  playUrlOrBeep("/sounds/venta.wav", 520);
}

/** SLA / urgente. */
export function playUrgentSound(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastUrgentSoundAt < URGENT_THROTTLE_MS) return;
  lastUrgentSoundAt = now;
  unlockBandejaAudio();
  playUrlOrBeep("/sounds/urgent-alert.mp3", 520);
}
