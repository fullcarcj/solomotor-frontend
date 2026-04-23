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

/** Subconjunto de `InboxOrder` usado para saber si el pedido sigue activo (bandeja). */
export type BandejaMlQuestionOrderLike = {
  status?:          string | null;
  payment_status?: string | null;
};

/** Datos mínimos para detectar hilo “solo pregunta ML” y aplicar reglas de pipeline / UI. */
export type MlQuestionThreadChatInput = {
  source_type?:     string;
  phone?:           string;
  ml_question_id?:  string | number | null;
};

/**
 * Chat cuyo hilo es una pregunta de publicación ML (no post-venta `ml_message`).
 * El CRM a veces expone el prefijo `mlq:` en `phone` sin rellenar `source_type`;
 * sin esto el pipeline y la ficha no aplican las reglas de pregunta ML.
 */
export function isMlQuestionThreadChat(
  chat: MlQuestionThreadChatInput | null | undefined
): boolean {
  if (!chat) return false;
  const st = String(chat.source_type ?? "").trim();
  if (st === "ml_question") return true;
  const stLower = st.toLowerCase();
  if (stLower === "mlq" || stLower === "ml_pregunta" || stLower === "ml-pregunta") return true;
  if (st === "ml_message") return false;

  const qRaw = chat.ml_question_id;
  const qNum = qRaw != null ? Number(qRaw) : NaN;
  const hasQuestionId = Number.isFinite(qNum) && qNum > 0;
  if (!hasQuestionId) return false;

  const phone = String(chat.phone ?? "").trim().toLowerCase();
  if (phone.startsWith("mlq:")) return true;

  return false;
}

/** Mínimo para decidir si forzar “contacto” en pregunta ML (bandeja / header). */
export type BandejaMlQuestionStageInput = MlQuestionThreadChatInput & {
  customer_id?: number | string | null;
  order?:        unknown;
};

function asOrderLike(order: unknown): BandejaMlQuestionOrderLike | null {
  if (order == null || typeof order !== "object") return null;
  const r = order as Record<string, unknown>;
  return {
    status:          r.status != null ? String(r.status) : null,
    payment_status:  r.payment_status != null ? String(r.payment_status) : null,
  };
}

/**
 * Alineado a `JOIN_ORDER` en inbox (BE): orden activa = no `completed` / `cancelled`,
 * y pago no rechazado.
 */
export function isBandejaSalesOrderActiveForPipeline(
  order: BandejaMlQuestionOrderLike | null
): order is BandejaMlQuestionOrderLike {
  if (order == null) return false;
  const st = String(order.status ?? "").toLowerCase().trim();
  if (st === "completed" || st === "cancelled") return false;
  const pay = String(order.payment_status ?? "").toLowerCase().trim();
  if (pay === "rejected") return false;
  return true;
}

const ML_QUESTION_GATE_STAGES: ReadonlySet<ChatStage> = new Set([
  "order",
  "payment",
  "dispatch",
]);

/**
 * Pregunta ML: no mostrar etapas “Con orden” en adelante sin cliente CRM y una
 * `sales_orders` activa (mismo criterio que lista inbox en backend).
 *
 * Sin cliente o sin orden en contexto → contacto. Con orden inactiva (cerrada /
 * cancelada / pago rechazado) se dejan `quote` y `closed`; se baja a contacto
 * si el backend marcó `order` | `payment` | `dispatch` sin pedido activo.
 */
export function bandejaMlQuestionPipelineStage(
  raw: string | null | undefined,
  chat: BandejaMlQuestionStageInput | null | undefined
): ChatStage | undefined {
  if (!chat || !isMlQuestionThreadChat(chat)) return normalizeChatStage(raw);
  const cid = chat.customer_id != null ? Number(chat.customer_id) : NaN;
  const sinCliente = !Number.isFinite(cid) || cid <= 0;
  const order = asOrderLike(chat.order);
  const ordenActiva = isBandejaSalesOrderActiveForPipeline(order);

  if (sinCliente || order == null) {
    return normalizeChatStage("contact");
  }

  if (!ordenActiva) {
    const norm = normalizeChatStage(raw);
    if (norm != null && ML_QUESTION_GATE_STAGES.has(norm)) {
      return normalizeChatStage("contact");
    }
    return norm;
  }

  return normalizeChatStage(raw);
}
