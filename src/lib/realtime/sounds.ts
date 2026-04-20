/** Máximo un sonido por segundo (global) para evitar spam de SSE. */
let lastSoundAt = 0;
const THROTTLE_MS = 1000;

function playThrottled(src: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastSoundAt < THROTTLE_MS) return;
  lastSoundAt = now;
  try {
    const a = new Audio(src);
    void a.play().catch(() => {
      /* sin archivo o autoplay bloqueado */
    });
  } catch {
    /* ignore */
  }
}

export function playNewMessageSound() {
  playThrottled("/sounds/new-message.mp3");
}

export function playUrgentSound() {
  playThrottled("/sounds/urgent-alert.mp3");
}
