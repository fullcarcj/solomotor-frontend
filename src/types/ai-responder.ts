/**
 * Tipos centralizados del módulo AI Responder.
 * Estos types reflejan el shape REAL actual del backend.
 * Los campos marcados con TODO(backend) aún no son expuestos
 * por el backend — se aplica degradación elegante en la UI.
 */

// ── Log (today_log_by_action) ──────────────────────────────────────────────

export interface AiResponderLogEntry {
  action_taken: string;
  n: number;
}

// ── Stats (/api/ai-responder/stats) ───────────────────────────────────────

export interface AiResponderStats {
  /** Conteo agrupado por acción del día (today_log_by_action). */
  today_log_by_action: AiResponderLogEntry[];
  /** Conteo por estado de ai_reply_status de hoy. */
  today_by_status: {
    ai_replied:        number;
    needs_human_review: number;
    skipped:           number;
    processing:        number;
    pending:           number;
  };
  /** Mensajes con ai_reply_status = 'pending' en cola. */
  pending_count:         number;
  /** Mensajes con ai_reply_status = 'needs_human_review'. */
  needs_review_count:    number;
  /** Alias global de mensajes en revisión pendiente (todas las fechas). */
  total_pending_count:   number;
  /** Mensajes archivados como legacy (referencia histórica). */
  legacy_archived_count: number;
  force_send:            boolean;
  human_review_gate:     boolean;

  // TODO(backend): los campos siguientes no existen aún en el payload actual.
  // Cuando el backend los exponga, se usarán directamente; mientras, se infieren.

  /** Si el bot está habilitado. TODO(backend): no disponible · asume true si no presente. */
  enabled?: boolean;
  /** Si el worker está corriendo. TODO(backend): no disponible · se infiere de last_cycle_at. */
  worker_running?: boolean;
  /** ISO timestamp del último ciclo. TODO(backend): no disponible · muestra "—". */
  last_cycle_at?: string | null;
  /**
   * Totales del día en el shape nuevo.
   * TODO(backend): no disponible · se derivan de today_by_status + today_log_by_action.
   */
  today_messages?: {
    total:          number;
    needs_review:   number;
    ai_replied:     number;
    human_replied:  number;
    human_rejected: number;
    errors:         number;
  };
}

// ── Pending messages (/api/ai-responder/pending) ───────────────────────────

export interface AiPendingMessageContent {
  text:         string | null;
  caption:      string | null;
  mediaUrl:     string | null;
  mimeType:     string | null;
  duration?:    number;
  thumbnailUrl?: string | null;
}

export interface AiPendingMessage {
  id:                   string;
  chat_id:              string;
  customer_id:          string | null;
  ai_reply_status:      'needs_human_review';
  ai_reply_text:        string | null;
  ai_reasoning:         string | null;
  content:              AiPendingMessageContent;
  created_at:           string;
  chat_phone:           string | null;
  source_type:          string | null;
  channel_id:           number | null;
  customer_full_name:   string | null;
  customer_segment:     string | null;
  message_text_preview: string | null;
}

export interface AiPendingResponse {
  ok:    boolean;
  rows:  AiPendingMessage[];
  total: number;
}

// ── Log entries (/api/ai-responder/log) ───────────────────────────────────

export type AiResponderLogAction =
  | 'sent'
  | 'error'
  | 'rejected'
  | 'draft_saved'
  | 'human_replied'
  | 'legacy_archived'
  | 'legacy_archived_block_attempt';

export type AiResponderLogProvider = 'groq' | 'human' | 'system';

export interface AiResponderLogRow {
  id:            number;
  /** ID del mensaje CRM (inbound) asociado al evento; backend envía `crm_message_id`. */
  message_id:    number | null;
  customer_id:   number | null;
  action_taken:  AiResponderLogAction;
  provider_used: AiResponderLogProvider;
  /** Texto entrante del cliente que disparó la respuesta (columna `input_text` en BD). */
  input_text:    string | null;
  reasoning:     string | null;
  created_at:    string;
}

export interface AiResponderLogResponse {
  ok:   boolean;
  rows: AiResponderLogRow[];
}

// ── Ops logs (/api/ai-responder/ops-logs) ─────────────────────────────────

export interface AiUsageLogRow {
  id:             number;
  provider_id:    string;
  function_called: string;
  tokens_input:   number | null;
  tokens_output:  number | null;
  latency_ms:     number | null;
  success:        boolean;
  error_message:  string | null;
  created_at:     string;
}

export interface AiReceiptAttemptRow {
  id:                   number;
  chat_id:              number | null;
  customer_id:          number | null;
  firebase_url:         string | null;
  is_receipt:           boolean | null;
  prefiler_score:       string | number | null;
  prefiler_reason:      string | null;
  extracted_reference:  string | null;
  extracted_amount_bs:  string | number | null;
  extracted_date:       string | null;
  extraction_confidence: string | number | null;
  /** Resultado del extractor Gemini: ok, parsed_empty, vision_error, json_parse, … */
  extraction_status: string | null;
  /** Mensaje de error o explicación cuando la extracción no fue útil. */
  extraction_error: string | null;
  /** Recorte de la respuesta del modelo si falló el parseo JSON (diagnóstico). */
  extraction_raw_snippet: string | null;
  reconciliation_status: string | null;
  reconciled_order_id:  number | null;
  created_at:           string;
  /** Derivado en backend según estado de extracción y conciliación. */
  pipeline_error_type:  string;
}

export interface AiResponderOpsLogsResponse {
  ok:                   boolean;
  days?:                number;
  name_analysis_logs:   AiUsageLogRow[];
  receipt_vision_logs:  AiUsageLogRow[];
  receipt_attempts:     AiReceiptAttemptRow[];
  receipt_schema_note?: string | null;
  error?:               string;
}
