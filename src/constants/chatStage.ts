/**
 * Etapas del ciclo de venta de un chat (6 valores canónicos).
 * Proviene del backend vía BE-1.9 (campo chat_stage en GET /api/inbox).
 *
 * No existe etapa "Resp. ML" ni "Aprobada":
 *   - ml_answer → se normaliza como `quote`.
 *   - approved  → se normaliza como `order` (cotización aprobada = ya hay orden).
 */
export type ChatStage =
  | 'contact'
  | 'quote'
  | 'order'
  | 'payment'
  | 'dispatch'
  | 'closed';

export const CHAT_STAGE_LABELS: Record<ChatStage, string> = {
  contact:   'Contacto',
  quote:     'Cotización',
  order:     'Con orden',
  payment:   'Pago',
  dispatch:  'Despacho',
  closed:    'Cerrada',
};

export const CHAT_STAGE_ORDER: ChatStage[] = [
  'contact',
  'quote',
  'order',
  'payment',
  'dispatch',
  'closed',
];

/** Compatibilidad con respuestas antiguas que envían `ml_answer` o `approved`. */
export function normalizeChatStage(raw: string | null | undefined): ChatStage | undefined {
  if (raw == null || String(raw).trim() === "") return undefined;
  if (raw === "ml_answer") return "quote";
  if (raw === "approved") return "order";
  if ((CHAT_STAGE_ORDER as readonly string[]).includes(raw)) return raw as ChatStage;
  return undefined;
}
