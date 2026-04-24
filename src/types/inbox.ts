/**
 * Reexport de etapas de chat: definición canónica en `src/constants/chatStage.ts`
 * para que el bundler no trate los valores como tipos erasables.
 */
import type { ChatStage } from '@/constants/chatStage';

export type { ChatStage } from '@/constants/chatStage';
export {
  CHAT_STAGE_LABELS,
  CHAT_STAGE_ORDER,
  normalizeChatStage,
  bandejaMlQuestionPipelineStage,
  isBandejaSalesOrderActiveForPipeline,
  isMlQuestionThreadChat,
} from '@/constants/chatStage';
export type {
  BandejaMlQuestionStageInput,
  BandejaMlQuestionOrderLike,
  MlQuestionThreadChatInput,
} from '@/constants/chatStage';

export interface InboxOrder {
  id:               number;
  payment_status:   string;
  fulfillment_type: string;
  channel_id:       number;
  /** FK a customers (contexto ML / venta importada). */
  customer_id?:     number | null;
  status?:          string | null;
}

export type ChatStatus = 'UNASSIGNED' | 'PENDING_RESPONSE' | 'ATTENDED' | 'RE_OPENED';

export interface InboxChat {
  id:                number | string;
  phone:             string;
  source_type:       string;
  identity_status:   string;
  last_message_text: string;
  /** Dirección del último mensaje (listado inbox); parche SSE optimista. */
  last_message_direction?: string | null;
  last_message_at:   string | null;
  unread_count:      number | string;
  ml_order_id:       string | null;
  /** FK opcional a pregunta ML (crm_chats.ml_question_id) */
  ml_question_id?:   string | number | null;
  assigned_to:       number | null;
  customer_name:     string | null;
  customer_id:       number | string | null;
  order:             InboxOrder | null;
  /** Etapa del pipeline del chat. Calculado por backend (BE-1.9). */
  chat_stage?:       ChatStage;
  /**
   * ADR-007: canal de origen del chat. El backend puede exponerlo en el root
   * del objeto (canal directo) o via order.channel_id. Opcional hasta confirmar
   * que GET /api/inbox lo devuelve en la raíz.
   */
  channel_id?:       number | null;
  /** Estado omnicanal (webhook-receiver). Opcional para compatibilidad con mocks. */
  status?:           ChatStatus;
  sla_deadline_at?:  string | null;
  last_outbound_at?: string | null;
  /** UI-only: presencia derivada de SSE (no viene del listado inicial). */
  viewing_user_name?: string | null;
  /** UI-only: urgencia derivada de SSE o enriquecimiento local. */
  is_urgent?:        boolean;
  /** Bloque 2 BE — GET /api/inbox extendido. Defensivo: puede no venir en legacy. */
  has_active_exception?:  boolean;
  top_exception_reason?:  string | null;
  top_exception_code?:    string | null;
  /** Derivado de status en UI — bot activo cuando status es UNASSIGNED. */
  handoff_active?:        boolean;
  /**
   * Último mensaje del hilo es inbound (BE listInbox). P1: pendiente de respuesta del agente.
   */
  customer_waiting_reply?: boolean;
  /**
   * TRUE cuando el número está en whitelist con mode='muted' (personal de empresa).
   * Aparece en bandeja con badge "NO CLIENTE" y sin pipeline de ventas.
   */
  is_operational?:        boolean;
  /** Timestamp ISO del último mensaje inbound (columna crm_chats.last_inbound_at). */
  last_inbound_at?:       string | null;
  /**
   * Solo para source_type='fb_page': ISO timestamp en que expira la ventana de
   * mensajería estándar de Meta (last_inbound_at + 24 h). Null si no hay inbound.
   * El frontend bloquea el input de respuesta cuando Date.now() supera este valor.
   */
  fb_window_expires_at?:  string | null;
}

export interface InboxCounts {
  total:           number;
  unread:          number;
  payment_pending: number;
  quote:           number;
  dispatch:        number;
}

export interface ChatMessageContent {
  text:      string | null;
  caption:   string | null;
  mediaUrl:  string | null;
  mimeType:  string | null;
  /** Duración del adjunto de audio en segundos (si el backend la envía) */
  duration?: number;
  /** URL de miniatura para poster de video (opcional) */
  thumbnailUrl?: string | null;
}

export interface ChatMessage {
  id:                  string | number;
  chat_id:             string | number;
  customer_id:         string | number | null;
  external_message_id: string | null;
  direction:           "inbound" | "outbound";
  type:                string;
  content:             ChatMessageContent;
  sent_by:             string | null;
  is_read:             boolean;
  is_priority:         boolean;
  created_at:          string;
  ai_reply_status:     string | null;
  ai_reply_text:       string | null;
}

export interface InboxFilters {
  filter: string;
  src:    string;
  search: string;
  limit:  number;
  /** Coma-separado: contact, quote, … (mismo vocabulario que el backend). */
  stage:  string;
  /** no_conversion | converted | in_progress */
  result: string;
  /**
   * true (default): `?pipeline_default=1` — lista alineada a pipeline ventas (24 h WA contacto,
   * 48 h cotización, orden/pago/despacho hasta cierre; pendientes primero).
   */
  pipelineDefault?: boolean;
}
