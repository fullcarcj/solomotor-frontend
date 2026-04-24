/**
 * Notificaciones de escritorio (Web Notifications API) para mensajes por atender.
 * Requiere permiso explícito del usuario (solicitud en primer gesto en bandeja).
 */

let lastOsNotifyAt = 0;
const OS_THROTTLE_MS = 4500;

export function requestBandejaNotifyPermission(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => {});
  }
}

/**
 * Muestra notificación del SO si hay permiso.
 * Omite si la pestaña está visible y el usuario ya está en ese chat (menos ruido).
 */
export function tryBandejaDesktopNotify(p: {
  chatId: string;
  preview: string | null;
  activeChatId: string | null;
}): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const visible = document.visibilityState === "visible";
  const sameChatOpen =
    visible && String(p.activeChatId ?? "") === String(p.chatId);
  if (sameChatOpen) return;

  const now = Date.now();
  if (now - lastOsNotifyAt < OS_THROTTLE_MS) return;
  lastOsNotifyAt = now;

  const body =
    p.preview != null && String(p.preview).trim() !== ""
      ? String(p.preview).trim().slice(0, 180)
      : "Mensaje entrante — pendiente de respuesta.";

  try {
    new Notification("Bandeja · por atender", {
      body,
      tag: `bandeja-chat-${p.chatId}`,
      icon: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : undefined,
    });
  } catch {
    /* ignore */
  }
}
