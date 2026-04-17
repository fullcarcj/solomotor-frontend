"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsSideBar from "../settingssidebar";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import CommonFooter from "@/core/common/footer/commonFooter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: number;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  base_currency_code: string;
  fiscal_year_start: number;
}

interface Branch {
  id: number;
  company_id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  is_main_branch: boolean;
  has_warehouse: boolean;
  is_active: boolean;
  created_at: string;
}

const emptyBranch = (): Partial<Branch> => ({
  name: "",
  code: "",
  address: "",
  phone: "",
  is_main_branch: false,
  has_warehouse: false,
});

// ─── Toast helper ─────────────────────────────────────────────────────────────

type ToastType = "success" | "danger";

interface Toast {
  id: number;
  type: ToastType;
  msg: string;
}

let _toastId = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompanySettingsComponent() {
  // Company state
  const [company, setCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [errorCompany, setErrorCompany] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

  // Branches state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [errorBranches, setErrorBranches] = useState<string | null>(null);

  // Modal state (add / edit branch)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalData, setModalData] = useState<Partial<Branch>>(emptyBranch());
  const [savingBranch, setSavingBranch] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 6000);
  }, []);

  // ── Fetch company ──────────────────────────────────────────────────────────

  const fetchCompany = useCallback(async () => {
    setLoadingCompany(true);
    setErrorCompany(null);
    try {
      const res = await fetch("/api/config/company", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setCompany(body.data);
      setCompanyForm(body.data ?? {});
    } catch (e) {
      setErrorCompany(String(e));
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  // ── Fetch branches ─────────────────────────────────────────────────────────

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    setErrorBranches(null);
    try {
      const res = await fetch("/api/config/branches", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      setBranches(body.data ?? []);
    } catch (e) {
      setErrorBranches(String(e));
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
    fetchBranches();
  }, [fetchCompany, fetchBranches]);

  // ── Save company ───────────────────────────────────────────────────────────

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setSaveStatus(null);
    try {
      const payload = {
        name: companyForm.name ?? "",
        rif: companyForm.rif ?? "",
        address: companyForm.address ?? "",
        phone: companyForm.phone ?? "",
        email: companyForm.email ?? "",
        fiscal_year_start: Number(companyForm.fiscal_year_start ?? 1),
      };
      const res = await fetch("/api/config/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let body: Record<string, unknown> = {};
      try {
        body = await res.json();
      } catch {
        throw new Error(`Respuesta inválida del servidor (${res.status})`);
      }
      if (!res.ok) {
        const errMsg = (body.error as string) || `Error ${res.status}`;
        throw new Error(errMsg);
      }
      const saved = body.data as Company;
      setCompany(saved);
      setCompanyForm(saved);
      setSaveStatus({ type: "success", msg: "✓ Datos guardados correctamente." });
      addToast("Datos de empresa guardados correctamente.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[company-settings] PUT error:", msg);
      setSaveStatus({ type: "danger", msg: `Error al guardar: ${msg}` });
      addToast(`Error al guardar: ${msg}`, "danger");
    } finally {
      setSavingCompany(false);
    }
  };

  // ── Branch modal helpers ───────────────────────────────────────────────────

  const openAddModal = () => {
    setModalMode("add");
    setModalData(emptyBranch());
    setModalError(null);
    showModal();
  };

  const openEditModal = (b: Branch) => {
    setModalMode("edit");
    setModalData({ ...b });
    setModalError(null);
    showModal();
  };

  const showModal = () => {
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

  // ── Save branch ────────────────────────────────────────────────────────────

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranch(true);
    setModalError(null);
    try {
      const isEdit = modalMode === "edit";
      const url = isEdit
        ? `/api/config/branches/${modalData.id}`
        : "/api/config/branches";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(modalData),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      addToast(isEdit ? "Sucursal actualizada." : "Sucursal creada.");
      closeModal();
      fetchBranches();
    } catch (e) {
      setModalError(String(e));
    } finally {
      setSavingBranch(false);
    }
  };

  // ── Delete (soft) branch ───────────────────────────────────────────────────

  const handleDeleteBranch = async (b: Branch) => {
    if (!confirm(`¿Desactivar la sucursal "${b.name}"?`)) return;
    try {
      const res = await fetch(`/api/config/branches/${b.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
      addToast("Sucursal desactivada.");
      fetchBranches();
    } catch (e) {
      addToast(String(e), "danger");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toasts */}
      <div
        style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, minWidth: 300 }}
      >
        {toasts.map((t) => (
          <div key={t.id} className={`alert alert-${t.type} shadow mb-2`} role="alert">
            {t.msg}
          </div>
        ))}
      </div>

      <div className="page-wrapper">
        <div className="content settings-content">
          {/* Header */}
          <div className="page-header settings-pg-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Configuración</h4>
                <h6>Gestión de empresa y sucursales</h6>
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
                  {/* ── Datos de Empresa ── */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h4 className="fs-18 fw-bold">
                        <i className="ti ti-building me-2" />
                        Datos de la Empresa
                      </h4>
                    </div>
                    <div className="card-body">
                      {loadingCompany ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status" />
                        </div>
                      ) : errorCompany ? (
                        <div className="alert alert-danger">
                          {errorCompany}
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={fetchCompany}
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveCompany}>
                          <div className="row">
                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">
                                Nombre <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={companyForm.name ?? ""}
                                onChange={(e) =>
                                  setCompanyForm((p) => ({ ...p, name: e.target.value }))
                                }
                                required
                              />
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">RIF</label>
                              <input
                                type="text"
                                className="form-control"
                                value={companyForm.rif ?? ""}
                                onChange={(e) =>
                                  setCompanyForm((p) => ({ ...p, rif: e.target.value }))
                                }
                                placeholder="J-12345678-9"
                              />
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">Correo</label>
                              <input
                                type="email"
                                className="form-control"
                                value={companyForm.email ?? ""}
                                onChange={(e) =>
                                  setCompanyForm((p) => ({ ...p, email: e.target.value }))
                                }
                              />
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">Teléfono</label>
                              <input
                                type="text"
                                className="form-control"
                                value={companyForm.phone ?? ""}
                                onChange={(e) =>
                                  setCompanyForm((p) => ({ ...p, phone: e.target.value }))
                                }
                              />
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">
                                Moneda base
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                value={company?.base_currency_code ?? ""}
                                readOnly
                                disabled
                              />
                              <small className="text-muted">
                                Configurable desde Monedas
                              </small>
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label fw-semibold">
                                Inicio año fiscal (mes)
                              </label>
                              <select
                                className="form-select"
                                value={companyForm.fiscal_year_start ?? 1}
                                onChange={(e) =>
                                  setCompanyForm((p) => ({
                                    ...p,
                                    fiscal_year_start: Number(e.target.value),
                                  }))
                                }
                              >
                                {[
                                  "Enero", "Febrero", "Marzo", "Abril",
                                  "Mayo", "Junio", "Julio", "Agosto",
                                  "Septiembre", "Octubre", "Noviembre", "Diciembre",
                                ].map((m, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-12 mb-3">
                              <label className="form-label fw-semibold">Dirección</label>
                              <textarea
                                className="form-control"
                                rows={2}
                                value={companyForm.address ?? ""}
                                onChange={(e) =>
                                  setCompanyForm((p) => ({
                                    ...p,
                                    address: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          {saveStatus && (
                            <div className={`alert alert-${saveStatus.type} py-2 mb-2`} role="alert">
                              {saveStatus.msg}
                            </div>
                          )}
                          <div className="text-end">
                            <button
                              type="button"
                              className="btn btn-secondary me-2"
                              onClick={() => {
                                if (company) setCompanyForm(company);
                                setSaveStatus(null);
                              }}
                              disabled={savingCompany}
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={savingCompany}
                            >
                              {savingCompany ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Guardando…
                                </>
                              ) : (
                                "Guardar cambios"
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* ── Sucursales ── */}
                  <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h4 className="fs-18 fw-bold mb-0">
                        <i className="ti ti-map-pin me-2" />
                        Sucursales
                      </h4>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={openAddModal}
                      >
                        <i className="ti ti-plus me-1" />
                        Nueva sucursal
                      </button>
                    </div>
                    <div className="card-body p-0">
                      {loadingBranches ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status" />
                        </div>
                      ) : errorBranches ? (
                        <div className="alert alert-danger m-3">
                          {errorBranches}
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={fetchBranches}
                          >
                            Reintentar
                          </button>
                        </div>
                      ) : branches.length === 0 ? (
                        <p className="text-muted text-center py-4">
                          No hay sucursales registradas.
                        </p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Principal</th>
                                <th>Almacén</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {branches.map((b) => (
                                <tr key={b.id}>
                                  <td>
                                    <span className="badge bg-secondary">
                                      {b.code}
                                    </span>
                                  </td>
                                  <td className="fw-semibold">{b.name}</td>
                                  <td>{b.phone ?? "—"}</td>
                                  <td>
                                    {b.is_main_branch ? (
                                      <span className="badge bg-primary">Sí</span>
                                    ) : (
                                      <span className="text-muted">—</span>
                                    )}
                                  </td>
                                  <td>
                                    {b.has_warehouse ? (
                                      <span className="badge bg-info text-dark">Sí</span>
                                    ) : (
                                      <span className="text-muted">—</span>
                                    )}
                                  </td>
                                  <td>
                                    {b.is_active ? (
                                      <span className="badge bg-success">Activa</span>
                                    ) : (
                                      <span className="badge bg-danger">Inactiva</span>
                                    )}
                                  </td>
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary me-1"
                                      onClick={() => openEditModal(b)}
                                      title="Editar"
                                    >
                                      <i className="ti ti-edit" />
                                    </button>
                                    {!b.is_main_branch && b.is_active && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteBranch(b)}
                                        title="Desactivar"
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
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

      {/* ── Modal Sucursal ── */}
      <div
        ref={modalRef}
        className="modal fade"
        id="branch-modal"
        tabIndex={-1}
        style={{ display: "none" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleSaveBranch}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalMode === "add" ? "Nueva sucursal" : "Editar sucursal"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                />
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger">{modalError}</div>
                )}
                <div className="mb-3">
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
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Código <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    value={modalData.code ?? ""}
                    onChange={(e) =>
                      setModalData((p) => ({
                        ...p,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    required
                    placeholder="ej. CCS01"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Dirección</label>
                  <input
                    type="text"
                    className="form-control"
                    value={modalData.address ?? ""}
                    onChange={(e) =>
                      setModalData((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={modalData.phone ?? ""}
                    onChange={(e) =>
                      setModalData((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="row">
                  <div className="col-6">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="modal-is-main"
                        checked={modalData.is_main_branch ?? false}
                        onChange={(e) =>
                          setModalData((p) => ({
                            ...p,
                            is_main_branch: e.target.checked,
                          }))
                        }
                      />
                      <label className="form-check-label" htmlFor="modal-is-main">
                        Sucursal principal
                      </label>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="modal-has-warehouse"
                        checked={modalData.has_warehouse ?? false}
                        onChange={(e) =>
                          setModalData((p) => ({
                            ...p,
                            has_warehouse: e.target.checked,
                          }))
                        }
                      />
                      <label className="form-check-label" htmlFor="modal-has-warehouse">
                        Tiene almacén
                      </label>
                    </div>
                  </div>
                  {modalMode === "edit" && (
                    <div className="col-6 mt-2">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="modal-is-active"
                          checked={modalData.is_active ?? true}
                          onChange={(e) =>
                            setModalData((p) => ({
                              ...p,
                              is_active: e.target.checked,
                            }))
                          }
                        />
                        <label className="form-check-label" htmlFor="modal-is-active">
                          Activa
                        </label>
                      </div>
                    </div>
                  )}
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
                  disabled={savingBranch}
                >
                  {savingBranch ? (
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
