"use client";

import CommonFooter from "@/core/common/footer/commonFooter";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsSideBar from "../settingssidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsTaxRow {
  key: string;
  value: string;
  value_type: string;
  description: string | null;
  effective_from: string;
  updated_at?: string;
}

interface IgtfRow {
  rate_pct: number;
  rate_pct_display: string;
  effective_from: string;
}

interface ActiveData {
  date: string;
  settings_tax: SettingsTaxRow[];
  igtf: IgtfRow | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("es-VE", {
    day: "2-digit", month: "short", year: "numeric",
  });

const TAX_KEY_LABELS: Record<string, string> = {
  iva_pct: "IVA",
  iva_reducido_pct: "IVA Reducido",
  iva_exento: "IVA Exento",
  isrl_pct: "ISLR",
  iva_retencion_pct: "Retención IVA",
  islr_retencion_pct: "Retención ISLR",
};

const fmtPct = (key: string, value: string) => {
  const lower = key.toLowerCase();
  if (lower.includes("pct") || lower.includes("rate")) {
    const n = Number(value);
    return isFinite(n) ? `${(n * 100).toFixed(2)} %` : value;
  }
  return value;
};

type ToastType = "success" | "danger";
interface Toast { id: number; type: ToastType; msg: string; }
let _tid = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaxRatesComponent() {
  // Active data
  const [active, setActive] = useState<ActiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // History table
  const [history, setHistory] = useState<SettingsTaxRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // New IVA form
  const [ivaForm, setIvaForm] = useState({ value: "", effective_from: "" });
  const [savingIva, setSavingIva] = useState(false);
  const [ivaError, setIvaError] = useState<string | null>(null);

  // New IGTF form
  const [igtfForm, setIgtfForm] = useState({ value: "", effective_from: "" });
  const [savingIgtf, setSavingIgtf] = useState(false);
  const [igtfError, setIgtfError] = useState<string | null>(null);

  // New arbitrary key form
  const [keyForm, setKeyForm] = useState({ key: "", value: "", description: "", effective_from: "" });
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const keyModalRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, type, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);

  // ── Fetch active ───────────────────────────────────────────────────────────

  const fetchActive = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/tax-rules/active", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setActive(body);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch history ──────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/config/tax-rules", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setHistory(body.settings_tax ?? []);
    } catch (e) {
      addToast(String(e), "danger");
    } finally {
      setLoadingHistory(false);
    }
  }, [addToast]);

  useEffect(() => { fetchActive(); }, [fetchActive]);
  useEffect(() => { if (showHistory) fetchHistory(); }, [showHistory, fetchHistory]);

  // ── Save tax rule ──────────────────────────────────────────────────────────

  const saveTaxRule = async (
    key: string,
    value: string,
    effective_from: string,
    description?: string,
    onError?: (msg: string) => void,
    onDone?: () => void,
  ) => {
    try {
      const numVal = Number(value) / 100;
      if (!isFinite(numVal) || numVal < 0) throw new Error("Valor inválido");
      const res = await fetch("/api/config/tax-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          key,
          value: String(numVal),
          value_type: "number",
          effective_from,
          description: description || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      addToast(`${key} actualizado desde ${fmtDate(effective_from)}.`);
      fetchActive();
      if (showHistory) fetchHistory();
      onDone?.();
    } catch (e) {
      onError?.(String(e));
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveIva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIva(true);
    setIvaError(null);
    await saveTaxRule(
      "iva_pct",
      ivaForm.value,
      ivaForm.effective_from,
      `IVA vigente desde ${ivaForm.effective_from}`,
      setIvaError,
      () => setIvaForm({ value: "", effective_from: "" }),
    );
    setSavingIva(false);
  };

  const handleSaveIgtf = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIgtf(true);
    setIgtfError(null);
    await saveTaxRule(
      "igtf_pct",
      igtfForm.value,
      igtfForm.effective_from,
      `IGTF vigente desde ${igtfForm.effective_from}`,
      setIgtfError,
      () => setIgtfForm({ value: "", effective_from: "" }),
    );
    setSavingIgtf(false);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setKeyError(null);
    await saveTaxRule(
      keyForm.key,
      keyForm.value,
      keyForm.effective_from,
      keyForm.description,
      setKeyError,
      () => {
        setKeyForm({ key: "", value: "", description: "", effective_from: "" });
        closeKeyModal();
      },
    );
    setSavingKey(false);
  };

  const closeKeyModal = () => {
    const el = keyModalRef.current;
    if (!el) return;
    el.style.display = "none";
    el.classList.remove("show");
    document.body.classList.remove("modal-open");
  };

  const openKeyModal = () => {
    setKeyForm({ key: "", value: "", description: "", effective_from: "" });
    setKeyError(null);
    const el = keyModalRef.current;
    if (!el) return;
    el.style.display = "block";
    el.classList.add("show");
    document.body.classList.add("modal-open");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Toasts */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, minWidth: 300 }}>
        {toasts.map((t) => (
          <div key={t.id} className={`alert alert-${t.type} shadow mb-2`} role="alert">
            {t.msg}
          </div>
        ))}
      </div>

      <div className="page-wrapper">
        <div className="content settings-content">
          <div className="page-header settings-pg-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Configuración</h4>
                <h6>Tasas de impuestos vigentes e historial</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>

          <div className="row">
            <div className="col-xl-12">
              <div className="settings-wrapper d-flex">
                <SettingsSideBar />

                <div className="flex-fill">
                  {/* ── Valores vigentes ── */}
                  <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-receipt-tax me-2" />
                        Valores Fiscales Vigentes
                      </h4>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={fetchActive}
                        title="Actualizar"
                      >
                        <i className="ti ti-refresh" />
                      </button>
                    </div>
                    <div className="card-body">
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status" />
                        </div>
                      ) : error ? (
                        <div className="alert alert-danger">
                          {error}
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={fetchActive}
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : (
                        <div className="row g-3">
                          {/* IVA */}
                          {active?.settings_tax.map((row) => (
                            <div key={row.key} className="col-md-3">
                              <div className="border rounded p-3 text-center bg-light h-100">
                                <div className="text-muted small mb-1">
                                  {TAX_KEY_LABELS[row.key] ?? row.key}
                                </div>
                                <div className="fw-bold fs-4 text-primary">
                                  {fmtPct(row.key, row.value)}
                                </div>
                                <div className="text-muted small mt-1">
                                  Desde {fmtDate(row.effective_from)}
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* IGTF */}
                          {active?.igtf && (
                            <div className="col-md-3">
                              <div className="border rounded p-3 text-center bg-light h-100">
                                <div className="text-muted small mb-1">IGTF</div>
                                <div className="fw-bold fs-4 text-warning">
                                  {Number(active.igtf.rate_pct_display)}%
                                </div>
                                <div className="text-muted small mt-1">
                                  Desde {fmtDate(active.igtf.effective_from)}
                                </div>
                              </div>
                            </div>
                          )}
                          {!active?.settings_tax.length && !active?.igtf && (
                            <p className="text-muted mb-0">
                              No hay reglas fiscales registradas. Use los formularios
                              a continuación para agregar.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Actualizar IVA ── */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-percentage me-2" />
                        Nueva Alícuota IVA
                      </h4>
                    </div>
                    <div className="card-body">
                      <p className="text-muted small">
                        Registra un nuevo período de IVA. No modifica el historial —
                        el nuevo valor aplica desde la fecha indicada.
                      </p>
                      {ivaError && (
                        <div className="alert alert-danger">{ivaError}</div>
                      )}
                      <form onSubmit={handleSaveIva}>
                        <div className="row g-3 align-items-end">
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">
                              IVA % <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="ej. 16"
                                value={ivaForm.value}
                                onChange={(e) =>
                                  setIvaForm((p) => ({ ...p, value: e.target.value }))
                                }
                                required
                              />
                              <span className="input-group-text">%</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">
                              Vigente desde <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              value={ivaForm.effective_from}
                              min={today}
                              onChange={(e) =>
                                setIvaForm((p) => ({
                                  ...p,
                                  effective_from: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={savingIva}
                            >
                              {savingIva ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                "Guardar"
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* ── Actualizar IGTF ── */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-building-bank me-2" />
                        Nueva Alícuota IGTF
                      </h4>
                    </div>
                    <div className="card-body">
                      <p className="text-muted small">
                        Impuesto a las grandes transacciones financieras. Append-only:
                        se crea un nuevo período sin alterar el historial.
                      </p>
                      {igtfError && (
                        <div className="alert alert-danger">{igtfError}</div>
                      )}
                      <form onSubmit={handleSaveIgtf}>
                        <div className="row g-3 align-items-end">
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">
                              IGTF % <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="ej. 3"
                                value={igtfForm.value}
                                onChange={(e) =>
                                  setIgtfForm((p) => ({ ...p, value: e.target.value }))
                                }
                                required
                              />
                              <span className="input-group-text">%</span>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">
                              Vigente desde <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              value={igtfForm.effective_from}
                              min={today}
                              onChange={(e) =>
                                setIgtfForm((p) => ({
                                  ...p,
                                  effective_from: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={savingIgtf}
                            >
                              {savingIgtf ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                "Guardar"
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* ── Otras reglas ── */}
                  <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-adjustments me-2" />
                        Otras Reglas Fiscales
                      </h4>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={openKeyModal}
                      >
                        <i className="ti ti-plus me-1" />
                        Agregar regla
                      </button>
                    </div>
                    <div className="card-body">
                      <p className="text-muted small mb-0">
                        Agrega retenciones, alícuotas especiales o cualquier parámetro
                        fiscal con clave personalizada (ej.{" "}
                        <code>iva_retencion_pct</code>,{" "}
                        <code>islr_retencion_pct</code>).
                      </p>
                    </div>
                  </div>

                  {/* ── Historial ── */}
                  <div className="card mb-4">
                    <div
                      className="card-header d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowHistory((v) => !v)}
                    >
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-history me-2" />
                        Historial de Cambios
                      </h4>
                      <i
                        className={`ti ti-chevron-${showHistory ? "up" : "down"} fs-5`}
                      />
                    </div>

                    {showHistory && (
                      <div className="card-body p-0">
                        {loadingHistory ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status" />
                          </div>
                        ) : history.length === 0 ? (
                          <p className="text-muted text-center py-4">Sin registros.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover table-sm mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Clave</th>
                                  <th>Descripción</th>
                                  <th className="text-end">Valor</th>
                                  <th>Vigente desde</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((r, i) => (
                                  <tr key={`${r.key}-${r.effective_from}-${i}`}>
                                    <td>
                                      <code>{r.key}</code>
                                    </td>
                                    <td className="text-muted small">
                                      {r.description ?? "—"}
                                    </td>
                                    <td className="text-end fw-bold font-monospace">
                                      {fmtPct(r.key, r.value)}
                                    </td>
                                    <td>{fmtDate(r.effective_from)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Modal regla arbitraria */}
      <div
        ref={keyModalRef}
        className="modal fade"
        id="key-modal"
        tabIndex={-1}
        style={{ display: "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleSaveKey}>
              <div className="modal-header">
                <h5 className="modal-title">Agregar regla fiscal</h5>
                <button type="button" className="btn-close" onClick={closeKeyModal} />
              </div>
              <div className="modal-body">
                {keyError && (
                  <div className="alert alert-danger">{keyError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Clave <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={keyForm.key}
                    onChange={(e) =>
                      setKeyForm((p) => ({ ...p, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))
                    }
                    placeholder="ej. iva_retencion_pct"
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold">
                      Valor % <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        min="0"
                        max="100"
                        value={keyForm.value}
                        onChange={(e) =>
                          setKeyForm((p) => ({ ...p, value: e.target.value }))
                        }
                        required
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold">
                      Vigente desde <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={keyForm.effective_from}
                      onChange={(e) =>
                        setKeyForm((p) => ({ ...p, effective_from: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Descripción</label>
                  <input
                    type="text"
                    className="form-control"
                    value={keyForm.description}
                    onChange={(e) =>
                      setKeyForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="ej. Retención IVA agente de retención"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeKeyModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingKey}
                >
                  {savingKey ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
