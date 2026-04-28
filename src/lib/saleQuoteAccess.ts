import type { Sale } from "@/types/sales";

/** Hay cotización activa vinculada en el listado (presupuesto). */
export function saleHasActiveQuotePreview(
  sale: Pick<Sale, "quote_preview">
): boolean {
  return (
    sale.quote_preview != null && Number(sale.quote_preview.id) > 0
  );
}

/**
 * Puede abrirse el modal de cotización desde Pedidos / detalle.
 * ML siempre; otros canales con chat CRM; o si ya hay cotización (se intenta resolver chat en el modal).
 */
export function saleCanOpenQuoteModal(
  sale: Pick<Sale, "source" | "chat_id" | "quote_preview">
): boolean {
  const s = String(sale.source || "").toLowerCase();
  const isMl = s.includes("mercadolibre") || s.startsWith("ml_");
  const hasChat =
    sale.chat_id != null && String(sale.chat_id).trim() !== "";
  return isMl || hasChat || saleHasActiveQuotePreview(sale);
}
