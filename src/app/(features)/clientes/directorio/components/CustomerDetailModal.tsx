"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomerDetail, CustomerHistoryItem } from "@/types/customers";
import CustomerStatusBadge from "./CustomerStatusBadge";
import CustomerTypeBadge from "./CustomerTypeBadge";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtUsd(v: number | string | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function parseDetail(json: unknown): CustomerDetail | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const d = (o.data as Record<string, unknown>) ?? o;
  if (!d.full_name) return null;
  return d as unknown as CustomerDetail;
}

function parseHistory(json: unknown): CustomerHistoryItem[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const raw = o.data ?? o;
  if (Array.isArray(raw)) return raw as CustomerHistoryItem[];
  if (Array.isArray((raw as Record<string, unknown>)?.items))
    return ((raw as Record<string, unknown>).items as CustomerHistoryItem[]);
  return [];
}

const SOURCE_LABELS: Record<string, string> = {
  mercadolibre:  "MercadoLibre",
  mostrador:     "Mostrador",
  ecommerce:     "E-commerce",
  social_media:  "Redes",
  fuerza_ventas: "F. Ventas",
};

/* ── Skeleton de sección ─────────────────────────────────────────────────── */

function SkeletonBlock() {
  return (
    <div className="placeholder-glow">
      {Array.from({ length: 3 }).map((_, i) => (
        <p key={i}>
          <span className={`placeholder col-${6 + (i % 3)}`} />
        </p>
      ))}
    </div>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */

interface Props {
  customerId: number | null;
  onClose:    () => void;
}

/* ── Componente principal ────────────────────────────────────────────────── */

export default function CustomerDetailModal({ customerId, onClose }: Props) {
  const [detail, setDetail]             = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail]   = useState<string | null>(null);

  const [history, setHistory]           = useState<CustomerHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded]   = useState(false);
  const [errorHistory, setErrorHistory]     = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  /* Cargar detalle al cambiar el id */
  useEffect(() => {
    if (customerId === null) {
      setDetail(null);
      setHistory([]);
      setHistoryLoaded(false);
      return;
    }

    let alive = true;
    setLoadingDetail(true);
    setErrorDetail(null);
    setHistory([]);
    setHistoryLoaded(false);

    fetch(`/api/clientes/directorio/${customerId}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json: unknown) => {
        if (!alive) return;
        const parsed = parseDetail(json);
        if (parsed) {
          setDetail(parsed);
        } else {
          setErrorDetail("No se pudo cargar el detalle del cliente.");
        }
      })
      .catch(() => {
        if (alive) setErrorDetail("Error de red al cargar el cliente.");
      })
      .finally(() => {
        if (alive) setLoadingDetail(false);
      });

    return () => { alive = false; };
  }, [customerId]);

  /* Cargar historial bajo demanda */
  const loadHistory = () => {
    if (!customerId || historyLoaded || loadingHistory) return;
    setLoadingHistory(true);
    setErrorHistory(null);

    fetch(`/api/clientes/historial/${customerId}?limit=10`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json: unknown) => {
        setHistory(parseHistory(json));
        setHistoryLoaded(true);
      })
      .catch(() => setErrorHistory("Error al cargar el historial."))
      .finally(() => setLoadingHistory(false));
  };

  if (customerId === null) return null;

  const open = customerId !== null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        className={`modal fade${open ? " show d-block" : ""}`}
        tabIndex={-1}
        style={{ zIndex: 1050 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="modal-header">
              {detail && !loadingDetail ? (
                <div className="d-flex align-items-center gap-3">
                  {/* Avatar iniciales */}
                  <div
                    className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                    style={{ width: 48, height: 48, fontSize: 18 }}
                  >
                    {initials(detail.full_name)}
                  </div>
                  <div>
                    <h5 className="modal-title mb-0">
                      {detail.full_name}
                      <CustomerTypeBadge type={detail.customer_type} />
                    </h5>
                    <CustomerStatusBadge status={detail.crm_status} />
                  </div>
                </div>
              ) : (
                <h5 className="modal-title">
                  {loadingDetail ? "Cargando…" : "Detalle de Cliente"}
                </h5>
              )}
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Cerrar"
              />
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div className="modal-body">
              {loadingDetail && <SkeletonBlock />}

              {errorDetail && (
                <div className="alert alert-danger" role="alert">
                  {errorDetail}
                </div>
              )}

              {detail && !loadingDetail && (
                <>
                  {/* Datos de contacto */}
                  <h6 className="fw-semibold text-muted text-uppercase small mb-2">
                    Datos de Contacto
                  </h6>
                  <div className="row g-2 mb-4">
                    <InfoItem icon="phone"          label="Teléfono principal" value={detail.phone} />
                    <InfoItem icon="phone-plus"     label="Teléfono 2"        value={detail.phone_2} />
                    <InfoItem icon="device-mobile"  label="Alternativo"       value={detail.alternative_phone} />
                    <InfoItem icon="mail"           label="Email"             value={detail.email} />
                    <InfoItem icon="map-pin"        label="Ciudad"            value={detail.city} />
                    <InfoItem icon="home"           label="Dirección"         value={detail.address} />
                    {detail.wa_status && (
                      <InfoItem icon="brand-whatsapp" label="WhatsApp" value={detail.wa_verified_name ?? detail.wa_status} />
                    )}
                  </div>

                  {/* Historial comercial */}
                  <h6 className="fw-semibold text-muted text-uppercase small mb-2">
                    Historial Comercial
                  </h6>
                  <div className="row g-2 mb-4">
                    <StatItem label="Total órdenes"    value={String(detail.total_orders)} />
                    <StatItem label="Total gastado"     value={fmtUsd(detail.total_spent_usd)} />
                    <StatItem label="Primera compra"    value={fmtDate(detail.first_order_date)} />
                    <StatItem label="Última compra"     value={fmtDate(detail.last_order_date)} />
                    {detail.client_segment && (
                      <StatItem label="Segmento" value={detail.client_segment} />
                    )}
                  </div>

                  {/* Tags */}
                  {detail.tags && detail.tags.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-semibold text-muted text-uppercase small mb-2">
                        Etiquetas
                      </h6>
                      <div className="d-flex flex-wrap gap-1">
                        {detail.tags.map((tag) => (
                          <span key={tag} className="badge bg-secondary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehículos */}
                  <h6 className="fw-semibold text-muted text-uppercase small mb-2">
                    Vehículos Registrados
                  </h6>
                  {detail.vehicles && detail.vehicles.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2 mb-4">
                      {detail.vehicles.map((v) => (
                        <span
                          key={v.id}
                          className="badge bg-light text-dark border d-inline-flex align-items-center gap-1"
                        >
                          <i className="ti ti-car fs-12" />
                          {v.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small mb-4">
                      Sin vehículos registrados
                    </p>
                  )}

                  {/* Historial de compras (lazy) */}
                  <h6 className="fw-semibold text-muted text-uppercase small mb-2">
                    Historial de Compras
                  </h6>
                  {!historyLoaded && !loadingHistory && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm mb-3"
                      onClick={loadHistory}
                    >
                      <i className="ti ti-history me-1" />
                      Ver historial de compras
                    </button>
                  )}
                  {loadingHistory && (
                    <div className="placeholder-glow mb-3">
                      <span className="placeholder col-12 rounded" style={{ height: 40 }} />
                    </div>
                  )}
                  {errorHistory && (
                    <div className="alert alert-warning small py-2">{errorHistory}</div>
                  )}
                  {historyLoaded && history.length === 0 && (
                    <p className="text-muted small">Sin compras registradas.</p>
                  )}
                  {historyLoaded && history.length > 0 && (
                    <div className="table-responsive mb-2">
                      <table className="table table-sm table-borderless">
                        <thead className="table-light">
                          <tr>
                            <th>Fecha</th>
                            <th>Canal</th>
                            <th className="text-end">Total USD</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((h, i) => (
                            <tr key={`${String(h.id)}-${i}`}>
                              <td className="text-nowrap">{fmtDate(h.date)}</td>
                              <td>{SOURCE_LABELS[h.source] ?? h.source}</td>
                              <td className="text-end fw-semibold">{fmtUsd(h.total_usd)}</td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {h.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────────────── */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-componentes de UI ───────────────────────────────────────────────── */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="col-sm-6">
      <div className="d-flex align-items-start gap-2">
        <i className={`ti ti-${icon} text-muted mt-1 flex-shrink-0`} />
        <div>
          <p className="mb-0 text-muted" style={{ fontSize: 11 }}>
            {label}
          </p>
          <p className="mb-0 fw-semibold small">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-sm-3 col-6">
      <div className="border rounded p-2 text-center h-100">
        <p className="mb-1 text-muted" style={{ fontSize: 11 }}>
          {label}
        </p>
        <p className="mb-0 fw-bold small">{value}</p>
      </div>
    </div>
  );
}
