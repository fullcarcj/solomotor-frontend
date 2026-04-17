export interface StockMovement {
  id:                number | string;
  bin_id:            number;
  product_sku:       string;
  reason:            string;
  reference_id:      string | null;
  reference_type:    string | null;
  user_id:           number | null;
  notes:             string | null;
  created_at:        string;
  old_qty_available: number | string;
  old_qty_reserved:  number | string;
  new_qty_available: number | string;
  new_qty_reserved:  number | string;
  delta_available:   number | string;
  delta_reserved:    number | string;
}

export interface CompatResult {
  compat_id:       number;
  producto_sku:    string;
  descripcion:     string;
  precio_usd:      number | string | null;
  stock_available: number | string;
  stock_reserved:  number | string;
  make_name:       string;
  model_name:      string;
  year_start:      number;
  year_end:        number;
  displacement_l:  number | string | null;
}

export interface Equivalence {
  sku_original:            string;
  sku_equivalente:         string;
  descripcion_equivalente: string;
  precio_equivalente:      number | string | null;
  stock_disponible:        number | string;
}

export type MovementReason =
  | "PURCHASE_RECEIPT"
  | "SALE_DISPATCH"
  | "ADJUSTMENT"
  | "RESERVATION"
  | "COMMITMENT"
  | "RELEASE"
  | "TRANSFER"
  | "INVENTORY_COUNT"
  | "RETURN";

export interface MovementFiltersState {
  sku:            string;
  reason:         string;
  reference_type: string;
  from:           string;
  to:             string;
  limit:          number;
  offset:         number;
}

export interface MovementPagination {
  total:    number;
  limit:    number;
  offset:   number;
  page?:    number;
  pageSize?: number;
}
