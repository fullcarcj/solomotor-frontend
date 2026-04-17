"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MovementFiltersState, MovementPagination, StockMovement } from "@/types/wms";
import MovementFiltersBar from "../components/MovementFilters";
import MovementTable from "../components/MovementTable";
import AdjustStockModal from "../components/AdjustStockModal";
import { useAppSelector } from "@/store/hooks";

const DEFAULT_FILTERS: MovementFiltersState = {
  sku: "", reason: "", reference_type: "", from: "", to: "", limit: 50, offset: 0,
};
const DEFAULT_PAGINATION: MovementPagination = { total: 0, limit: 50, offset: 0 };

const SUPERVISOR_ROLES = ["SUPERVISOR", "ADMIN", "SUPERADMIN", "admin", "supervisor", "superadmin"];

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error desconocido."; }

function parseMovements(raw: unknown): { rows: StockMovement[]; pagination: MovementPagination } {
  if (!raw || typeof raw !== "object") return { rows: [], pagination: DEFAULT_PAGINATION };
  const r = raw as Record<string, unknown>;
  const rows: StockMovement[] = Array.isArray(r.movements) ? (r.movements as StockMovement[])
    : Array.isArray(r.data)      ? (r.data as StockMovement[])
    : Array.isArray(raw)         ? (raw as StockMovement[])
    : [];
  const pagination: MovementPagination = {
    total:  typeof r.total    === "number" ? r.total    : rows.length,
    limit:  typeof r.limit    === "number" ? r.limit    : typeof r.pageSize === "number" ? r.pageSize : 50,
    offset: typeof r.offset   === "number" ? r.offset   : 0,
    page:   typeof r.page     === "number" ? r.page     : undefined,
  };
  return { rows, pagination };
}

export default function MovimientosPage() {
  const role = useAppSelector(s => s.auth.role ?? s.menu?.role);
  const canAdjust = SUPERVISOR_ROLES.includes(role ?? "");

  const [filters, setFiltersState] = useState<MovementFiltersState>(DEFAULT_FILTERS);
  const [movements, setMovements]   = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<MovementPagination>(DEFAULT_PAGINATION);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [toastMsg, setToastMsg]     = useState<string | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: MovementFiltersState) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f.sku)            p.set("sku",            f.sku);
      if (f.reason)         p.set("reason",         f.reason);
      if (f.reference_type) p.set("reference_type", f.reference_type);
      if (f.from)           p.set("from",           f.from);
      if (f.to)             p.set("to",             f.to);
      p.set("limit",  String(f.limit));
      p.set("offset", String(f.offset));
      const res = await fetch(`/api/inventario/movimientos?${p}`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((d.error as string) ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      const { rows, pagination: pg } = parseMovements(data);
      setMovements(rows);
      setPagination(pg);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const setFilters = useCallback((partial: Partial<MovementFiltersState>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...partial };
      // debounce SKU search
      if (partial.sku !== undefined && partial.sku !== prev.sku) {
        if (debRef.current) clearTimeout(debRef.current);
        debRef.current = setTimeout(() => void load(next), 300);
        return next;
      }
      void load(next);
      return next;
    });
  }, [load]);

  useEffect(() => { void load(DEFAULT_FILTERS); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => void load(filters), [load, filters]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Toast */}
        {toastMsg && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show align-items-center text-bg-success border-0">
              <div className="d-flex">
                <div className="toast-body"><i className="ti ti-check me-2" />{toastMsg}</div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMsg(null)} />
              </div>
            </div>
          </div>
        )}

        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h4 className="page-title">Movimientos de Inventario</h4>
            <p className="text-muted mb-0">Historial de movimientos WMS</p>
          </div>
          {canAdjust && (
            <button className="btn btn-warning d-flex align-items-center gap-2" onClick={() => setModalOpen(true)}>
              <i className="ti ti-adjustments" />
              Ajuste Manual
            </button>
          )}
        </div>

        <MovementFiltersBar filters={filters} onChange={setFilters} />

        <div className="card">
          <div className="card-body">
            <MovementTable
              movements={movements}
              pagination={pagination}
              loading={loading}
              error={error}
              onPageChange={(offset) => setFilters({ offset })}
            />
          </div>
        </div>

        <AdjustStockModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            showToast("Ajuste aplicado — stock actualizado");
            refetch();
          }}
        />
      </div>
    </div>
  );
}
