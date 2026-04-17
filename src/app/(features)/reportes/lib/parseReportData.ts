import type {
  CustomerReport,
  HourlyPoint,
  HourlyReport,
  InventoryReport,
  ProductReport,
  SalesReport,
} from "@/types/reportes";

export function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const d = (o.data ?? o) as T;
  return d ?? null;
}

export function parseSalesReport(raw: unknown): SalesReport | null {
  const d = unwrapData<Record<string, unknown>>(raw);
  if (!d) return null;
  return {
    period:        String(d.period ?? ""),
    total_bs:      d.total_bs ?? 0,
    total_usd:     d.total_usd ?? 0,
    total_orders:  Number(d.total_orders ?? 0),
    avg_ticket_bs: d.avg_ticket_bs ?? 0,
    chart:         Array.isArray(d.chart) ? (d.chart as SalesReport["chart"]) : [],
    by_source:     Array.isArray(d.by_source) ? (d.by_source as SalesReport["by_source"]) : [],
    by_seller:     Array.isArray(d.by_seller) ? (d.by_seller as SalesReport["by_seller"]) : [],
  };
}

export function parseInventoryReport(raw: unknown): InventoryReport | null {
  const d = unwrapData<Record<string, unknown>>(raw);
  if (!d || !d.summary) return null;
  const s = d.summary as InventoryReport["summary"];
  return {
    summary: {
      total_skus:      Number(s.total_skus ?? 0),
      total_units:     s.total_units ?? 0,
      stockout_count:  Number(s.stockout_count ?? 0),
      low_stock_count: Number(s.low_stock_count ?? 0),
      stock_value_usd: s.stock_value_usd ?? 0,
      ...(typeof (s as { skus_with_stock?: number }).skus_with_stock === "number"
        ? { skus_with_stock: (s as { skus_with_stock: number }).skus_with_stock }
        : {}),
    },
    top_stock:   Array.isArray(d.top_stock) ? (d.top_stock as InventoryReport["top_stock"]) : [],
    stockouts:   Array.isArray(d.stockouts) ? (d.stockouts as InventoryReport["stockouts"]) : [],
    by_category: Array.isArray(d.by_category) ? (d.by_category as InventoryReport["by_category"]) : [],
  };
}

export function parseCustomerReport(raw: unknown): CustomerReport | null {
  const d = unwrapData<Record<string, unknown>>(raw);
  if (!d) return null;
  return {
    total_active:    Number(d.total_active ?? 0),
    new_this_period: Number(d.new_this_period ?? 0),
    by_source:       Array.isArray(d.by_source) ? (d.by_source as CustomerReport["by_source"]) : [],
    top_customers:   Array.isArray(d.top_customers) ? (d.top_customers as CustomerReport["top_customers"]) : [],
    new_by_day:      Array.isArray(d.new_by_day) ? (d.new_by_day as CustomerReport["new_by_day"]) : [],
  };
}

export function parseProductReport(raw: unknown): ProductReport | null {
  const d = unwrapData<Record<string, unknown>>(raw);
  if (!d) return null;
  return {
    top_products: Array.isArray(d.top_products) ? (d.top_products as ProductReport["top_products"]) : [],
    chart:        Array.isArray(d.chart) ? (d.chart as ProductReport["chart"]) : [],
  };
}

export function parseHourlyReport(raw: unknown): HourlyReport {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const data = (o.data ?? o) as Record<string, unknown>;
  let points: HourlyPoint[] | undefined;
  if (Array.isArray(data.points)) points = data.points as HourlyPoint[];
  else if (Array.isArray(data.cells)) points = data.cells as HourlyPoint[];
  else if (Array.isArray(o.points)) points = o.points as HourlyPoint[];
  const matrix = Array.isArray(data.matrix) ? (data.matrix as number[][]) : undefined;
  return {
    points,
    matrix,
    weeks: typeof data.weeks === "number" ? data.weeks : undefined,
    meta: data as Record<string, unknown>,
  };
}

/** Agrega puntos en matriz 7×12 (cada columna = 2h) */
export function buildHeatmapMatrix(hr: HourlyReport): { orders: number[][]; revenue: number[][] } {
  const orders: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => 0));
  const revenue: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => 0));

  if (hr.matrix && hr.matrix.length === 7 && hr.matrix[0]?.length === 12) {
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 12; h++) {
        orders[d][h] = Number(hr.matrix[d][h]) || 0;
      }
    }
    return { orders, revenue };
  }

  const pts = hr.points ?? [];
  for (const p of pts) {
    const dow = p.day_of_week ?? p.dow;
    const hour = p.hour;
    if (dow === undefined || hour === undefined) continue;
    const d = ((dow % 7) + 7) % 7;
    const col = Math.min(11, Math.max(0, Math.floor(Number(hour) / 2)));
    orders[d][col] += Number(p.orders ?? 0);
    revenue[d][col] += Number(p.revenue_bs ?? 0);
  }
  return { orders, revenue };
}
