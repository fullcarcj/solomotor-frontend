/**
 * Etapas del ciclo de venta de un chat (8 valores canónicos).
 * Proviene del backend vía BE-1.9 (campo chat_stage en GET /api/inbox).
 * NO derivar en frontend — usar el campo tal como llega.
 *
 * Este archivo vive en `constants/` (no solo en `types/`) para que el bundler
 * siempre incluya los valores en runtime; `src/types/inbox.ts` reexporta.
 */
export type ChatStage =
  | 'contact'
  | 'ml_answer'
  | 'quote'
  | 'approved'
  | 'order'
  | 'payment'
  | 'dispatch'
  | 'closed';

export const CHAT_STAGE_LABELS: Record<ChatStage, string> = {
  contact:   'Contacto',
  ml_answer: 'Resp. ML',
  quote:     'Cotización',
  approved:  'Aprobada',
  order:     'Con orden',
  payment:   'Pago',
  dispatch:  'Despacho',
  closed:    'Cerrada',
};

export const CHAT_STAGE_ORDER: ChatStage[] = [
  'contact',
  'ml_answer',
  'quote',
  'approved',
  'order',
  'payment',
  'dispatch',
  'closed',
];
