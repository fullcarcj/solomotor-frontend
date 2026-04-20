export type BotActionType =
  | 'auto_reply'
  | 'classification'
  | 'entity_extraction'
  | 'intent_detection'
  | 'handoff_decision'
  | string; // defensivo para tipos nuevos del backend

export interface BotAction {
  id: number;
  chat_id: number;
  action_type: BotActionType;
  payload: Record<string, unknown>;
  duration_ms: number | null;
  confidence: number | null;
  correlation_id: string | null;
  is_reviewed: boolean;
  is_correct: boolean | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface BotActionReviewInput {
  is_correct: boolean;
  review_notes?: string;
}
