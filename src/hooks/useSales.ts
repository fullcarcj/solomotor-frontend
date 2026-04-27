"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Sale, SalesMeta, ItemPreview, QuotePreview, QuoteItemPreview } from "@/types/sales";

export interface SalesFilters {
  status?: string;
  source?: string;
  from?: string;
  to?: string;
  include_completed?: boolean;
  limit?: number;
  offset?: number;
}

function errMessage(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    const err = o.error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const m = (err as { message?: string }).message;
      if (typeof m === "string") return m;
    }
    const m = o.message;
    if (typeof m === "string") return m;
  }
  return "No se pudieron cargar las ventas.";
}

function normalizeSale(raw: Record<string, unknown>): Sale {
  const rawId = raw.id;
  const id: string | number =
    typeof rawId === "string"
      ? rawId
      : typeof rawId === "number"
        ? rawId
        : String(rawId ?? "");
  const mlUid = raw.ml_user_id;
  const mlNick = raw.ml_account_nickname;
  return {
    id,
    source: String(raw.source ?? ""),
    ml_user_id:
      mlUid != null && Number.isFinite(Number(mlUid)) && Number(mlUid) > 0
        ? Number(mlUid)
        : null,
    ml_account_nickname:
      mlNick != null && String(mlNick).trim() !== ""
        ? String(mlNick).trim()
        : null,
    external_order_id:
      raw.external_order_id == null ? null : String(raw.external_order_id),
    customer_id: raw.customer_id == null ? null : Number(raw.customer_id),
    chat_id: (() => {
      const v = raw.chat_id;
      if (v == null || String(v).trim() === "") return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    status: String(raw.status ?? ""),
    order_total_amount: (raw.order_total_amount as number | string) ?? 0,
    total_amount_usd: (raw.total_amount_usd as number | string) ?? 0,
    total_usd: (raw.total_usd as number | string) ?? 0,
    loyalty_points_earned: Number(raw.loyalty_points_earned) || 0,
    notes: raw.notes == null ? null : String(raw.notes),
    sold_by: raw.sold_by == null ? null : String(raw.sold_by),
    created_at: String(raw.created_at ?? ""),
    reconciled_statement_id:
      raw.reconciled_statement_id == null
        ? null
        : Number(raw.reconciled_statement_id),
    fulfillment_type:
      raw.fulfillment_type == null || String(raw.fulfillment_type).trim() === ""
        ? null
        : String(raw.fulfillment_type).trim(),
    items_preview: normalizeItemPreviews(raw.items_preview),
    quote_preview: normalizeQuotePreview(raw.quote_preview),
    rate_type:
      raw.rate_type != null && String(raw.rate_type).trim() !== ""
        ? String(raw.rate_type).trim()
        : null,
    total_amount_bs:
      raw.total_amount_bs != null && Number.isFinite(Number(raw.total_amount_bs))
        ? Number(raw.total_amount_bs)
        : null,
    exchange_rate_bs_per_usd:
      raw.exchange_rate_bs_per_usd != null && Number.isFinite(Number(raw.exchange_rate_bs_per_usd))
        ? Number(raw.exchange_rate_bs_per_usd)
        : null,
    customer_name:
      raw.customer_name != null && String(raw.customer_name).trim() !== ""
        ? String(raw.customer_name).trim()
        : null,
    customer_phones_line:
      raw.customer_phones_line != null && String(raw.customer_phones_line).trim() !== ""
        ? String(raw.customer_phones_line).trim()
        : null,
    customer_primary_ml_buyer_id:
      raw.customer_primary_ml_buyer_id != null &&
      Number.isFinite(Number(raw.customer_primary_ml_buyer_id)) &&
      Number(raw.customer_primary_ml_buyer_id) > 0
        ? Number(raw.customer_primary_ml_buyer_id)
        : null,
    ml_api_order_id:
      raw.ml_api_order_id != null && Number.isFinite(Number(raw.ml_api_order_id))
        ? Number(raw.ml_api_order_id)
        : null,
    ml_feedback_sale:
      raw.ml_feedback_sale != null && String(raw.ml_feedback_sale).trim() !== ""
        ? String(raw.ml_feedback_sale).trim()
        : null,
    ml_feedback_purchase:
      raw.ml_feedback_purchase != null && String(raw.ml_feedback_purchase).trim() !== ""
        ? String(raw.ml_feedback_purchase).trim()
        : null,
    ml_site_id:
      raw.ml_site_id != null && String(raw.ml_site_id).trim() !== ""
        ? String(raw.ml_site_id).trim().toUpperCase()
        : null,
  };
}

function normalizeItemPreviews(raw: unknown): ItemPreview[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((r: unknown) => {
    const item = r as Record<string, unknown>;
    return {
      sku: String(item.sku ?? ""),
      name: String(item.name ?? item.sku ?? ""),
      qty: Number(item.qty) || 1,
      unit_price_usd:
        item.unit_price_usd != null && Number.isFinite(Number(item.unit_price_usd))
          ? Number(item.unit_price_usd)
          : null,
      image_url:
        item.image_url != null && String(item.image_url).trim() !== ""
          ? String(item.image_url).trim()
          : null,
    };
  });
}

function normalizeQuotePreview(raw: unknown): QuotePreview | null {
  if (raw == null || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const id = Number(q.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const itemsRaw = q.items_preview;
  let items: QuoteItemPreview[] | null = null;
  if (Array.isArray(itemsRaw) && itemsRaw.length > 0) {
    items = itemsRaw.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        sku: String(item.sku ?? ""),
        name: String(item.name ?? item.sku ?? ""),
        qty: Number(item.qty) || 1,
        unit_price_usd:
          item.unit_price_usd != null && Number.isFinite(Number(item.unit_price_usd))
            ? Number(item.unit_price_usd)
            : null,
        image_url:
          item.image_url != null && String(item.image_url).trim() !== ""
            ? String(item.image_url).trim()
            : null,
      };
    });
  }
  return {
    id,
    total:
      q.total != null && Number.isFinite(Number(q.total)) ? Number(q.total) : null,
    status: String(q.status ?? ""),
    items_count: Number(q.items_count) || 0,
    items_preview: items,
  };
}

function parseResponse(json: unknown): {
  sales: Sale[];
  meta: SalesMeta;
} {
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;

  const rawList =
    (Array.isArray(data) ? data : null) ??
    (data.sales as unknown[]) ??
    (data.items as unknown[]) ??
    (Array.isArray(o.data) ? (o.data as unknown[]) : null) ??
    [];

  const sales = rawList.map((x) =>
    normalizeSale(x as Record<string, unknown>)
  );

  const m = (data.meta ?? o.meta) as Record<string, unknown> | undefined;
  const meta: SalesMeta = {
    total: Number(m?.total) || 0,
    limit: Number(m?.limit) || 100,
    offset: Number(m?.offset) || 0,
    exclude_completed_default: Boolean(m?.exclude_completed_default),
  };

  return { sales, meta };
}

export function useSales() {
  const [filters, setFilters] = useState<SalesFilters>({
    limit: 100,
    offset: 0,
  });

  const effectiveFilters = useMemo(
    () => filters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filters.status,
      filters.source,
      filters.from,
      filters.to,
      filters.include_completed,
      filters.limit,
      filters.offset,
    ]
  );

  const [sales, setSales] = useState<Sale[]>([]);
  const [meta, setMeta] = useState<SalesMeta>({
    total: 0,
    limit: 100,
    offset: 0,
    exclude_completed_default: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const f = effectiveFilters;
      if (f.status) params.set("status", f.status);
      if (f.source) params.set("source", f.source);
      if (f.from) params.set("from", f.from);
      if (f.to) params.set("to", f.to);
      if (f.include_completed) params.set("include_completed", "1");
      if (f.limit != null) params.set("limit", String(f.limit));
      if (f.offset != null) params.set("offset", String(f.offset));

      const res = await fetch(`/api/ventas/pedidos?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const raw: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(errMessage(raw));
        setSales([]);
        return;
      }

      const { sales: list, meta: m } = parseResponse(raw);
      setSales(list);
      setMeta(m);
    } catch {
      setError("Error de red al cargar ventas.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    sales,
    meta,
    loading,
    error,
    filters,
    setFilters,
    refetch: load,
  };
}
