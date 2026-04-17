"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/hooks/useProducts";
import { pickClienteRows } from "@/types/quotations";

type ClienteOpt = { id: number; label: string };

type Line = {
  key: string;
  product: Product;
  cantidad: number;
  precio_unitario: number;
};

function defaultVencimientoDate(): string {
  const d = new Date();
  d.setTime(d.getTime() + 48 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function parseClientes(json: unknown): ClienteOpt[] {
  return pickClienteRows(json)
    .map((r) => {
      const id = Number(r.id);
      const label = String(
        r.nombre ?? r.name ?? r.razon_social ?? r.razonSocial ?? ""
      ).trim();
      return {
        id,
        label: label || `Cliente #${id}`,
      };
    })
    .filter((c) => Number.isFinite(c.id) && c.id > 0);
}

function parseProducts(json: unknown): Product[] {
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  const raw = data.products;
  if (!Array.isArray(raw)) return [];
  return raw as Product[];
}

function errFromJson(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const e = o.error;
    if (e && typeof e === "object") {
      const m = (e as { message?: string }).message;
      if (typeof m === "string") return m;
    }
    const m = o.message;
    if (typeof m === "string") return m;
  }
  return "No se pudo crear la cotización.";
}

export default function NewQuotationModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteLabel, setClienteLabel] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [clientes, setClientes] = useState<ClienteOpt[]>([]);
  const [clientLoading, setClientLoading] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productHits, setProductHits] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  const [lines, setLines] = useState<Line[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState(defaultVencimientoDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedClientSearch(clientSearch), 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    if (!open) return;
    if (step !== 1 || debouncedClientSearch.trim().length < 2) {
      setClientes([]);
      return;
    }
    let alive = true;
    setClientLoading(true);
    void (async () => {
      try {
        const params = new URLSearchParams({
          search: debouncedClientSearch.trim(),
          limit: "10",
        });
        const res = await fetch(`/api/clientes/directorio?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (!alive) return;
        setClientes(parseClientes(json));
      } catch {
        if (alive) setClientes([]);
      } finally {
        if (alive) setClientLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, step, debouncedClientSearch]);

  useEffect(() => {
    if (!open) return;
    if (step !== 2 || debouncedProductSearch.trim().length < 2) {
      setProductHits([]);
      return;
    }
    let alive = true;
    setProductLoading(true);
    void (async () => {
      try {
        const params = new URLSearchParams({
          search: debouncedProductSearch.trim(),
          limit: "20",
        });
        const res = await fetch(`/api/inventario/productos?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (!alive) return;
        setProductHits(parseProducts(json));
      } catch {
        if (alive) setProductHits([]);
      } finally {
        if (alive) setProductLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, step, debouncedProductSearch]);

  const resetForm = useCallback(() => {
    setStep(1);
    setClienteId(null);
    setClienteLabel("");
    setClientSearch("");
    setDebouncedClientSearch("");
    setClientes([]);
    setProductSearch("");
    setDebouncedProductSearch("");
    setProductHits([]);
    setLines([]);
    setObservaciones("");
    setFechaVencimiento(defaultVencimientoDate());
    setError(null);
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const totalModal = useMemo(() => {
    return lines.reduce(
      (s, l) => s + l.cantidad * l.precio_unitario,
      0
    );
  }, [lines]);

  const addProduct = (p: Product) => {
    const price = Number(p.unit_price_usd);
    const precio = Number.isFinite(price) ? price : 0;
    setLines((L) => [
      ...L,
      {
        key: `${p.id}-${Date.now()}`,
        product: p,
        cantidad: 1,
        precio_unitario: precio,
      },
    ]);
    setProductSearch("");
    setProductHits([]);
  };

  const removeLine = (key: string) => {
    setLines((L) => L.filter((l) => l.key !== key));
  };

  const updateLine = (
    key: string,
    field: "cantidad" | "precio_unitario",
    value: number
  ) => {
    setLines((L) =>
      L.map((l) =>
        l.key === key ? { ...l, [field]: value } : l
      )
    );
  };

  const submit = async () => {
    if (clienteId == null || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        cliente_id: clienteId,
        items: lines.map((l) => ({
          producto_id: l.product.id,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        })),
        observaciones: observaciones.trim() || undefined,
        fecha_vencimiento: fechaVencimiento || undefined,
      };
      const res = await fetch("/api/ventas/cotizaciones", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(errFromJson(json));
        return;
      }
      onSuccess();
    } catch {
      setError("Error de red al crear la cotización.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Nueva cotización</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onClose}
            />
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <div className="d-flex gap-2 mb-3 small text-muted">
              <span className={step === 1 ? "fw-bold text-dark" : ""}>
                1. Cliente
              </span>
              <span>→</span>
              <span className={step === 2 ? "fw-bold text-dark" : ""}>
                2. Productos
              </span>
              <span>→</span>
              <span className={step === 3 ? "fw-bold text-dark" : ""}>
                3. Opciones
              </span>
            </div>

            {step === 1 && (
              <div>
                <label className="form-label">Buscar cliente</label>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Nombre o documento…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  autoComplete="off"
                />
                {clientLoading && (
                  <div className="small text-muted mt-1">Buscando…</div>
                )}
                <ul className="list-group mt-2">
                  {clientes.map((c) => (
                    <li key={c.id} className="list-group-item list-group-item-action">
                      <button
                        type="button"
                        className="btn btn-link text-start text-decoration-none p-0 w-100"
                        onClick={() => {
                          setClienteId(c.id);
                          setClienteLabel(c.label);
                        }}
                      >
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
                {clienteId != null && (
                  <p className="mt-2 mb-0 small">
                    Seleccionado: <strong>{clienteLabel}</strong> (id{" "}
                    {clienteId})
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <label className="form-label">Agregar producto</label>
                <input
                  type="search"
                  className="form-control"
                  placeholder="SKU o nombre (mín. 2 caracteres)…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoComplete="off"
                />
                {productLoading && (
                  <div className="small text-muted mt-1">Buscando…</div>
                )}
                <ul className="list-group mt-2">
                  {productHits.map((p) => (
                    <li
                      key={p.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>
                        <span className="font-monospace small me-2">{p.sku}</span>
                        {p.name}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => addProduct(p)}
                      >
                        Agregar
                      </button>
                    </li>
                  ))}
                </ul>

                <h6 className="mt-4">Líneas</h6>
                {lines.length === 0 ? (
                  <p className="text-muted small">Agrega al menos un producto.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ width: 100 }}>Cantidad</th>
                          <th style={{ width: 120 }}>Precio USD</th>
                          <th style={{ width: 60 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l) => (
                          <tr key={l.key}>
                            <td className="small">{l.product.name}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min={1}
                                value={l.cantidad}
                                onChange={(e) =>
                                  updateLine(
                                    l.key,
                                    "cantidad",
                                    Math.max(1, Number(e.target.value) || 1)
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min={0}
                                step="0.01"
                                value={l.precio_unitario}
                                onChange={(e) =>
                                  updateLine(
                                    l.key,
                                    "precio_unitario",
                                    Number(e.target.value) || 0
                                  )
                                }
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeLine(l.key)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="fw-semibold mt-2 mb-0">
                  Total: ${totalModal.toFixed(2)} USD
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label">Fecha de vencimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                  <div className="form-text">Por defecto: hoy + 48 h</div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer flex-wrap gap-2">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
              >
                Atrás
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  submitting ||
                  (step === 1 && clienteId == null) ||
                  (step === 2 && lines.length === 0)
                }
                onClick={() => setStep((s) => s + 1)}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting || clienteId == null || lines.length === 0}
                onClick={() => void submit()}
              >
                {submitting ? "Creando…" : "Crear cotización"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
