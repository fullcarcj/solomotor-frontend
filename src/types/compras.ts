export interface Supplier {
  id:             number;
  name:           string;
  country:        string;
  lead_time_days: number;
  currency:       string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contact_info:   Record<string, any> | null;
  is_active:      boolean;
  created_at:     string;
}

export interface Purchase {
  id:            number;
  company_id:    number;
  supplier_id:   number | null;
  supplier_name: string | null;
  purchase_date: string;
  rate_applied:  number | string;
  rate_type:     string;
  subtotal_usd:  number | string;
  total_usd:     number | string;
  total_bs:      number | string | null;
  status:        string;
  notes:         string | null;
  created_at:    string;
  lines?:        PurchaseLine[];
}

export interface PurchaseLine {
  id:                  number;
  purchase_id:         number;
  product_sku:         string;
  quantity:            number | string;
  unit_cost_usd:       number | string;
  landed_cost_usd:     number | string | null;
  line_total_usd:      number | string;
  product_description: string | null;
  bin_id:              number | null;
  lot_id:              number | null;
}

export interface NewPurchaseLine {
  product_sku:      string;
  product_name?:    string;
  quantity:         number;
  unit_cost_usd:    number;
  landed_cost_usd?: number;
  bin_id?:          number;
}

export interface NewPurchasePayload {
  supplier_id?:   number;
  purchase_date?: string;
  notes?:         string;
  lines:          Omit<NewPurchaseLine, "product_name">[];
}

export interface NewSupplierPayload {
  name:            string;
  country?:        string;
  lead_time_days?: number;
  currency?:       string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contact_info?:   Record<string, any>;
}

export interface SupplierFilters {
  search:    string;
  is_active: string;
  limit:     number;
  offset:    number;
}

export interface PurchaseFilters {
  from:   string;
  to:     string;
  status: string;
  limit:  number;
  offset: number;
}

export interface ComprasPagination {
  total:    number;
  limit:    number;
  offset:   number;
  has_more?: boolean;
}
