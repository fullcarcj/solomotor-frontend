"use client";

import { useState } from "react";
import type { CustomerOrder, CustomerHistory } from "@/types/customers";
import OrderSourceBadge from "./OrderSourceBadge";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-VE", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function fmtUsd(v: number | string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function shortId(id: string | number, source: string): string {
  const s = String(id);
  if (source === "mercadolibre" && s.length > 8) {
    return `…${s.slice(-8)}`;
  }
  return s;
}

function statusBadge(status: string): React.ReactNode {
  const map: Record<string, { bg: string; label: string }> = {
    paid:      { bg: "success",  label: "Pagado"    },
    cancelled: { bg: "danger",   label: "Cancelado" },
    pending:   { bg: "warning text-dark", label: "Pendiente" },
  };
  const key = (status ?? "").toLowerCase();
  const cfg = map[key] ?? { bg: "secondary", label: status || "—" };
  return <span className={`badge bg-${cfg.bg}`}>{cfg.label}</span>;
}

/* ── Tipos de items_json ─────────────────────────────────────────────────── */

interface OrderItem {
  sku?:        string;
  title?:      string;
  name?:       string;
  quantity?:   number;
  qty?:        number;
  unit_price?: number;
  price?:      number;
}

function parseItems(raw: unknown): OrderItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OrderItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ── Fila expandible ─────────────────────────────────────────────────────── */

function OrderRow({ order }: { order: CustomerOrder }) {
  const [expanded, setExpanded] = useState(false);
  const items = parseItems(order.items_json);
  const hasItems = items.length > 0;

  return (
    <>
      <tr
        style={{ cursor: hasItems ? "pointer" : "default" }}
        onClick={() => hasItems && setExpanded((v) => !v)}
      >
        <td className="text-nowrap small">{fmtDateTime(order.ordered_at)}</td>
        <td><OrderSourceBadge source={order.source} /></td>
        <td>
          <code className="small user-select-all">
            {shortId(order.order_id, order.source)}
          </code>
          {hasItems && (
            <i
              className={`ti ti-chevron-${expanded ? "up" : "down"} ms-1 text-muted`}
              style={{ fontSize: 11 }}
            />
          )}
        </td>
        <td className="text-end fw-semibold">{fmtUsd(order.amount_usd)}</td>
        <td>
          <span className="badge bg-light text-dark border">
            {order.currency || "USD"}
          </span>
        </td>
        <td>{statusBadge(order.order_status)}</td>
      </tr>

      {/* Sub-tabla de ítems */}
      {expanded && items.length > 0 && (
        <tr className="table-active">
          <td colSpan={6} className="px-4 py-2">
            <table className="table table-sm table-borderless mb-0">
              <thead>
                <tr className="small text-muted">
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-end">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="small">
                    <td className="text-muted">{item.sku ?? "—"}</td>
                    <td>{item.title ?? item.name ?? "—"}</td>
                    <td className="text-center">{item.quantity ?? item.qty ?? "—"}</td>
                    <td className="text-end">
                      {fmtUsd(item.unit_price ?? item.price ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i}>
          <span className="placeholder-glow d-block">
            <span className="placeholder col-8 rounded" />
          </span>
        </td>
      ))}
    </tr>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  orders:       CustomerOrder[];
  pagination:   CustomerHistory["pagination"];
  loading:      boolean;
  error:        string | null;
  onPageChange: (offset: number) => void;
  onRetry:      () => void;
}

/* ── Componente principal ────────────────────────────────────────────────── */

export default function OrderHistoryTable({
  orders,
  pagination,
  loading,
  error,
  onPageChange,
  onRetry,
}: Props) {
  const totalPages  = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <>
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center gap-3 mb-3"
          role="alert"
        >
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={onRetry}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Fecha</th>
                <th>Canal</th>
                <th>ID Orden</th>
                <th className="text-end">Monto USD</th>
                <th>Moneda</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">
                    <i className="ti ti-inbox fs-30 d-block mb-2 text-muted opacity-50" />
                    Este cliente no tiene compras registradas
                  </td>
                </tr>
              )}

              {!loading &&
                orders.map((order, i) => (
                  <OrderRow key={`${String(order.order_id)}-${i}`} order={order} />
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && pagination.total > pagination.limit && (
          <div className="card-footer d-flex align-items-center justify-content-between py-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage <= 1}
              onClick={() =>
                onPageChange(Math.max(0, pagination.offset - pagination.limit))
              }
            >
              <i className="ti ti-chevron-left me-1" />
              Anterior
            </button>

            <span className="small text-muted">
              Página <strong>{currentPage}</strong> de{" "}
              <strong>{totalPages}</strong>
              {" · "}{pagination.total} compras
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!pagination.has_more && currentPage >= totalPages}
              onClick={() => onPageChange(pagination.offset + pagination.limit)}
            >
              Siguiente
              <i className="ti ti-chevron-right ms-1" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
