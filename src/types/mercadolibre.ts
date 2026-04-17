export interface MlStatsOrders {
  count:            number;
  revenue_bs:       number | string;
  paid_count:       number;
  cancelled_count:  number;
}

export interface MlStatsQuestions {
  answered_period: number;
  pending_total:   number;
}

export interface MlStatsListings {
  total:      number;
  active:     number;
  paused:     number;
  zero_stock: number;
}

export interface MlStats {
  period:    string;
  orders:    MlStatsOrders;
  questions: MlStatsQuestions;
  listings:  MlStatsListings;
}

export interface MlListing {
  item_id:            string;
  title:              string;
  status:             string;
  price:              number | string;
  currency_id:        string;
  available_quantity: number | string;
  sold_quantity:      number | string;
  listing_type:       string;
  category_id:        string;
  permalink:          string;
}

export interface MlPublication {
  item_id:            string;
  local_sku:          string | null;
  title:              string;
  stock_qty:          number | string;
  available_quantity: number | string;
  sync_status:        string;
  last_synced_at:     string | null;
  permalink:          string | null;
}

export interface MlQuestion {
  ml_question_id: string;
  item_id:        string;
  question_text:  string;
  answer_text:    string | null;
  ml_status:      string;
  buyer_id:       string;
  date_created:   string;
  answered_at:    string | null;
  item_title:     string | null;
  item_price:     number | string | null;
}

export interface MlReputationSales {
  total:               number;
  completed:           number;
  cancelled:           number;
  completion_rate_pct: number | string;
}

export interface MlReputationApiHealth {
  calls_24h:        number;
  success_24h:      number;
  success_rate_pct: number | string;
}

export interface MlReputation {
  source:      string;
  period_days: number;
  sales:       MlReputationSales;
  api_health:  MlReputationApiHealth;
}

export interface MlProfitabilityFees {
  sale_fee_usd:         number | string;
  shipping_usd:         number | string;
  taxes_usd:            number | string;
  total_deductions_usd: number | string;
}

export interface MlProfitability {
  period:         string;
  orders_count:   number;
  revenue_usd:    number | string;
  fees:           MlProfitabilityFees;
  payout_usd:     number | string;
  avg_margin_pct: number | string;
}
