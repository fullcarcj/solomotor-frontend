/** Cotización (listado global inventario_presupuesto + join cliente). */

export interface Quotation {
  id: number;
  reference: string;
  status: "draft" | "sent" | string;
  total: number | string;
  fecha_vencimiento: string | null;
  fecha_creacion: string;
  channel_id: number | null;
  chat_id: number | null;
  cliente_id: number;
  cliente_nombre: string | null;
  created_by: number | null;
  items_count: number | string;
}

/** Normaliza filas de cliente desde distintas formas de respuesta del API. */
export function pickClienteRows(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[];
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const data = o.data ?? o;
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const inner = d.customers ?? d.rows ?? d.items ?? d.data;
    if (Array.isArray(inner)) return inner as Record<string, unknown>[];
  }
  return [];
}

export interface QuotationItem {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface NewQuotationPayload {
  cliente_id: number;
  items: QuotationItem[];
  chat_id?: number;
  channel_id?: number;
  observaciones?: string;
  fecha_vencimiento?: string;
}

export interface QuotationPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
