"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

const ADJUST_REASONS = [
  { value: "ADJUSTMENT",      label: "Ajuste manual" },
  { value: "INVENTORY_COUNT", label: "Conteo físico" },
  { value: "RETURN",          label: "Devolución" },
  { value: "TRANSFER",        label: "Transferencia" },
];

interface ProductHit { sku: string; name: string; }

function parseProducts(d: unknown): ProductHit[] {
  const o = d as Record<string, unknown>;
  const data = (o?.data as Record<string, unknown>) ?? o;
  const raw = data?.products ?? o?.products;
  return Array.isArray(raw) ? (raw as ProductHit[]) : [];
}

export default function AdjustStockModal({ open, onClose, onSuccess }: Props) {
  const [skuQ, setSkuQ]       = useState("");
  const [skuHits, setSkuHits] = useState<ProductHit[]>([]);
  const [skuLoading, setSkuLoading] = useState(false);
  const [sku, setSku]         = useState("");
  const skuDebRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [binId, setBinId]   = useState<string>("");
  const [delta, setDelta]   = useState<string>("");
  const [reason, setReason] = useState("ADJUSTMENT");
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  /* reset on open */
  useEffect(() => {
    if (open) {
      setSkuQ(""); setSku(""); setSkuHits([]);
      setBinId(""); setDelta(""); setReason("ADJUSTMENT");
      setNotes(""); setError(null);
    }
  }, [open]);

  /* SKU autocomplete */
  useEffect(() => {
    if (skuDebRef.current) clearTimeout(skuDebRef.current);
    if (sku || skuQ.trim().length < 2) { setSkuHits([]); return; }
    skuDebRef.current = setTimeout(async () => {
      setSkuLoading(true);
      try {
        const r = await fetch(`/api/inventario/productos?search=${encodeURIComponent(skuQ)}&limit=6`, { credentials: "include" });
        setSkuHits(parseProducts(await r.json().catch(() => ({}))));
      } catch { setSkuHits([]); } finally { setSkuLoading(false); }
    }, 300);
  }, [skuQ, sku]);

  function selectSku(p: ProductHit) {
    setSku(p.sku);
    setSkuQ(p.sku);
    setSkuHits([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const skuFinal = sku || skuQ.trim();
    if (!skuFinal)        { setError("El SKU es requerido."); return; }
    if (!binId)           { setError("El Bin ID es requerido."); return; }
    if (!delta)           { setError("El delta es requerido."); return; }
    const deltaNum = Number(delta);
    if (!Number.isFinite(deltaNum) || deltaNum === 0) { setError("El delta debe ser un número distinto de cero."); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/inventario/ajuste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_sku: skuFinal,
          bin_id:      Number(binId),
          delta:       deltaNum,
          reason,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Ajuste manual de stock</h5>
            <button className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body d-flex flex-column gap-3">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              {/* SKU */}
              <div>
                <label className="form-label fw-semibold">SKU <span className="text-danger">*</span></label>
                <div className="position-relative">
                  <input
                    className="form-control"
                    placeholder="Buscar por SKU o nombre…"
                    value={skuQ}
                    autoComplete="off"
                    onChange={e => { setSkuQ(e.target.value); if (sku) setSku(""); }}
                  />
                  {skuLoading && (
                    <span className="position-absolute end-0 top-50 translate-middle-y pe-2">
                      <span className="spinner-border spinner-border-sm text-muted" />
                    </span>
                  )}
                  {skuHits.length > 0 && (
                    <ul className="list-group position-absolute w-100 z-3 shadow-sm" style={{ top: "100%", maxHeight: 180, overflowY: "auto" }}>
                      {skuHits.map(p => (
                        <li key={p.sku} className="list-group-item list-group-item-action py-1" style={{ cursor: "pointer" }} onClick={() => selectSku(p)}>
                          <code className="text-body me-2">{p.sku}</code>
                          <small className="text-muted">{p.name}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {sku && <small className="text-success"><i className="ti ti-check me-1" />SKU seleccionado: <strong>{sku}</strong></small>}
              </div>

              {/* Bin ID */}
              <div>
                <label className="form-label fw-semibold">Bin ID <span className="text-danger">*</span></label>
                <input type="number" min={1} className="form-control" value={binId} onChange={e => setBinId(e.target.value)} placeholder="Ej. 1" />
              </div>

              {/* Delta */}
              <div>
                <label className="form-label fw-semibold">Delta disponible <span className="text-danger">*</span></label>
                <input type="number" step="1" className="form-control" value={delta} onChange={e => setDelta(e.target.value)} placeholder="Ej. +10 o -5" />
                <small className="text-muted">Número positivo para aumentar stock, negativo para reducir.</small>
              </div>

              {/* Reason */}
              <div>
                <label className="form-label fw-semibold">Razón</label>
                <select className="form-select" value={reason} onChange={e => setReason(e.target.value)}>
                  {ADJUST_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notas</label>
                <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descripción opcional del ajuste…" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-warning" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-adjustments me-2" />}
                Aplicar ajuste
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
