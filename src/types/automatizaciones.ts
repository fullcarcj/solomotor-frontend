export interface AutomationPeriodStats {
  ml_messages: {
    a: number;
    b: number;
    c: number;
    total: number;
  };
  whatsapp_messages: {
    e: number;
    f: number;
    h: number;
    total: number;
  };
  questions_ia: {
    sent:   number;
    failed: number;
    total:  number;
  };
  post_sale: {
    sent:   number;
    failed: number;
    total:  number;
  };
}

export interface AutomationStats {
  today:  AutomationPeriodStats;
  month:  AutomationPeriodStats;
  active_configs: {
    post_sale:    boolean;
    tipo_e:       boolean;
    tipo_f:       boolean;
    questions_ia: boolean;
    ai_responder: boolean;
  };
}

export interface MlMessageLog {
  id:           number | string;
  message_kind: string;
  ml_order_id:  string | null;
  ml_buyer_id:  string | null;
  outcome:      string;
  created_at:   string;
  detail:       string | null;
  skip_reason:  string | null;
}

export interface WaMessageLog {
  id:                  number | string;
  message_kind:        "E" | "F" | "H";
  phone_number:        string | null;
  ml_order_id:         string | null;
  outcome:             string;
  sent_at:             string;
  error_message:       string | null;
  wasender_message_id: string | null;
}

export interface QuestionIaLog {
  id:             number | string;
  ml_question_id: string | null;
  item_id:        string | null;
  question_text:  string | null;
  answer_text:    string | null;
  outcome:        string;
  sent_at:        string;
  error_message:  string | null;
}

export interface PostSaleMessage {
  id:            number;
  message_order: number;
  message_text:  string;
  is_active:     boolean;
}

export interface LogMeta {
  total:  number;
  limit:  number;
  offset: number;
}
