/**
 * Tipos para la vista supervisor del mockup (ADR-009).
 * NO confundir con /bandeja (vista secundaria de chats individuales).
 */

export interface SupervisorKPIs {
  bot_resolved: {
    percentage: number;
    count_today: number;
    count_total_today: number;
  };
  waiting_buyer: {
    count: number;
    by_stage: {
      approval: number;
      payment: number;
      delivery: number;
      rating: number;
    };
  };
  exceptions: {
    count: number;
  };
  closed_today: {
    count: number;
    amount_usd: number;
  };
}

export type WaitingReason = 'approval' | 'payment' | 'delivery' | 'rating';

export const WAITING_REASON_LABELS: Record<WaitingReason, string> = {
  approval: 'Aprobación',
  payment: 'Pago',
  delivery: 'Entrega',
  rating: 'Calificar',
};

export const WAITING_REASON_COLORS: Record<WaitingReason, string> = {
  approval: 'default',
  payment: 'purple',
  delivery: 'green',
  rating: 'orange',
};

export interface WaitingItem {
  id: number;
  customer_name: string;
  customer_initials: string;
  stage_reason: WaitingReason;
  stage_description: string;
  bot_log: string;
  amount_usd: number;
  since_iso: string;
  chat_id?: number;
  order_id?: number;
}

export type ExceptionKind =
  | 'payment_no_match'
  | 'stock_zero_no_supplier'
  | 'unhappy_customer'
  | 'ambiguity_unresolved'
  | 'high_amount_policy';

export const EXCEPTION_KIND_LABELS: Record<ExceptionKind, string> = {
  payment_no_match: 'PAGO SIN MATCH',
  stock_zero_no_supplier: 'STOCK CERO · SIN PROVEEDOR',
  unhappy_customer: 'CLIENTE INSATISFECHO',
  ambiguity_unresolved: 'AMBIGÜEDAD · NO RESUELTA',
  high_amount_policy: 'MONTO ALTO · REVISIÓN POLÍTICA',
};

export interface SupervisorException {
  id: number;
  kind: ExceptionKind;
  title: string;
  detail: string;
  primary_action: {
    label: string;
    kind: 'primary' | 'secondary';
  };
  secondary_action?: {
    label: string;
    kind: 'primary' | 'secondary';
  };
  chat_id?: number;
  order_id?: number;
  created_at: string;
}
