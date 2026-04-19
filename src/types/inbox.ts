/**
 * Reexport de etapas de chat: definición canónica en `src/constants/chatStage.ts`
 * para que el bundler no trate los valores como tipos erasables.
 */
import type { ChatStage } from '@/constants/chatStage';

export type { ChatStage } from '@/constants/chatStage';
export { CHAT_STAGE_LABELS, CHAT_STAGE_ORDER } from '@/constants/chatStage';

export interface InboxOrder {
  id:               number;
  payment_status:   string;
  fulfillment_type: string;
  channel_id:       number;
}

export interface InboxChat {
  id:                number | string;
  phone:             string;
  source_type:       string;
  identity_status:   string;
  last_message_text: string;
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
}
