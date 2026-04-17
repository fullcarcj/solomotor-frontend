/**
 * Resumen de pedido para historial (GET /api/sales con include_completed=1).
 * "Procesado" por canal lo define el backend; ver comentarios en la página /ventas/historial.
 */
export interface SalesOrderSummary {
  id: string;
  source: string;
  source_id: number;
  customer_id: number | null;
  customer_name: string | null;
  status: string;
  total_usd: number | null;
  notes: string | null;
  created_at: string;
}

export interface SalesHistorialResponse {
  orders: SalesOrderSummary[];
  total: number;
  limit: number;
  offset: number;
}
