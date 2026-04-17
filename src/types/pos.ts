/** Punto de venta — POST /api/pos/sales */

export interface CartLine {
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
}

export interface PaymentLine {
  payment_method_code: string;
  payment_method_label: string;
  amount_usd: number;
}

export interface TodayRate {
  rate_date: string;
  active_rate_type: string;
  active_rate: number | string;
  bcv_rate: number | string;
  binance_rate: number | string;
}

export interface PosSalePayload {
  company_id?: number;
  customer_id?: number;
  lines: {
    product_sku: string;
    quantity: number;
    unit_price_usd: number;
  }[];
  payments?: { payment_method_code: string; amount_usd: number }[];
  notes?: string;
  status?: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  rate_snapshot?: {
    rate_applied: number;
    rate_type: string;
    rate_date: string;
  };
}

export interface PaymentMethodOption {
  code: string;
  label: string;
  applies_igtf: boolean;
}
