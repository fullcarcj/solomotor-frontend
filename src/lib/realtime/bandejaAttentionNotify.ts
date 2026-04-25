/**
 * Notificaciones de escritorio (Web Notifications API) para mensajes por atender.
 * Requiere permiso explícito del usuario (solicitud en primer gesto en bandeja).
 */

let lastOsNotifyAt = 0;
const OS_THROTTLE_MS = 4500;

let lastMlSaleOsNotifyAt = 0;
const ML_SALE_OS_THROTTLE_MS = 4500;

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

/**
 * Nueva orden ML importada a `sales_orders` (SSE `new_sale`).
 * Misma política que bandeja: no spamear si la pestaña visible ya está en Pedidos.
 */
export function tryNewMlSaleDesktopNotify(p: {
  external_order_id: string | null;
  order_id: number | null;
  /** Ruta actual (p. ej. pathname de Next) */
  activePath: string | null;
}): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const visible = document.visibilityState === "visible";
  const onPedidos =
    typeof p.activePath === "string" &&
    (p.activePath === "/ventas/pedidos" || p.activePath.startsWith("/ventas/pedidos?"));
  if (visible && onPedidos) return;

  const now = Date.now();
  if (now - lastMlSaleOsNotifyAt < ML_SALE_OS_THROTTLE_MS) return;
  lastMlSaleOsNotifyAt = now;

  const hint =
    p.external_order_id != null && String(p.external_order_id).trim() !== ""
      ? String(p.external_order_id).trim().slice(0, 120)
      : p.order_id != null && Number.isFinite(p.order_id)
        ? `Orden #${p.order_id}`
        : "Nueva orden Mercado Libre en ERP.";

  try {
    new Notification("Pedidos · nueva orden ML", {
      body: hint,
      tag: "erp-new-ml-sale",
      icon: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : undefined,
    });
  } catch {
    /* ignore */
  }
}
