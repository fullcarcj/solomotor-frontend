"use client";

import CommonFooter from "@/core/common/footer/commonFooter";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsSideBar from "../settingssidebar";
import { message, Spin } from "antd";

// ─── tipos ────────────────────────────────────────────────────────────────────

interface FinancialSettings {
  flete_nacional_pct: number;
  arancel_pct: number;
  gasto_admin_pct: number;
  storage_cost_pct: number;
  picking_packing_usd: number;
  iva_pct: number;
  igtf_pct: number;
  igtf_absorbed: boolean;
  spread_alert_pct: number;
}

interface PricingPolicy {
  channel: string;
  markup_pct: number;
  commission_pct: number;
  max_discount_pct: number;
  is_active: boolean;
}

interface PaymentMethodSetting {
  payment_code: string;
  rate_source: string;
  applies_igtf: boolean;
  method_commission_pct: number;
}

// ─── mapas de nombres ──────────────────────────────────────────────────────────

const CHANNEL_NAMES: Record<string, string> = {
  mostrador: "Mostrador",
  whatsapp: "WhatsApp",
  ml: "MercadoLibre",
  ecommerce: "E-commerce",
};

const PAYMENT_NAMES: Record<string, string> = {
  USD_CASH: "Efectivo USD",
  ZELLE: "Zelle",
  PAGO_MOVIL: "Pago Móvil",
  BS_TRANSFER: "Transferencia Bs",
  BS_CASH: "Efectivo Bs",
  BINANCE_P2P: "Binance P2P",
  PANAMA_WIRE: "Panamá/Wire",
};

const RATE_SOURCE_NAMES: Record<string, string> = {
  bcv: "BCV",
  binance: "Binance",
  adjusted: "Ajustada",
};

const CHANNEL_ORDER = ["mostrador", "whatsapp", "ml", "ecommerce"];
const PAYMENT_ORDER = [
  "USD_CASH",
  "ZELLE",
  "PAGO_MOVIL",
  "BS_TRANSFER",
  "BS_CASH",
  "BINANCE_P2P",
  "PANAMA_WIRE",
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(decimal: number): string {
  return (decimal * 100).toFixed(2);
}

function toDecimal(s: string): number {
  return parseFloat(s || "0") / 100;
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function PricingPoliciesComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sección 1 — Parámetros Operativos
  const [fleteNacional, setFleteNacional] = useState("0");
  const [arancel, setArancel] = useState("0");
  const [gastoAdmin, setGastoAdmin] = useState("0");
  const [storageCost, setStorageCost] = useState("0");
  const [pickingPacking, setPickingPacking] = useState("0");
  const [iva, setIva] = useState("0");
  const [igtf, setIgtf] = useState("0");
  const [igtfAbsorbed, setIgtfAbsorbed] = useState(false);
  const [spreadAlert, setSpreadAlert] = useState("0");
  const [savingFinancial, setSavingFinancial] = useState(false);

  // Sección 2 — Políticas por Canal
  const [policies, setPolicies] = useState<PricingPolicy[]>([]);
  const [editPolicy, setEditPolicy] = useState<PricingPolicy | null>(null);
  const [policyMarkup, setPolicyMarkup] = useState("0");
  const [policyCommission, setPolicyCommission] = useState("0");
  const [policyMaxDiscount, setPolicyMaxDiscount] = useState("0");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const policyModalRef = useRef<HTMLButtonElement>(null);
  const policyModalCloseRef = useRef<HTMLButtonElement>(null);

  // Sección 3 — Métodos de Pago
  const [payments, setPayments] = useState<PaymentMethodSetting[]>([]);
  const [editPayment, setEditPayment] = useState<PaymentMethodSetting | null>(null);
  const [payRateSource, setPayRateSource] = useState("bcv");
  const [payCommission, setPayCommission] = useState("0");
  const [payAppliesIgtf, setPayAppliesIgtf] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const paymentModalCloseRef = useRef<HTMLButtonElement>(null);

  // ── carga inicial ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/pricing/settings", {
        cache: "no-store",
      });
      const body = (await res.json()) as {
        data?: {
          financial_settings: FinancialSettings;
          pricing_policies: PricingPolicy[];
          payment_method_settings: PaymentMethodSetting[];
        };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message ?? `Error ${res.status}`);
      }
      const d = body.data!;
      const fs = d.financial_settings;
      setFleteNacional(pct(fs.flete_nacional_pct));
      setArancel(pct(fs.arancel_pct));
      setGastoAdmin(pct(fs.gasto_admin_pct));
      setStorageCost(pct(fs.storage_cost_pct));
      setPickingPacking(String(fs.picking_packing_usd));
      setIva(pct(fs.iva_pct));
      setIgtf(pct(fs.igtf_pct));
      setIgtfAbsorbed(fs.igtf_absorbed);
      setSpreadAlert(pct(fs.spread_alert_pct));

      const sortedPolicies = CHANNEL_ORDER.map(
        (ch) => d.pricing_policies.find((p) => p.channel === ch)
      ).filter(Boolean) as PricingPolicy[];
      setPolicies(sortedPolicies);

      const sortedPayments = PAYMENT_ORDER.map(
        (code) => d.payment_method_settings.find((p) => p.payment_code === code)
      ).filter(Boolean) as PaymentMethodSetting[];
      setPayments(sortedPayments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Sección 1: guardar parámetros ────────────────────────────────────────────

  const handleSaveFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFinancial(true);
    try {
      const res = await fetch("/api/inventory/pricing/settings/financial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          flete_nacional_pct: toDecimal(fleteNacional),
          arancel_pct: toDecimal(arancel),
          gasto_admin_pct: toDecimal(gastoAdmin),
          storage_cost_pct: toDecimal(storageCost),
          picking_packing_usd: parseFloat(pickingPacking || "0"),
          iva_pct: toDecimal(iva),
          igtf_pct: toDecimal(igtf),
          igtf_absorbed: igtfAbsorbed,
          spread_alert_pct: toDecimal(spreadAlert),
        }),
      });
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `Error ${res.status}`);
      message.success(
        "Parámetros guardados. Ejecutar corrida de precios para aplicar los cambios."
      );
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al guardar parámetros");
    } finally {
      setSavingFinancial(false);
    }
  };

  // ── Sección 2: editar política ───────────────────────────────────────────────

  const openPolicyModal = (policy: PricingPolicy) => {
    setEditPolicy(policy);
    setPolicyMarkup(pct(policy.markup_pct));
    setPolicyCommission(pct(policy.commission_pct));
    setPolicyMaxDiscount(pct(policy.max_discount_pct));
  };

  const handleSavePolicy = async () => {
    if (!editPolicy) return;
    setSavingPolicy(true);
    try {
      const res = await fetch(
        `/api/inventory/pricing/settings/policy/${editPolicy.channel}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            markup_pct: toDecimal(policyMarkup),
            commission_pct: toDecimal(policyCommission),
            max_discount_pct: toDecimal(policyMaxDiscount),
          }),
        }
      );
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `Error ${res.status}`);

      setPolicies((prev) =>
        prev.map((p) =>
          p.channel === editPolicy.channel
            ? {
                ...p,
                markup_pct: toDecimal(policyMarkup),
                commission_pct: toDecimal(policyCommission),
                max_discount_pct: toDecimal(policyMaxDiscount),
              }
            : p
        )
      );
      message.success("Política actualizada correctamente.");
      policyModalCloseRef.current?.click();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al guardar política");
    } finally {
      setSavingPolicy(false);
    }
  };

  // ── Sección 3: editar método de pago ─────────────────────────────────────────

  const openPaymentModal = (pm: PaymentMethodSetting) => {
    setEditPayment(pm);
    setPayRateSource(pm.rate_source);
    setPayCommission(pct(pm.method_commission_pct));
    setPayAppliesIgtf(pm.applies_igtf);
  };

  const handleSavePayment = async () => {
    if (!editPayment) return;
    setSavingPayment(true);
    try {
      const res = await fetch(
        `/api/inventory/pricing/settings/payment/${editPayment.payment_code}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            rate_source: payRateSource,
            method_commission_pct: toDecimal(payCommission),
            applies_igtf: payAppliesIgtf,
          }),
        }
      );
      const body = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(body.error?.message ?? `Error ${res.status}`);

      setPayments((prev) =>
        prev.map((p) =>
          p.payment_code === editPayment.payment_code
            ? {
                ...p,
                rate_source: payRateSource,
                method_commission_pct: toDecimal(payCommission),
                applies_igtf: payAppliesIgtf,
              }
            : p
        )
      );
      message.success("Método de pago actualizado.");
      paymentModalCloseRef.current?.click();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al guardar método de pago");
    } finally {
      setSavingPayment(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-wrapper">
        <div className="content settings-content">
          <div className="page-header settings-pg-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Settings</h4>
                <h6>Manage your settings on portal</h6>
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

                <div className="flex-fill w-50">

                  {/* ── estado loading / error ── */}
                  {loading && (
                    <div className="card mb-3">
                      <div className="card-body d-flex justify-content-center align-items-center py-5">
                        <Spin size="large" tip="Cargando configuración…" />
                      </div>
                    </div>
                  )}

                  {!loading && error && (
                    <div className="card mb-3">
                      <div className="card-body">
                        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-0">
                          <span>
                            <i className="ti ti-alert-circle me-2" />
                            {error}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={loadData}
                          >
                            Reintentar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ SECCIÓN 1 — Parámetros Operativos ══ */}
                  {!loading && !error && (
                    <div className="card flex-fill mb-3">
                      <div className="card-header d-flex align-items-center justify-content-between">
                        <h4>Parámetros Operativos</h4>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleSaveFinancial}>
                          {/* ADQUISICIÓN */}
                          <p className="fw-semibold text-muted mb-2">Adquisición</p>
                          <div className="row mb-3">
                            <div className="col-md-4">
                              <label className="form-label">Flete Nacional %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={fleteNacional}
                                onChange={(e) => setFleteNacional(e.target.value)}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Arancel %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={arancel}
                                onChange={(e) => setArancel(e.target.value)}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Gasto Administrativo %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={gastoAdmin}
                                onChange={(e) => setGastoAdmin(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* ALMACENAMIENTO */}
                          <p className="fw-semibold text-muted mb-2">Almacenamiento</p>
                          <div className="row mb-3">
                            <div className="col-md-4">
                              <label className="form-label">Costo de Storage %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={storageCost}
                                onChange={(e) => setStorageCost(e.target.value)}
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Picking/Packing USD</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={pickingPacking}
                                onChange={(e) => setPickingPacking(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* IMPUESTOS */}
                          <p className="fw-semibold text-muted mb-2">Impuestos</p>
                          <div className="row mb-3">
                            <div className="col-md-3">
                              <label className="form-label">IVA %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={iva}
                                onChange={(e) => setIva(e.target.value)}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">IGTF %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={igtf}
                                onChange={(e) => setIgtf(e.target.value)}
                              />
                            </div>
                            <div className="col-md-4 d-flex align-items-end pb-1">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id="igtfAbsorbed"
                                  checked={igtfAbsorbed}
                                  onChange={(e) => setIgtfAbsorbed(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="igtfAbsorbed">
                                  IGTF lo absorbe el negocio
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* ALERTAS */}
                          <p className="fw-semibold text-muted mb-2">Alertas</p>
                          <div className="row mb-4">
                            <div className="col-md-4">
                              <label className="form-label">Alerta brecha BCV/Binance %</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control"
                                value={spreadAlert}
                                onChange={(e) => setSpreadAlert(e.target.value)}
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={savingFinancial}
                          >
                            {savingFinancial ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Guardando…
                              </>
                            ) : (
                              <>
                                <i className="ti ti-device-floppy me-1" />
                                Guardar Parámetros
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* ══ SECCIÓN 2 — Políticas por Canal ══ */}
                  {!loading && !error && (
                    <div className="card flex-fill mb-3">
                      <div className="card-header d-flex align-items-center justify-content-between">
                        <h4>Políticas por Canal</h4>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table border">
                            <thead className="thead-light">
                              <tr>
                                <th>Canal</th>
                                <th>Markup %</th>
                                <th>Comisión %</th>
                                <th>Desc. Máx %</th>
                                <th>Activo</th>
                                <th className="no-sort" />
                              </tr>
                            </thead>
                            <tbody>
                              {policies.map((pol) => (
                                <tr key={pol.channel}>
                                  <td>{CHANNEL_NAMES[pol.channel] ?? pol.channel}</td>
                                  <td>{(pol.markup_pct * 100).toFixed(2)}%</td>
                                  <td>{(pol.commission_pct * 100).toFixed(2)}%</td>
                                  <td>{(pol.max_discount_pct * 100).toFixed(2)}%</td>
                                  <td>
                                    {pol.is_active ? (
                                      <span className="badge bg-success">Sí</span>
                                    ) : (
                                      <span className="badge bg-secondary">No</span>
                                    )}
                                  </td>
                                  <td className="action-table-data justify-content-end">
                                    <div className="edit-delete-action">
                                      <Link
                                        className="me-2 p-2"
                                        href="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-policy-modal"
                                        onClick={() => openPolicyModal(pol)}
                                      >
                                        <i data-feather="edit" className="feather-edit" />
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ SECCIÓN 3 — Métodos de Pago ══ */}
                  {!loading && !error && (
                    <div className="card flex-fill mb-0">
                      <div className="card-header d-flex align-items-center justify-content-between">
                        <h4>Métodos de Pago</h4>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table border">
                            <thead className="thead-light">
                              <tr>
                                <th>Método</th>
                                <th>Tasa Base</th>
                                <th>IGTF</th>
                                <th>Comisión %</th>
                                <th className="no-sort" />
                              </tr>
                            </thead>
                            <tbody>
                              {payments.map((pm) => (
                                <tr key={pm.payment_code}>
                                  <td>{PAYMENT_NAMES[pm.payment_code] ?? pm.payment_code}</td>
                                  <td>{RATE_SOURCE_NAMES[pm.rate_source] ?? pm.rate_source}</td>
                                  <td>
                                    {pm.applies_igtf ? (
                                      <span className="badge bg-warning text-dark">Sí</span>
                                    ) : (
                                      <span className="badge bg-secondary">No</span>
                                    )}
                                  </td>
                                  <td>{(pm.method_commission_pct * 100).toFixed(2)}%</td>
                                  <td className="action-table-data justify-content-end">
                                    <div className="edit-delete-action">
                                      <Link
                                        className="me-2 p-2"
                                        href="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-payment-modal"
                                        onClick={() => openPaymentModal(pm)}
                                      >
                                        <i data-feather="edit" className="feather-edit" />
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* ══ Modal editar política ══ */}
      <div className="modal fade" id="edit-policy-modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Editar Política —{" "}
                {editPolicy
                  ? (CHANNEL_NAMES[editPolicy.channel] ?? editPolicy.channel)
                  : ""}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Markup %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={policyMarkup}
                  onChange={(e) => setPolicyMarkup(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Comisión %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={policyCommission}
                  onChange={(e) => setPolicyCommission(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descuento Máximo %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={policyMaxDiscount}
                  onChange={(e) => setPolicyMaxDiscount(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                ref={policyModalCloseRef}
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePolicy}
                disabled={savingPolicy}
              >
                {savingPolicy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Guardando…
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Modal editar método de pago ══ */}
      <div className="modal fade" id="edit-payment-modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Editar Método —{" "}
                {editPayment
                  ? (PAYMENT_NAMES[editPayment.payment_code] ?? editPayment.payment_code)
                  : ""}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Tasa Base</label>
                <select
                  className="form-select"
                  value={payRateSource}
                  onChange={(e) => setPayRateSource(e.target.value)}
                >
                  <option value="bcv">BCV</option>
                  <option value="binance">Binance</option>
                  <option value="adjusted">Ajustada</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Comisión %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={payCommission}
                  onChange={(e) => setPayCommission(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="payAppliesIgtf"
                    checked={payAppliesIgtf}
                    onChange={(e) => setPayAppliesIgtf(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="payAppliesIgtf">
                    Aplica IGTF
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                ref={paymentModalCloseRef}
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePayment}
                disabled={savingPayment}
              >
                {savingPayment ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Guardando…
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
