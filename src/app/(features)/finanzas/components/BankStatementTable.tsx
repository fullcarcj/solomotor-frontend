"use client";

import { useState, useEffect } from "react";
import type { BankStatement, FinanceCategory } from "@/types/finanzas";

function fmtDate(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtBs(v: number | string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    MATCHED:       { cls: "bg-success",   label: "Conciliado" },
    UNMATCHED:     { cls: "bg-warning",   label: "Sin conciliar" },
    MANUAL_REVIEW: { cls: "bg-info",      label: "Revisión" },
  };
  const cfg = map[status] ?? { cls: "bg-secondary", label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

interface JustifyModalProps {
  statement: BankStatement | null;
  categories: FinanceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

function JustifyModal({ statement, categories, onClose, onSuccess }: JustifyModalProps) {
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  if (!statement) return null;

  const handleSubmit = async () => {
    if (!categoryId) { setErr("Selecciona una categoría"); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/finanzas/debits/${statement.id}/justify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, notes }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const json = await res.json().catch(() => ({}));
        setErr((json as { error?: string }).error ?? "Error al justificar");
      }
    } catch {
      setErr("Error de red");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Justificar débito</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-2 small text-muted">
              <strong>Referencia:</strong> {statement.reference_number || "—"} —{" "}
              <strong>Monto:</strong>{" "}
              <span className="text-danger">{fmtBs(statement.amount)}</span>
            </div>
            <p className="small text-muted mb-3 text-truncate">{statement.description}</p>

            {err && (
              <div className="alert alert-danger py-2 small">{err}</div>
            )}

            <div className="mb-3">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Notas</label>
              <textarea
                className="form-control"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descripción o motivo del débito…"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1" />Guardando…</>
              ) : (
                "Justificar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="placeholder-glow">
          <td><span className="placeholder col-5" /></td>
          <td><span className="placeholder col-6" /></td>
          <td><span className="placeholder col-8" /></td>
          <td><span className="placeholder col-3" /></td>
          <td><span className="placeholder col-5" /></td>
          <td><span className="placeholder col-4" /></td>
          <td><span className="placeholder col-3" /></td>
        </tr>
      ))}
    </>
  );
}

interface Props {
  rows:       BankStatement[];
  loading:    boolean;
  onRefetch:  () => void;
}

export default function BankStatementTable({ rows, loading, onRefetch }: Props) {
  const [justifying, setJustifying]   = useState<BankStatement | null>(null);
  const [categories, setCategories]   = useState<FinanceCategory[]>([]);
  const [toast, setToast]             = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/finanzas/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data ?? json;
        if (Array.isArray(list)) setCategories(list as FinanceCategory[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="position-relative">
      {/* Toast */}
      {toast && (
        <div
          className="toast show position-fixed bottom-0 end-0 m-3 bg-success text-white"
          style={{ zIndex: 9999 }}
        >
          <div className="toast-body d-flex align-items-center gap-2">
            <i className="ti ti-check" /> {toast}
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Referencia</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Monto Bs</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  Sin movimientos para los filtros seleccionados
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="text-nowrap">{fmtDate(row.tx_date)}</td>
                  <td>
                    <code className="small">{row.reference_number || "—"}</code>
                  </td>
                  <td className="small" style={{ maxWidth: 280 }}>
                    <span title={row.description}>
                      {row.description?.length > 40
                        ? `${row.description.substring(0, 40)}…`
                        : row.description || "—"}
                    </span>
                  </td>
                  <td>
                    {row.tx_type === "CREDIT" ? (
                      <span className="badge bg-success">Crédito</span>
                    ) : (
                      <span className="badge bg-danger">Débito</span>
                    )}
                  </td>
                  <td className={`fw-semibold ${row.tx_type === "DEBIT" ? "text-danger" : "text-success"}`}>
                    {fmtBs(row.amount)}
                  </td>
                  <td><StatusBadge status={row.reconciliation_status} /></td>
                  <td>
                    {row.tx_type === "DEBIT" && row.reconciliation_status === "UNMATCHED" && (
                      <button
                        type="button"
                        className="btn btn-outline-warning btn-sm"
                        onClick={() => setJustifying(row)}
                      >
                        Justificar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {justifying && (
        <JustifyModal
          statement={justifying}
          categories={categories}
          onClose={() => setJustifying(null)}
          onSuccess={() => {
            setToast("Débito justificado correctamente");
            onRefetch();
          }}
        />
      )}
    </div>
  );
}
