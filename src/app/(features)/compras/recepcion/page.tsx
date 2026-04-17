"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NewPurchaseLine, Supplier } from "@/types/compras";
import { all_routes } from "@/data/all_routes";

/* ── helpers ───────────────────────────────────────────────────────────────── */
function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmtUSD(v: number): string {
  return `$${v.toFixed(2)}`;
}

/* ── ProductRow (state for each cart line) ─────────────────────────────────── */
interface LineRow extends NewPurchaseLine {
  _key: string;
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function RecepcionPage() {
  const router = useRouter();

  /* supplier */
  const [supplierQ, setSupplierQ]         = useState("");
  const [supplierHits, setSupplierHits]   = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierLoading, setSupplierLoading]   = useState(false);
  const supplierDebRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* form */
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [notes, setNotes]               = useState("");
  const [lines, setLines]               = useState<LineRow[]>([]);

  /* product search */
  const [productQ, setProductQ]       = useState("");
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const productDebRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* exchange rate */
  const [rate, setRate] = useState<number | null>(null);

  /* submit */
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  /* ── Supplier autocomplete ─────────────────────────────────────────────── */
  useEffect(() => {
    if (selectedSupplier) return;
    if (supplierDebRef.current) clearTimeout(supplierDebRef.current);
    if (supplierQ.trim().length < 2) { setSupplierHits([]); return; }
    supplierDebRef.current = setTimeout(async () => {
      setSupplierLoading(true);
      try {
        const r = await fetch(`/api/compras/proveedores?search=${encodeURIComponent(supplierQ)}&limit=8`, { credentials: "include" });
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        const rows = Array.isArray(d.data) ? (d.data as Supplier[]) : Array.isArray(d) ? (d as Supplier[]) : [];
        setSupplierHits(rows);
      } catch { setSupplierHits([]); } finally { setSupplierLoading(false); }
    }, 300);
  }, [supplierQ, selectedSupplier]);

  function selectSupplier(s: Supplier) {
    setSelectedSupplier(s);
    setSupplierQ(s.name);
    setSupplierHits([]);
  }
  function clearSupplier() {
    setSelectedSupplier(null);
    setSupplierQ("");
    setSupplierHits([]);
  }

  /* ── Exchange rate ─────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/currency/today", { credentials: "include" })
      .then(async r => {
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        const v = d.rate ?? d.value ?? d.bcv_rate ?? d.bcv;
        if (typeof v === "number" || typeof v === "string") setRate(Number(v));
      })
      .catch(() => null);
  }, []);

  /* ── Product search ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (productDebRef.current) clearTimeout(productDebRef.current);
    if (productQ.trim().length < 2) { setProductHits([]); return; }
    productDebRef.current = setTimeout(async () => {
      setProductLoading(true);
      try {
        const r = await fetch(`/api/inventario/productos?search=${encodeURIComponent(productQ)}&limit=8`, { credentials: "include" });
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        const data = (d.data as Record<string, unknown>) ?? d;
        const raw = data.products ?? d.products;
        setProductHits(Array.isArray(raw) ? (raw as ProductHit[]) : []);
      } catch { setProductHits([]); } finally { setProductLoading(false); }
    }, 300);
  }, [productQ]);

  function addProduct(p: ProductHit) {
    setLines(prev => [
      ...prev,
      {
        _key:          `${p.sku}-${Date.now()}`,
        product_sku:   p.sku,
        product_name:  p.name,
        quantity:      1,
        unit_cost_usd: 0,
        landed_cost_usd: undefined,
      },
    ]);
    setProductQ("");
    setProductHits([]);
  }

  function updateLine(key: string, field: keyof LineRow, val: string) {
    setLines(prev => prev.map(l => l._key === key ? { ...l, [field]: val === "" ? undefined : Number(val) } : l));
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(l => l._key !== key));
  }

  /* ── Totals ────────────────────────────────────────────────────────────── */
  const subtotalUSD = lines.reduce((sum, l) => sum + l.quantity * l.unit_cost_usd, 0);
  const totalUSD    = lines.reduce((sum, l) => {
    const cost = (l.landed_cost_usd !== undefined && l.landed_cost_usd > 0) ? l.landed_cost_usd : l.unit_cost_usd;
    return sum + l.quantity * cost;
  }, 0);
  const totalBs = rate ? totalUSD * rate : null;

  /* ── Submit ────────────────────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) { setSaveErr("Agrega al menos una línea de producto."); return; }
    setSaving(true);
    setSaveErr(null);
    const payload = {
      ...(selectedSupplier ? { supplier_id: selectedSupplier.id } : {}),
      purchase_date: purchaseDate,
      notes: notes.trim() || undefined,
      lines: lines.map(l => ({
        product_sku:   l.product_sku,
        quantity:      l.quantity,
        unit_cost_usd: l.unit_cost_usd,
        ...(l.landed_cost_usd ? { landed_cost_usd: l.landed_cost_usd } : {}),
      })),
    };
    try {
      const res = await fetch("/api/compras/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      showToast();
      router.push(all_routes.comprasOrdenes);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Toast ─────────────────────────────────────────────────────────────── */
  const [toastVisible, setToastVisible] = useState(false);
  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Toast */}
        {toastVisible && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show align-items-center text-bg-success border-0">
              <div className="d-flex">
                <div className="toast-body">
                  <i className="ti ti-check me-2" />
                  Recepción registrada — stock actualizado
                </div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastVisible(false)} />
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h4 className="page-title">Nueva Recepción</h4>
            <p className="text-muted mb-0">Registrar entrada de mercancía — stock se ajusta automáticamente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {saveErr && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
              <i className="ti ti-alert-circle" />
              {saveErr}
            </div>
          )}

          <div className="row g-3">
            {/* ── Columna izquierda: datos generales ─────────────────────── */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h6 className="card-title mb-0">Datos generales</h6>
                </div>
                <div className="card-body d-flex flex-column gap-3">
                  {/* Proveedor */}
                  <div>
                    <label className="form-label">Proveedor <span className="text-muted fw-normal">(opcional)</span></label>
                    <div className="position-relative">
                      <input
                        className="form-control"
                        placeholder="Buscar proveedor…"
                        value={supplierQ}
                        onChange={e => { setSupplierQ(e.target.value); if (selectedSupplier) clearSupplier(); }}
                        autoComplete="off"
                      />
                      {selectedSupplier && (
                        <button type="button" className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y" onClick={clearSupplier}>
                          <i className="ti ti-x" />
                        </button>
                      )}
                      {supplierLoading && (
                        <div className="position-absolute end-0 top-50 translate-middle-y pe-2">
                          <div className="spinner-border spinner-border-sm text-muted" />
                        </div>
                      )}
                      {supplierHits.length > 0 && (
                        <ul className="list-group position-absolute w-100 z-3 shadow-sm" style={{ top: "100%", maxHeight: 200, overflowY: "auto" }}>
                          {supplierHits.map(s => (
                            <li key={s.id} className="list-group-item list-group-item-action py-1 cursor-pointer" style={{ cursor: "pointer" }} onClick={() => selectSupplier(s)}>
                              <div className="fw-semibold">{s.name}</div>
                              <small className="text-muted">{s.country} · {s.currency ?? "USD"}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {selectedSupplier && (
                      <div className="mt-1">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                          <i className="ti ti-building-store me-1" />
                          {selectedSupplier.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="form-label">Fecha de recepción</label>
                    <input
                      type="date"
                      className="form-control"
                      value={purchaseDate}
                      onChange={e => setPurchaseDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="form-label">Notas</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Observaciones opcionales…"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Tasa BCV */}
                  <div className="mt-auto pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Tasa BCV del día</span>
                      <strong className="text-primary">
                        {rate !== null ? `Bs. ${rate.toFixed(2)}` : <span className="spinner-border spinner-border-sm" />}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Columna derecha: líneas ──────────────────────────────────── */}
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header">
                  <h6 className="card-title mb-0">Líneas de productos</h6>
                </div>
                <div className="card-body">
                  {/* Product search */}
                  <div className="position-relative mb-3">
                    <div className="input-group">
                      <span className="input-group-text bg-transparent">
                        <i className="ti ti-search text-muted" />
                      </span>
                      <input
                        className="form-control"
                        placeholder="Buscar producto por nombre o SKU…"
                        value={productQ}
                        onChange={e => setProductQ(e.target.value)}
                        autoComplete="off"
                      />
                      {productLoading && (
                        <span className="input-group-text bg-transparent">
                          <div className="spinner-border spinner-border-sm text-muted" />
                        </span>
                      )}
                    </div>
                    {productHits.length > 0 && (
                      <ul className="list-group position-absolute w-100 z-3 shadow-sm" style={{ top: "100%", maxHeight: 220, overflowY: "auto" }}>
                        {productHits.map(p => (
                          <li key={p.sku} className="list-group-item list-group-item-action py-1" style={{ cursor: "pointer" }} onClick={() => addProduct(p)}>
                            <div className="d-flex justify-content-between">
                              <span className="fw-semibold">{p.name}</span>
                              <code className="text-muted small">{p.sku}</code>
                            </div>
                            {p.stock_qty !== undefined && (
                              <small className="text-muted">Stock actual: {p.stock_qty}</small>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Lines table */}
                  {lines.length === 0 ? (
                    <div className="text-center text-muted py-4 border rounded">
                      <i className="ti ti-package-import fs-2 d-block mb-1" />
                      Busca y agrega productos arriba
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>SKU</th>
                            <th>Descripción</th>
                            <th style={{ width: 80 }}>Cant.</th>
                            <th style={{ width: 120 }}>Costo USD</th>
                            <th style={{ width: 130 }}>Landed Cost</th>
                            <th className="text-end">Total</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map(l => {
                            const cost = (l.landed_cost_usd && l.landed_cost_usd > 0) ? l.landed_cost_usd : l.unit_cost_usd;
                            const lineTotal = l.quantity * cost;
                            return (
                              <tr key={l._key}>
                                <td><code className="text-body small">{l.product_sku}</code></td>
                                <td className="small">{l.product_name ?? "—"}</td>
                                <td>
                                  <input
                                    type="number" min={1} className="form-control form-control-sm"
                                    value={l.quantity}
                                    onChange={e => updateLine(l._key, "quantity", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number" min={0} step="0.01" className="form-control form-control-sm"
                                    value={l.unit_cost_usd || ""}
                                    placeholder="0.00"
                                    onChange={e => updateLine(l._key, "unit_cost_usd", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number" min={0} step="0.01" className="form-control form-control-sm"
                                    value={l.landed_cost_usd ?? ""}
                                    placeholder="Opcional"
                                    onChange={e => updateLine(l._key, "landed_cost_usd", e.target.value)}
                                  />
                                </td>
                                <td className="text-end fw-semibold">{fmtUSD(lineTotal)}</td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeLine(l._key)}>
                                    <i className="ti ti-x" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              {lines.length > 0 && (
                <div className="card mt-3">
                  <div className="card-body">
                    <div className="row g-2 text-end">
                      <div className="col-md-4">
                        <small className="text-muted d-block">Subtotal USD</small>
                        <strong>{fmtUSD(subtotalUSD)}</strong>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">Total USD (con landed)</small>
                        <strong className="text-success fs-5">{fmtUSD(totalUSD)}</strong>
                      </div>
                      <div className="col-md-4">
                        <small className="text-muted d-block">
                          Total Bs{rate ? ` · Tasa ${rate.toFixed(2)}` : ""}
                        </small>
                        <strong>{totalBs !== null ? `Bs. ${totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Link href={all_routes.comprasOrdenes} className="btn btn-outline-secondary">
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving || lines.length === 0}>
              {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-package-import me-2" />}
              Registrar Recepción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── local type for product search hits ─────────────────────────────────────── */
interface ProductHit {
  sku:         string;
  name:        string;
  stock_qty?:  number;
  unit_price_usd?: number | string;
}
