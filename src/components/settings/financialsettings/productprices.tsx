"use client";

import CommonFooter from "@/core/common/footer/commonFooter";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SettingsSideBar from "../settingssidebar";
import { message, Spin } from "antd";

// ─── tipos ────────────────────────────────────────────────────────────────────

interface ProductPrice {
  sku: string;
  name: string;
  channel: string;
  operational_cost_usd?: number;
  price_usd?: number;
  price_bs_bcv?: number;
  price_bs_binance?: number;
  price_bs_adjusted?: number;
  margin_pct?: number;
  calculated_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface RunResult {
  total_products?: number;
  total_updated?: number;
  errors?: number;
  rate_date?: string;
}

// ─── mapas de nombres ──────────────────────────────────────────────────────────

const CHANNEL_NAMES: Record<string, string> = {
  mostrador: "Mostrador",
  whatsapp: "WhatsApp",
  ml: "MercadoLibre",
  ecommerce: "E-commerce",
};

const CHANNEL_OPTIONS = [
  { value: "all", label: "Todos los canales" },
  { value: "mostrador", label: "Mostrador" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ml", label: "MercadoLibre" },
  { value: "ecommerce", label: "E-commerce" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(v?: number) {
  if (v == null) return "—";
  return `$${v.toFixed(2)}`;
}

function fmtBs(v?: number) {
  if (v == null) return "—";
  return `Bs ${v.toFixed(2)}`;
}

function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

function MarginBadge({ pct }: { pct?: number }) {
  if (pct == null) return <span className="text-muted">—</span>;
  const display = `${(pct * 100).toFixed(1)}%`;
  if (pct >= 0.2) return <span className="text-success fw-semibold">{display}</span>;
  if (pct >= 0.1) return <span className="text-warning fw-semibold">{display}</span>;
  return <span className="text-danger fw-semibold">{display}</span>;
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function ProductPricesComponent() {
  // ── tabla / filtros
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [loadingTable, setLoadingTable] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  // ── alerta spread
  const [spreadAlert, setSpreadAlert] = useState<string | null>(null);

  // ── modal corrida
  const [runChannel, setRunChannel] = useState("all");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const runModalCloseRef = useRef<HTMLButtonElement>(null);

  // ── carga de spread alert ─────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/inventory/pricing/spread-alert", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { data?: { alert?: boolean; message?: string }; error?: unknown }) => {
        if (b.data?.alert && b.data.message) {
          setSpreadAlert(b.data.message);
        }
      })
      .catch(() => undefined);
  }, []);

  // ── carga de tabla ────────────────────────────────────────────────────────────

  const loadPrices = useCallback(
    async (page: number, channel: string, search: string) => {
      setLoadingTable(true);
      setTableError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "50" });
        if (channel && channel !== "all") params.set("channel", channel);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/inventory/pricing/prices?${params}`, {
          cache: "no-store",
        });
        const body = (await res.json()) as {
          data?: { prices: ProductPrice[]; pagination: Pagination };
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(body.error?.message ?? `Error ${res.status}`);
        setPrices(body.data?.prices ?? []);
        if (body.data?.pagination) setPagination(body.data.pagination);
      } catch (e) {
        setTableError(e instanceof Error ? e.message : "Error al cargar precios");
      } finally {
        setLoadingTable(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPrices(1, filterChannel, filterSearch);
  }, [loadPrices]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterApply = () => {
    loadPrices(1, filterChannel, filterSearch);
  };

  const handlePageChange = (newPage: number) => {
    loadPrices(newPage, filterChannel, filterSearch);
  };

  // ── corrida de precios ────────────────────────────────────────────────────────

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const body: { channel?: string } = {};
      if (runChannel !== "all") body.channel = runChannel;

      const res = await fetch("/api/inventory/pricing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const resp = (await res.json()) as {
        data?: RunResult;
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(resp.error?.message ?? `Error ${res.status}`);
      setRunResult(resp.data ?? {});
      message.success("Corrida de precios completada.");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Error al correr precios");
      setRunning(false);
    } finally {
      setRunning(false);
    }
  };

  const handleCloseRunModal = () => {
    if (runResult) {
      loadPrices(1, filterChannel, filterSearch);
      setRunResult(null);
    }
    runModalCloseRef.current?.click();
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

                  {/* ── banner alerta spread ── */}
                  {spreadAlert && (
                    <div
                      className="alert d-flex align-items-center mb-3"
                      style={{ backgroundColor: "#fff3cd", borderColor: "#ffc107" }}
                    >
                      <i className="ti ti-alert-triangle me-2 fs-18 text-warning" />
                      <span className="text-dark">
                        <strong>⚠️ {spreadAlert}</strong> — Ejecutar corrida recomendada
                      </span>
                    </div>
                  )}

                  <div className="card flex-fill mb-0">
                    <div className="card-header d-flex align-items-center justify-content-between">
                      <h4>Precios Calculados</h4>
                      <Link
                        href="#"
                        className="btn btn-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#run-pricing-modal"
                        onClick={() => { setRunResult(null); setRunChannel("all"); }}
                      >
                        <i className="ti ti-player-play me-1" />
                        Correr Actualización de Precios
                      </Link>
                    </div>
                    <div className="card-body">

                      {/* ── filtros ── */}
                      <div className="d-flex gap-2 mb-3 flex-wrap">
                        <select
                          className="form-select"
                          style={{ maxWidth: 200 }}
                          value={filterChannel}
                          onChange={(e) => setFilterChannel(e.target.value)}
                        >
                          {CHANNEL_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="form-control"
                          style={{ maxWidth: 240 }}
                          placeholder="Buscar SKU o nombre…"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleFilterApply()}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={handleFilterApply}
                        >
                          <i className="ti ti-search" />
                        </button>
                      </div>

                      {/* ── loading ── */}
                      {loadingTable && (
                        <div className="d-flex justify-content-center py-5">
                          <Spin size="large" tip="Cargando precios…" />
                        </div>
                      )}

                      {/* ── error tabla ── */}
                      {!loadingTable && tableError && (
                        <div className="alert alert-danger d-flex align-items-center justify-content-between">
                          <span>
                            <i className="ti ti-alert-circle me-2" />
                            {tableError}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={() => loadPrices(pagination.page, filterChannel, filterSearch)}
                          >
                            Reintentar
                          </button>
                        </div>
                      )}

                      {/* ── tabla ── */}
                      {!loadingTable && !tableError && (
                        <>
                          <div className="table-responsive">
                            <table className="table border">
                              <thead className="thead-light">
                                <tr>
                                  <th>SKU</th>
                                  <th>Nombre</th>
                                  <th>Canal</th>
                                  <th>Costo Op. $</th>
                                  <th>Price USD</th>
                                  <th>Bs BCV</th>
                                  <th>Bs Binance</th>
                                  <th>Bs Ajuste</th>
                                  <th>Margen %</th>
                                  <th>Calculado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prices.length === 0 ? (
                                  <tr>
                                    <td colSpan={10} className="text-center text-muted py-4">
                                      No hay precios calculados todavía. Ejecuta una corrida.
                                    </td>
                                  </tr>
                                ) : (
                                  prices.map((row, idx) => (
                                    <tr key={`${row.sku}-${row.channel}-${idx}`}>
                                      <td>
                                        <span className="fw-semibold">{row.sku}</span>
                                      </td>
                                      <td>{row.name}</td>
                                      <td>
                                        {CHANNEL_NAMES[row.channel] ?? row.channel}
                                      </td>
                                      <td>{fmtUsd(row.operational_cost_usd)}</td>
                                      <td>{fmtUsd(row.price_usd)}</td>
                                      <td>{fmtBs(row.price_bs_bcv)}</td>
                                      <td>{fmtBs(row.price_bs_binance)}</td>
                                      <td>{fmtBs(row.price_bs_adjusted)}</td>
                                      <td>
                                        <MarginBadge pct={row.margin_pct} />
                                      </td>
                                      <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                                        {fmtDate(row.calculated_at)}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* ── paginación ── */}
                          {pagination.pages > 1 && (
                            <div className="d-flex align-items-center justify-content-between mt-3">
                              <span className="text-muted fs-13">
                                Mostrando {prices.length} de {pagination.total} registros
                              </span>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  disabled={pagination.page <= 1}
                                  onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                  ← Anterior
                                </button>
                                <span className="btn btn-sm btn-light disabled">
                                  {pagination.page} / {pagination.pages}
                                </span>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  disabled={pagination.page >= pagination.pages}
                                  onClick={() => handlePageChange(pagination.page + 1)}
                                >
                                  Siguiente →
                                </button>
                              </div>
                            </div>
                          )}
                        </>
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

      {/* ══ Modal corrida de precios ══ */}
      <div className="modal fade" id="run-pricing-modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Correr Actualización de Precios</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                disabled={running}
              />
            </div>
            <div className="modal-body">
              {!runResult ? (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Canal</label>
                    <select
                      className="form-select"
                      value={runChannel}
                      onChange={(e) => setRunChannel(e.target.value)}
                      disabled={running}
                    >
                      {CHANNEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {running && (
                    <div className="d-flex align-items-center gap-2 text-primary mt-3">
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />
                      <span>Calculando precios…</span>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="fw-semibold mb-3">Corrida completada:</p>
                  <ul className="list-unstyled">
                    <li className="mb-1">
                      <span className="text-success me-2">✅</span>
                      Productos procesados:{" "}
                      <strong>{runResult.total_products ?? "—"}</strong>
                    </li>
                    <li className="mb-1">
                      <span className="text-success me-2">✅</span>
                      Precios actualizados:{" "}
                      <strong>{runResult.total_updated ?? "—"}</strong>
                    </li>
                    <li className="mb-1">
                      <span className="text-danger me-2">❌</span>
                      Errores: <strong>{runResult.errors ?? 0}</strong>
                    </li>
                    <li className="mb-1">
                      <span className="me-2">📅</span>
                      Tasas del:{" "}
                      <strong>{runResult.rate_date ?? "—"}</strong>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!runResult ? (
                <>
                  <button
                    ref={runModalCloseRef}
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                    disabled={running}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRun}
                    disabled={running}
                  >
                    {running ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Ejecutando…
                      </>
                    ) : (
                      <>
                        <i className="ti ti-player-play me-1" />
                        Ejecutar
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    ref={runModalCloseRef}
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCloseRunModal}
                    data-bs-dismiss="modal"
                  >
                    Cerrar y actualizar tabla
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
