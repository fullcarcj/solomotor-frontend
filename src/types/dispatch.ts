export interface DispatchRecord {
  dispatch_id:     number;
  sale_id:         number;
  sale_table:      "sales" | "sales_orders";
  channel:         string;
  status:          "pending" | "ready_to_ship" | "shipped" | "cancelled";
  requested_by:    string | null;
  requested_at:    string | null;
  dispatched_by:   string | null;
  dispatched_at:   string | null;
  notes:           string | null;
  tracking_number: string | null;
  warehouse_id:    number | null;
  order_reference: string | null;
  customer_id:     number | null;
  total_usd:       number | string | null;
  sale_date:       string | null;
}

export interface DispatchPagination {
  total:    number;
  limit:    number;
  offset:   number;
  has_more: boolean;
}

export interface ConfirmDispatchPayload {
  tracking_number?: string;
  notes?:           string;
  bin_movements?:   { bin_id: number; sku: string; qty: number }[];
}

export interface RequestDispatchPayload {
  sale_id:       number;
  sale_table:    "sales" | "sales_orders";
  channel:       string;
  notes?:        string;
  warehouse_id?: number;
}
