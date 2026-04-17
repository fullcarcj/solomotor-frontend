"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsSideBar from "../settingssidebar";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import CommonFooter from "@/core/common/footer/commonFooter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExchangeRate {
  rate_date: string;
  active_rate: number;
  bcv_rate: number | null;
  binance_rate: number | null;
  adjusted_rate?: number | null;
  active_rate_type: string;
  is_manual_override: boolean;
  from_currency: string;
  to_currency: string;
}

type ToastType = "success" | "danger";
interface Toast { id: number; type: ToastType; msg: string; }
let _tid = 0;

const fmtRate = (n: number | null | undefined) =>
  n != null ? n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "—";

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("es-VE", {
    day: "2-digit", month: "short", year: "numeric",
  });

// ─── Component ────────────────────────────────────────────────────────────────

export default function CurrencySettingsComponent() {
  // Current rate
  const [current, setCurrent] = useState<ExchangeRate | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [errorCurrent, setErrorCurrent] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<ExchangeRate[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDays, setHistoryDays] = useState(30);

  // Manual rate form
  const [rateForm, setRateForm] = useState({
    rate_date: new Date().toISOString().slice(0, 10),
    bcv_rate: "",
    binance_rate: "",
    active_rate: "",
    active_rate_type: "bcv" as "bcv" | "binance" | "adjusted",
    override_reason: "",
  });
  const [savingRate, setSavingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Converter
  const [convAmount, setConvAmount] = useState("1");
  const [convDirection, setConvDirection] = useState<"to_ves" | "to_usd">("to_usd");
  const [convResult, setConvResult] = useState<number | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, type, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);

  // ── Fetch current ──────────────────────────────────────────────────────────

  const fetchCurrent = useCallback(async () => {
    setLoadingCurrent(true);
    setErrorCurrent(null);
    try {
      const res = await fetch("/api/config/exchange-rates", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setCurrent(body.data ?? null);
    } catch (e) {
      setErrorCurrent(String(e));
    } finally {
      setLoadingCurrent(false);
    }
  }, []);

  // ── Fetch history ──────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async (limit: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/config/exchange-rates/history?limit=${limit}`,
        { cache: "no-store" }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setHistory(body.data ?? []);
    } catch (e) {
      addToast(String(e), "danger");
    } finally {
      setLoadingHistory(false);
    }
  }, [addToast]);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);

  useEffect(() => {
    if (showHistory) fetchHistory(historyDays);
  }, [showHistory, historyDays, fetchHistory]);

  // ── Save manual rate ───────────────────────────────────────────────────────

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRate(true);
    setRateError(null);
    try {
      const payload: Record<string, unknown> = {
        rate_date: rateForm.rate_date,
        active_rate_type: rateForm.active_rate_type,
        is_manual_override: true,
        override_reason: rateForm.override_reason || null,
      };
      if (rateForm.bcv_rate) payload.bcv_rate = Number(rateForm.bcv_rate);
      if (rateForm.binance_rate) payload.binance_rate = Number(rateForm.binance_rate);
      if (rateForm.active_rate) payload.active_rate = Number(rateForm.active_rate);
      else {
        // derive from selected type
        if (rateForm.active_rate_type === "bcv" && rateForm.bcv_rate)
          payload.active_rate = Number(rateForm.bcv_rate);
        else if (rateForm.active_rate_type === "binance" && rateForm.binance_rate)
          payload.active_rate = Number(rateForm.binance_rate);
      }

      const res = await fetch("/api/config/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      addToast("Tasa registrada correctamente.");
      fetchCurrent();
      if (showHistory) fetchHistory(historyDays);
    } catch (e) {
      setRateError(String(e));
    } finally {
      setSavingRate(false);
    }
  };

  // ── Converter ─────────────────────────────────────────────────────────────

  const handleConvert = () => {
    if (!current?.active_rate) return;
    const amt = Number(convAmount);
    if (!isFinite(amt)) return;
    if (convDirection === "to_usd") {
      setConvResult(amt * current.active_rate);
    } else {
      setConvResult(amt / current.active_rate);
    }
  };

  // ── Rate type badge ────────────────────────────────────────────────────────

  const rateTypeBadge = (t: string, isOverride: boolean) => {
    const map: Record<string, string> = {
      bcv: "bg-primary", binance: "bg-warning text-dark", adjusted: "bg-secondary",
    };
    return (
      <span className={`badge ${map[t] ?? "bg-secondary"} me-1`}>
        {t.toUpperCase()}
        {isOverride && <span title="Ingreso manual"> ✏️</span>}
      </span>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
                <h6>Tasas de cambio y conversión de monedas</h6>
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
                  {/* ── Tasa actual ── */}
                  <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-chart-line me-2" />
                        Tasa Vigente
                      </h4>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={fetchCurrent}
                        title="Actualizar"
                      >
                        <i className="ti ti-refresh" />
                      </button>
                    </div>
                    <div className="card-body">
                      {loadingCurrent ? (
                        <div className="text-center py-3">
                          <div className="spinner-border text-primary" role="status" />
                        </div>
                      ) : errorCurrent ? (
                        <div className="alert alert-danger">
                          {errorCurrent}
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={fetchCurrent}
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : !current ? (
                        <p className="text-muted">
                          No hay tasa disponible. Registre una a continuación.
                        </p>
                      ) : (
                        <div className="row g-3">
                          <div className="col-md-3">
                            <div className="border rounded p-3 text-center bg-light">
                              <div className="text-muted small mb-1">Par</div>
                              <div className="fw-bold fs-5">
                                {current.from_currency} → {current.to_currency}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="border rounded p-3 text-center bg-light">
                              <div className="text-muted small mb-1">Tasa activa</div>
                              <div className="fw-bold fs-4 text-primary">
                                {fmtRate(current.active_rate)}
                              </div>
                              <div className="mt-1">
                                {rateTypeBadge(current.active_rate_type, current.is_manual_override)}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="border rounded p-3 text-center bg-light">
                              <div className="text-muted small mb-1">BCV</div>
                              <div className="fw-bold fs-5">
                                {fmtRate(current.bcv_rate)}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="border rounded p-3 text-center bg-light">
                              <div className="text-muted small mb-1">Binance</div>
                              <div className="fw-bold fs-5">
                                {fmtRate(current.binance_rate)}
                              </div>
                            </div>
                          </div>
                          <div className="col-12">
                            <small className="text-muted">
                              Fecha: {fmtDate(current.rate_date)}
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Registrar tasa manual ── */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-pencil me-2" />
                        Registrar Tasa Manual
                      </h4>
                    </div>
                    <div className="card-body">
                      {rateError && (
                        <div className="alert alert-danger">{rateError}</div>
                      )}
                      <form onSubmit={handleSaveRate}>
                        <div className="row g-3 align-items-end">
                          <div className="col-md-2">
                            <label className="form-label fw-semibold">Fecha</label>
                            <input
                              type="date"
                              className="form-control"
                              value={rateForm.rate_date}
                              onChange={(e) =>
                                setRateForm((p) => ({ ...p, rate_date: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label fw-semibold">BCV (Bs/USD)</label>
                            <input
                              type="number"
                              className="form-control"
                              step="0.0001"
                              min="0"
                              placeholder="ej. 45.32"
                              value={rateForm.bcv_rate}
                              onChange={(e) =>
                                setRateForm((p) => ({ ...p, bcv_rate: e.target.value }))
                              }
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label fw-semibold">Binance (Bs/USD)</label>
                            <input
                              type="number"
                              className="form-control"
                              step="0.0001"
                              min="0"
                              placeholder="ej. 47.10"
                              value={rateForm.binance_rate}
                              onChange={(e) =>
                                setRateForm((p) => ({ ...p, binance_rate: e.target.value }))
                              }
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label fw-semibold">Tasa activa</label>
                            <select
                              className="form-select"
                              value={rateForm.active_rate_type}
                              onChange={(e) =>
                                setRateForm((p) => ({
                                  ...p,
                                  active_rate_type: e.target.value as typeof rateForm.active_rate_type,
                                }))
                              }
                            >
                              <option value="bcv">BCV</option>
                              <option value="binance">Binance</option>
                              <option value="adjusted">Ajustada</option>
                            </select>
                          </div>
                          {rateForm.active_rate_type === "adjusted" && (
                            <div className="col-md-2">
                              <label className="form-label fw-semibold">Valor ajustado</label>
                              <input
                                type="number"
                                className="form-control"
                                step="0.0001"
                                min="0"
                                placeholder="ej. 46.00"
                                value={rateForm.active_rate}
                                onChange={(e) =>
                                  setRateForm((p) => ({ ...p, active_rate: e.target.value }))
                                }
                              />
                            </div>
                          )}
                          <div className="col-md-2">
                            <label className="form-label fw-semibold">Razón (opcional)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="ej. Cierre semana"
                              value={rateForm.override_reason}
                              onChange={(e) =>
                                setRateForm((p) => ({
                                  ...p,
                                  override_reason: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="col-md-2">
                            <button
                              type="submit"
                              className="btn btn-primary w-100"
                              disabled={savingRate}
                            >
                              {savingRate ? (
                                <span className="spinner-border spinner-border-sm" />
                              ) : (
                                <>
                                  <i className="ti ti-device-floppy me-1" />
                                  Guardar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* ── Calculadora ── */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-calculator me-2" />
                        Calculadora de Conversión
                      </h4>
                    </div>
                    <div className="card-body">
                      {current ? (
                        <div className="row g-3 align-items-end">
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">Monto</label>
                            <input
                              type="number"
                              className="form-control"
                              step="0.01"
                              min="0"
                              value={convAmount}
                              onChange={(e) => {
                                setConvAmount(e.target.value);
                                setConvResult(null);
                              }}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">Dirección</label>
                            <select
                              className="form-select"
                              value={convDirection}
                              onChange={(e) => {
                                setConvDirection(e.target.value as typeof convDirection);
                                setConvResult(null);
                              }}
                            >
                              <option value="to_usd">
                                {current.from_currency} → {current.to_currency}
                              </option>
                              <option value="to_ves">
                                {current.to_currency} → {current.from_currency}
                              </option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-primary w-100"
                              onClick={handleConvert}
                            >
                              Convertir
                            </button>
                          </div>
                          {convResult !== null && (
                            <div className="col-md-4">
                              <div className="alert alert-info mb-0 py-2 px-3">
                                <strong>Resultado:</strong>{" "}
                                {convResult.toLocaleString("es-VE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 4,
                                })}{" "}
                                <span className="text-muted fs-13">
                                  (tasa: {fmtRate(current.active_rate)})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">
                          Registre una tasa para usar la calculadora.
                        </p>
                      )}
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
                        Historial de Tasas
                      </h4>
                      <div className="d-flex align-items-center gap-3">
                        {showHistory && (
                          <select
                            className="form-select form-select-sm w-auto"
                            value={historyDays}
                            onChange={(e) => {
                              e.stopPropagation();
                              setHistoryDays(Number(e.target.value));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value={7}>Últimos 7 días</option>
                            <option value={30}>Últimos 30 días</option>
                            <option value={90}>Últimos 90 días</option>
                            <option value={365}>Último año</option>
                          </select>
                        )}
                        <i
                          className={`ti ti-chevron-${showHistory ? "up" : "down"} fs-5`}
                        />
                      </div>
                    </div>

                    {showHistory && (
                      <div className="card-body p-0">
                        {loadingHistory ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status" />
                          </div>
                        ) : history.length === 0 ? (
                          <p className="text-muted text-center py-4">
                            Sin registros en el período seleccionado.
                          </p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover table-sm mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Fecha</th>
                                  <th className="text-end">BCV</th>
                                  <th className="text-end">Binance</th>
                                  <th className="text-end">Tasa activa</th>
                                  <th>Tipo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((r) => (
                                  <tr key={r.rate_date}>
                                    <td>{fmtDate(r.rate_date)}</td>
                                    <td className="text-end font-monospace">
                                      {fmtRate(r.bcv_rate)}
                                    </td>
                                    <td className="text-end font-monospace">
                                      {fmtRate(r.binance_rate)}
                                    </td>
                                    <td className="text-end fw-bold font-monospace">
                                      {fmtRate(r.active_rate)}
                                    </td>
                                    <td>
                                      {rateTypeBadge(r.active_rate_type, r.is_manual_override)}
                                    </td>
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
    </div>
  );
}
