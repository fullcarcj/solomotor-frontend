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
  /** Tipo de tasa aplicada (ej. 'NATIVE_VES', 'BCV', 'BINANCE'). */
  rate_type?: string | null;
  /** Total en Bolívares según la tasa aplicada al momento de la importación. */
  total_amount_bs?: number | null;
  /** Tasa Bs/USD aplicada al importar. */
  exchange_rate_bs_per_usd?: number | null;
  /** Nombre del cliente resuelto (customers.full_name o buyer del raw_json ML). */
  customer_name?: string | null;
  /** Teléfonos del `customers` del pedido (`phone` / `phone_2` / `alternative_phone`). */
  customer_phones_line?: string | null;
  /** `customers.primary_ml_buyer_id` — misma línea 3 que en Bandeja. */
  customer_primary_ml_buyer_id?: number | null;
  /** Id numérico de orden en API ML (`orders/{id}`), desde `external_order_id` tipo `{ml_user_id}-{order_id}`. */
  ml_api_order_id?: number | null;
  /** Resumen `feedback.sale` en ML: vendedor → comprador (`ml_orders.feedback_sale`). */
  ml_feedback_sale?: string | null;
  /** Resumen `feedback.purchase`: comprador → vendedor. */
  ml_feedback_purchase?: string | null;
  /** `site_id` de la orden ML (MLV, MLA, …) para enlaces al sitio. */
  ml_site_id?: string | null;
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
