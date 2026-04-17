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
  assigned_to:       number | null;
  customer_name:     string | null;
  order:             InboxOrder | null;
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
