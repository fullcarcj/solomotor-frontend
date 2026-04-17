"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsSideBar from "../settingssidebar";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import CommonFooter from "@/core/common/footer/commonFooter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_base_currency: boolean;
  is_active: boolean;
}

const emptyCurrency = (): Partial<Currency> => ({
  code: "",
  name: "",
  symbol: "",
  decimal_places: 2,
  is_base_currency: false,
});

// ─── Toast helper ─────────────────────────────────────────────────────────────

type ToastType = "success" | "danger";
interface Toast { id: number; type: ToastType; msg: string; }
let _tid = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocalizationSettingsComponent() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const [modalData, setModalData] = useState<Partial<Currency>>(emptyCurrency());
  const [savingModal, setSavingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, type, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCurrencies = useCallback(async (active?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const qs = active === false ? "?active=false" : "";
      const res = await fetch(`/api/config/currencies${qs}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setCurrencies(body.data ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies(showAll ? false : undefined);
  }, [fetchCurrencies, showAll]);

  // ── Toggle active ──────────────────────────────────────────────────────────

  const handleToggle = async (c: Currency) => {
    try {
      const res = await fetch(`/api/config/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          decimal_places: c.decimal_places,
          is_active: !c.is_active,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      addToast(`Moneda ${c.code} ${!c.is_active ? "activada" : "desactivada"}.`);
      fetchCurrencies(showAll ? false : undefined);
    } catch (e) {
      addToast(String(e), "danger");
    }
  };

  // ── Modal ──────────────────────────────────────────────────────────────────

  const openModal = () => {
    setModalData(emptyCurrency());
    setModalError(null);
    const el = modalRef.current;
    if (!el) return;
    el.style.display = "block";
    el.classList.add("show");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    const el = modalRef.current;
    if (!el) return;
    el.style.display = "none";
    el.classList.remove("show");
    document.body.classList.remove("modal-open");
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingModal(true);
    setModalError(null);
    try {
      const res = await fetch("/api/config/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(modalData),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      addToast(`Moneda ${modalData.code} agregada.`);
      closeModal();
      fetchCurrencies(showAll ? false : undefined);
    } catch (e) {
      setModalError(String(e));
    } finally {
      setSavingModal(false);
    }
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
                <h6>Catálogo de monedas y localización</h6>
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
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-currency-dollar me-2" />
                        Catálogo de Monedas
                      </h4>
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="show-all-toggle"
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="show-all-toggle">
                            Mostrar todas
                          </label>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={openModal}
                        >
                          <i className="ti ti-plus me-1" />
                          Agregar moneda
                        </button>
                      </div>
                    </div>

                    <div className="card-body p-0">
                      {loading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status" />
                        </div>
                      ) : error ? (
                        <div className="alert alert-danger m-3">
                          {error}
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={() => fetchCurrencies(showAll ? false : undefined)}
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : currencies.length === 0 ? (
                        <p className="text-muted text-center py-4">
                          No hay monedas registradas.
                        </p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Símbolo</th>
                                <th>Decimales</th>
                                <th>Base</th>
                                <th>Estado</th>
                                <th className="text-center">Activar / Desactivar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currencies.map((c) => (
                                <tr key={c.code}>
                                  <td>
                                    <span className="badge bg-secondary fw-bold">
                                      {c.code}
                                    </span>
                                  </td>
                                  <td>{c.name}</td>
                                  <td className="fw-bold">{c.symbol}</td>
                                  <td>{c.decimal_places}</td>
                                  <td>
                                    {c.is_base_currency ? (
                                      <span className="badge bg-primary">Base</span>
                                    ) : (
                                      <span className="text-muted">—</span>
                                    )}
                                  </td>
                                  <td>
                                    {c.is_active ? (
                                      <span className="badge bg-success">Activa</span>
                                    ) : (
                                      <span className="badge bg-danger">Inactiva</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {!c.is_base_currency && (
                                      <div className="form-check form-switch d-inline-flex align-items-center gap-1 mb-0">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={c.is_active}
                                          onChange={() => handleToggle(c)}
                                          title={c.is_active ? "Desactivar" : "Activar"}
                                        />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Modal agregar moneda */}
      <div
        ref={modalRef}
        className="modal fade"
        id="currency-modal"
        tabIndex={-1}
        style={{ display: "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleSaveCurrency}>
              <div className="modal-header">
                <h5 className="modal-title">Agregar moneda</h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger">{modalError}</div>
                )}
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold">
                      Código <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      maxLength={10}
                      value={modalData.code ?? ""}
                      onChange={(e) =>
                        setModalData((p) => ({
                          ...p,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="USD"
                      required
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold">Símbolo</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={5}
                      value={modalData.symbol ?? ""}
                      onChange={(e) =>
                        setModalData((p) => ({ ...p, symbol: e.target.value }))
                      }
                      placeholder="$"
                    />
                  </div>
                  <div className="col-8 mb-3">
                    <label className="form-label fw-semibold">
                      Nombre <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={modalData.name ?? ""}
                      onChange={(e) =>
                        setModalData((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Dólar estadounidense"
                      required
                    />
                  </div>
                  <div className="col-4 mb-3">
                    <label className="form-label fw-semibold">Decimales</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={8}
                      value={modalData.decimal_places ?? 2}
                      onChange={(e) =>
                        setModalData((p) => ({
                          ...p,
                          decimal_places: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingModal}
                >
                  {savingModal ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Guardando…
                    </>
                  ) : (
                    "Agregar"
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
