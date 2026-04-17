export interface OverviewToday {
  orders_count: number;
  revenue_bs: number | string;
  revenue_usd: number | string;
  collected_bs: number | string;
  pending_bs: number | string;
  pending_orders: number;
  overdue_orders: number;
  new_customers: number;
  messages_received: number;
  auto_reconciled: number;
  manual_pending: number;
}

export interface OverviewChanges {
  orders_pct: number | null;
  revenue_pct: number | null;
}

export interface OverviewAlert {
  type: string;
  count: number;
  severity: "high" | "medium" | "low" | string;
}

export interface OverviewData {
  today: OverviewToday;
  yesterday: { orders_count: number; revenue_bs: number };
  changes: OverviewChanges;
  alerts: OverviewAlert[];
}

export interface RealtimeData {
  last_60min: {
    orders: number;
    revenue_bs: number | string;
    chats: number;
  };
  reconciliation_worker: {
    last_match_at: string | null;
    matched_today: number;
    manual_today: number;
  };
}
