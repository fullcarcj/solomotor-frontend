export interface PnlRevenue {
  mercadolibre: number | string;
  mostrador:    number | string;
  ecommerce:    number | string;
  social_media: number | string;
  total_bs:     number | string;
  total_usd:    number | string;
}

export interface PnlData {
  period:           string;
  revenue:          PnlRevenue;
  expenses:         { total_bs: number | string };
  gross_profit_bs:  number | string;
  gross_margin_pct: number | string;
  chart_monthly:    { month: string; revenue_bs: number | string }[];
}

export interface SalesStatsBySource {
  source:   string;
  total_bs: number | string;
  orders:   number;
}

export interface SalesStatsBySeller {
  seller:   string;
  total_bs: number | string;
  orders:   number;
}

export interface SalesStats {
  period:        string;
  total_bs:      number | string;
  total_usd:     number | string;
  total_orders:  number;
  avg_ticket_bs: number | string;
  by_source:     SalesStatsBySource[];
  by_seller:     SalesStatsBySeller[];
}
