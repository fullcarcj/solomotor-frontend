export interface ItemPreview {
  sku: string;
  name: string;
  qty: number;
  unit_price_usd: number | null;
  image_url: string | null;
}

export interface QuoteItemPreview {
  sku: string;
  name: string;
  qty: number;
  unit_price_usd: number | null;
  image_url: string | null;
}

export interface QuotePreview {
  id: number;
  total: number | null;
  status: string;
  items_count: number;
  items_preview: QuoteItemPreview[] | null;
}

export interface Sale {
  id: string | number;
  source: string;
  /** Cuenta Mercado Libre (`ml_accounts.ml_user_id`) cuando la fila es `sales_orders` ML. */
  ml_user_id?: number | null;
  /** Nickname en `ml_accounts` (misma fuente que `/cuentas`). */
  ml_account_nickname?: string | null;
  external_order_id: string | null;
  customer_id: number | null;
  chat_id: number | string | null;
  status: string;
  order_total_amount: number | string;
  total_amount_usd: number | string;
  total_usd: number | string;
  loyalty_points_earned: number;
  notes: string | null;
  sold_by: string | null;
  created_at: string;
  reconciled_statement_id: number | null;
  /** Cómo se entrega (CHECK en `sales_orders.fulfillment_type`); null = sin definir. */
  fulfillment_type?: string | null;
  /** Preview de los primeros 3 ítems del pedido (desde sales_order_items, ml_order_items o sale_lines). */
  items_preview?: ItemPreview[] | null;
  /** Resumen de la cotización activa vinculada, si existe. */
  quote_preview?: QuotePreview | null;
}

export interface SaleItem {
  id: number;
  product_id: number | null;
  sku: string;
  quantity: number | string;
  unit_price_usd: number | string;
  line_total_usd: number | string;
}

export interface SaleDetail extends Sale {
  total_amount_bs: number | string | null;
  exchange_rate_bs_per_usd: number | string | null;
  payment_method: string | null;
  lifecycle_status: string | null;
  ml_status: string | null;
  motivo_anulacion: string | null;
  items: SaleItem[];
}

export interface SalesMeta {
  total: number;
  limit: number;
  offset: number;
  exclude_completed_default: boolean;
}
