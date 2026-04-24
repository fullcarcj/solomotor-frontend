/** Máximo un sonido por ventana corta (evita spam si llegan muchos SSE). */
let lastSoundAt = 0;
const THROTTLE_MS = 400;

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
 * Pitido corto vía Web Audio (no depende de archivos .mp3 en /public).
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

function playThrottled(src: string | null, beepFreq: number): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastSoundAt < THROTTLE_MS) return;
  lastSoundAt = now;

  const tryMp3 = () => {
    if (!src) return Promise.reject(new Error("no_src"));
    const a = new Audio(src);
    return a.play();
  };

  void tryMp3().catch(() => {
    playBeep(beepFreq, 0.14);
  });
}

/** Mensaje entrante (SSE `new_message` / `chat_reopened`). */
export function playNewMessageSound(): void {
  // Prueba: WAV desde Sonidos_fullcar (copia en `public/sounds/preguntas.wav`). Si falla → pitido.
  playThrottled("/sounds/preguntas.wav", 880);
}

/** SLA / urgente. */
export function playUrgentSound(): void {
  playThrottled("/sounds/urgent-alert.mp3", 520);
}
