/** Tipos de bandeja omnicanal (alineados al contrato de API). */

export type InboxSourceType =
  | "wa_inbound"
  | "ml_question"
  | "ml_message"
  | "wa_ml_linked";

export type IdentityStatus = "unknown" | "auto_matched" | "declared" | "manual_linked";

export type LifecycleStage =
  | "contact"
  | "quote"
  | "order"
  | "payment"
  | "dispatch"
  | "closed"
  | "ml_answer";

export type PaymentStatus = "pending" | "approved" | null;

export interface InboxOrderLite {
  id?: number;
  payment_status?: string | null;
}

export interface InboxChat {
  id: number;
  source_type: InboxSourceType;
  customer_name: string;
  phone: string | null;
  last_message_text: string;
  last_message_at: Date;
  unread_count: number;
  identity_status: IdentityStatus;
  lifecycle_stage: LifecycleStage;
  payment_status: PaymentStatus;
  channel_id: number;
  customer_id?: number | null;
  order?: InboxOrderLite | null;
  identity_candidates?: unknown;
  /** Para meta "ML · orden #…" */
  ml_order_number?: string | null;
}

export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "system" | "ml_answer" | string;

export interface InboxMessage {
  id: number;
  direction: MessageDirection;
  type: MessageType;
  content: { text: string };
  created_at: Date;
  media_url?: string | null;
  pending?: boolean;
  error?: boolean;
}

/** Filtros de vista (Col 1). */
export type InboxViewFilter =
  | null
  | "unread"
  | "payment_pending"
  | "quote"
  | "dispatch";

/** Filtro fuente / tarea ML (Col 1). */
export type InboxSrcFilter =
  | null
  | "wa"
  | "ml"
  | "ml_question"
  | "ml_message"
  | "wa_ml_linked";

export interface InboxCounts {
  total: number;
  unread: number;
  payment_pending: number;
  quote: number;
  dispatch: number;
  wa: number;
  ml: number;
  ml_question: number;
  ml_message: number;
  wa_ml_linked: number;
}
