export interface Customer {
  id:                  number;
  full_name:           string;
  email:               string | null;
  phone:               string | null;
  phone_2:             string | null;
  alternative_phone:   string | null;
  crm_status:          string | null;
  customer_type:       string | null;
  client_segment:      string | null;
  total_orders:        number;
  total_spent_usd:     number | string;
  last_order_date:     string | null;
  first_order_date:    string | null;
  primary_ml_buyer_id: number | null;
  tags:                string[];
  is_active:           boolean;
  created_at:          string;
  wa_status:           string | null;
  wa_verified_name:    string | null;
  city:                string | null;
  address:             string | null;
}

export interface CustomerVehicle {
  id:          number;
  brand_name:  string;
  model_name:  string;
  year_start:  number | null;
  year_end:    number | null;
  engine_info: string | null;
  label:       string;
}

export interface CustomerDetail extends Customer {
  vehicles: CustomerVehicle[];
}

export interface CustomerHistoryItem {
  id:         string | number;
  date:       string;
  source:     string;
  total_usd:  number | string;
  status:     string;
}

export interface CustomersMeta {
  total:  number;
  limit:  number;
  offset: number;
}

export interface CustomerFilters {
  search: string;
  status: string;
  limit:  number;
  offset: number;
}

export interface CustomerOrder {
  source:       "mercadolibre" | "mostrador" | string;
  order_id:     string | number;
  ordered_at:   string;
  amount_usd:   number | string;
  currency:     string;
  order_status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items_json:   any | null;
}

export interface CustomerHistory {
  orders: CustomerOrder[];
  pagination: {
    total:    number;
    limit:    number;
    offset:   number;
    has_more: boolean;
  };
}

export interface CustomerHistoryFilters {
  source: string;
  from:   string;
  to:     string;
  limit:  number;
  offset: number;
}
