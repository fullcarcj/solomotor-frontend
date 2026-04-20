export type ExceptionStatus = 'OPEN' | 'RESOLVED';

export type ExceptionCode =
  | 'SKU_NOT_FOUND'
  | 'PRICE_CONFLICT'
  | 'STOCK_INSUFFICIENT'
  | 'CLIENT_DATA_MISSING'
  | 'PAYMENT_AMBIGUOUS'
  | 'MANUAL_REVIEW_REQUESTED'
  | 'AI_LOW_CONFIDENCE'
  | string; // defensivo

export const EXCEPTION_CODE_LABELS: Record<string, string> = {
  SKU_NOT_FOUND:            'SKU no encontrado',
  PRICE_CONFLICT:           'Conflicto de precio',
  STOCK_INSUFFICIENT:       'Stock insuficiente',
  CLIENT_DATA_MISSING:      'Datos del cliente faltantes',
  PAYMENT_AMBIGUOUS:        'Pago ambiguo',
  MANUAL_REVIEW_REQUESTED:  'Revisión manual solicitada',
  AI_LOW_CONFIDENCE:        'IA baja confianza',
};

export const EXCEPTION_CODE_COLORS: Record<string, string> = {
  SKU_NOT_FOUND:            '#ef4444',
  PRICE_CONFLICT:           '#f97316',
  STOCK_INSUFFICIENT:       '#eab308',
  CLIENT_DATA_MISSING:      '#6366f1',
  PAYMENT_AMBIGUOUS:        '#ec4899',
  MANUAL_REVIEW_REQUESTED:  '#8b5cf6',
  AI_LOW_CONFIDENCE:        '#06b6d4',
};

export interface Exception {
  id: number;
  chat_id: number;
  code: ExceptionCode;
  reason: string;
  status: ExceptionStatus;
  created_by: number | null;
  created_at: string;
  resolved_by: number | null;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface ExceptionResolveInput {
  resolution_notes: string;
}

export interface ExceptionCreateInput {
  chat_id: number;
  code: ExceptionCode;
  reason: string;
}
