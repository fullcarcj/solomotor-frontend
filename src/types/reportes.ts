export interface SalesChartDay {
  date:           string;
  mercadolibre:   number | string;
  mostrador:      number | string;
  ecommerce:      number | string;
  social_media:   number | string;
  total:          number | string;
}

export interface SalesBySource {
  source:         string;
  orders:         number;
  revenue_bs:     number | string;
  pct_of_total:   number | string;
  avg_ticket_bs:  number | string;
  cancelled_pct:  number | string;
}

export interface SalesBySeller {
  seller:     string;
  orders:     number;
  revenue_bs: number | string;
}

export interface SalesReport {
  period:        string;
  total_bs:      number | string;
  total_usd:     number | string;
  total_orders:  number;
  avg_ticket_bs: number | string;
  chart:         SalesChartDay[];
  by_source:     SalesBySource[];
  by_seller:     SalesBySeller[];
}

export interface InventoryReport {
  summary: {
    total_skus:        number;
    total_units:       number | string;
    stockout_count:    number;
    low_stock_count:   number;
    stock_value_usd:   number | string;
    /** Si el backend lo envía, preferir sobre total_skus − stockout_count */
    skus_with_stock?: number;
  };
  top_stock:   { sku: string; name: string; qty: number }[];
  stockouts:   { sku: string; name: string; category: string }[];
  by_category: { category: string; skus: number; total_units: number }[];
}

export interface CustomerReport {
  total_active:    number;
  new_this_period: number;
  by_source:       { source: string; count: number }[];
  top_customers:   {
    customer_id:    number;
    full_name:      string;
    total_spent_bs: number | string;
    orders_count:   number;
    last_purchase:  string | null;
  }[];
  new_by_day:      { date: string; count: number }[];
}

export interface ProductReport {
  top_products: {
    sku:           string;
    part_name:     string;
    units_sold:    number;
    revenue_usd:   number | string;
    avg_price_usd: number | string;
    orders_count:  number;
  }[];
  chart: { sku: string; name: string; value: number }[];
}

/** Punto para heatmap horario (API flexible) */
export interface HourlyPoint {
  day_of_week?: number;
  dow?:         number;
  hour?:        number;
  orders?:      number;
  revenue_bs?:  number | string;
}

export interface HourlyReport {
  points?: HourlyPoint[];
  matrix?: number[][];
  weeks?:  number;
  meta?:   Record<string, unknown>;
}
