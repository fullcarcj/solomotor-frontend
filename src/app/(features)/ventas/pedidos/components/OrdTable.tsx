"use client";

import Link from "next/link";
import type { Sale } from "@/types/sales";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ChannelChip {
  key: string;
  label: string;
  extPrefix: string;
}

function getChannel(source: string): ChannelChip {
  const s = source.toLowerCase();
  if (s.includes("mercadolibre") || s.startsWith("ml_"))
    return { key: "ml", label: "Mercado Libre", extPrefix: "ML" };
  if (
    s.includes("social_media") ||
    s.includes("wa_") ||
    s.includes("whatsapp")
  )
    return { key: "wa", label: "WhatsApp", extPrefix: "WA" };
  if (
    s.includes("ecommerce") ||
    s.includes("ecom") ||
    s.includes("shopify")
  )
    return { key: "ecom", label: "E-commerce", extPrefix: "ECO" };
  if (s.includes("fuerza") || s.includes("field") || s.includes("sales_force"))
    return { key: "fuerza", label: "Fuerza Vtas.", extPrefix: "FV" };
  if (s.includes("mostrador") || s.includes("pos"))
    return { key: "mostrador", label: "Mostrador", extPrefix: "MOST" };
  return { key: "mostrador", label: source || "—", extPrefix: "—" };
}

interface CycleInfo {
  num: string;
  label: string;
  cls: string;
  next: string;
}

function getCycle(status: string): CycleInfo {
  switch (status.toLowerCase()) {
    case "pending":
      return { num: "01", label: "Captura", cls: "st-01", next: "02 Cotizar" };
    case "pending_payment":
      return { num: "02", label: "Cotizada", cls: "st-02", next: "03 Aprob." };
    case "approved":
      return { num: "03", label: "Aprobada", cls: "st-03", next: "04 Pago" };
    case "paid":
      return { num: "04", label: "Pagada", cls: "st-04", next: "05 Picking" };
    case "ready_to_ship":
      return {
        num: "05",
        label: "Picking",
        cls: "st-03",
        next: "06 Tránsito",
      };
    case "shipped":
    case "dispatched":
      return {
        num: "06",
        label: "Tránsito",
        cls: "st-06",
        next: "07 Entrega",
      };
    case "completed":
    case "delivered":
      return {
        num: "07",
        label: "Cerrada",
        cls: "st-07",
        next: "✓ Completada",
      };
    case "cancelled":
    case "canceled":
      return { num: "—", label: "Anulada", cls: "st-07", next: "—" };
    default:
      return { num: "?", label: status, cls: "st-07", next: "—" };
  }
}

const AV_PALETTE = [
  { bg: "#1e5a3a", color: "#86efac" },
  { bg: "#1e4a7a", color: "#93c5fd" },
  { bg: "#7a3a1e", color: "#fdba74" },
  { bg: "#7a1e1e", color: "#fca5a5" },
  { bg: "#5a2e7a", color: "#c4b5fd" },
  { bg: "#2d5a5a", color: "#67e8f9" },
  { bg: "#5a4a1e", color: "#fde047" },
];

function avColor(str: string): { bg: string; color: string } {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = ((h * 31 + str.charCodeAt(i)) >>> 0) % AV_PALETTE.length;
  return AV_PALETTE[h];
}

function initials(name: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const t = d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (d.toDateString() === now.toDateString()) return `Hoy ${t}`;
  if (d.toDateString() === yest.toDateString()) return `Ayer ${t}`;
  return (
    d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" }) +
    " " +
    t
  );
}

function fmtElapsed(iso: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "—";
  const days = ms / 86_400_000;
  const hours = ms / 3_600_000;
  const mins = ms / 60_000;
  if (days >= 1) return `${Math.floor(days)}d`;
  if (hours >= 1) return `${Math.floor(hours)}h`;
  return `${Math.floor(mins)}m`;
}

function elapsedBucket(
  iso: string,
  status: string
): "hot" | "warn" | "cold" | "ok" {
  const s = status.toLowerCase();
  if (
    ["completed", "delivered", "cancelled", "canceled"].includes(s)
  )
    return "ok";
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h > 48) return "hot";
  if (h > 12) return "warn";
  return "cold";
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const PkgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M7 8V5a5 5 0 0 1 10 0v3" />
  </svg>
);
const KebabIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);
const UpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="m7 14 5-5 5 5" />
  </svg>
);

// ─── Single row ───────────────────────────────────────────────────────────────

function isMercadoLibreSale(source: string): boolean {
  return String(source || "").toLowerCase().includes("mercadolibre");
}

interface RowProps {
  sale: Sale;
  selected: boolean;
  onRowClick: (id: string | number) => void;
  onRequestDispatch?: (sale: Sale) => void;
  onOpenMlMessaging?: (sale: Sale) => void;
}

function OrdRow({ sale, selected, onRowClick, onRequestDispatch, onOpenMlMessaging }: RowProps) {
  const ch = getChannel(sale.source);
  const isMl = isMercadoLibreSale(sale.source);
  const cycle = getCycle(sale.status);
  const isClosed = ["completed", "delivered", "cancelled", "canceled"].includes(
    sale.status.toLowerCase()
  );
  const elapsed = fmtElapsed(sale.created_at);
  const bucket = elapsedBucket(sale.created_at, sale.status);

  // Vendor
  const vendor = sale.sold_by?.trim() ?? "";
  const vendorIni = vendor ? initials(vendor) : "—";
  const vendorAv = avColor(vendor || String(sale.id));

  // Customer — TODO(backend): customer_name, phone no disponibles en GET /api/sales
  const custLabel =
    sale.customer_id != null ? `Cliente #${sale.customer_id}` : "Consumidor final";
  const custIni =
    sale.customer_id != null
      ? `C${String(sale.customer_id).slice(-2)}`
      : "CF";
  const custAv = avColor(custLabel);

  // Totals
  const usd = Number(sale.total_usd) || 0;
  // TODO(backend): order_total_amount interpretado como VES sólo si > 5× el valor USD;
  //               hasta que el backend exponga total_ves explícito.
  const rawAlt = Number(sale.order_total_amount) || 0;
  const showVes = rawAlt > usd * 5 && rawAlt > 0;
  const vesAmt = showVes ? rawAlt : 0;

  const chatHref =
    sale.chat_id != null ? `/bandeja/${sale.chat_id}` : null;

  const handleRowKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(sale.id);
    }
  };

  return (
    <>
      {/* ── Desktop table row ─────────────────────────── */}
      <tr
        className={`ord-row${selected ? " selected" : ""}`}
        onClick={() => onRowClick(sale.id)}
        onKeyDown={handleRowKey}
        tabIndex={0}
        role="button"
        aria-label={`Abrir detalle de orden #${sale.id}`}
      >
        {/* Col 1 · Orden */}
        <td data-label="Orden">
          <div className="c-order">
            <div className="ord-id">#{sale.id}</div>
            {sale.external_order_id && (
              <div className="ord-ext">
                <span className="lb">{ch.extPrefix} </span>
                {sale.external_order_id}
              </div>
            )}
            <div className="ord-date">
              <ClockIcon />
              {fmtDate(sale.created_at)}
            </div>
            <div className={`origin-chip ${ch.key}`}>
              <span className="dt" />
              {ch.label}
            </div>
            {isMl &&
              (sale.ml_account_nickname != null ||
                sale.ml_user_id != null) && (
              <div
                className="ord-ext ord-ml-seller"
                title={
                  sale.ml_user_id != null
                    ? `Cuenta ML (user_id): ${sale.ml_user_id}`
                    : undefined
                }
              >
                <span className="lb">Cuenta </span>
                {sale.ml_account_nickname ??
                  (sale.ml_user_id != null ? `#${sale.ml_user_id}` : "—")}
              </div>
            )}
          </div>
        </td>

        {/* Col 2 · Productos — TODO(backend): items no disponibles en listado */}
        <td data-label="Productos">
          <div className="c-products">
            <div className="prod-thumb-big">
              <PkgIcon />
            </div>
            <div className="prod-list">
              <div className="prod-item main">
                <span className="qt">—</span>
                <div className="body">
                  <div
                    className="n"
                    style={{ color: "var(--pd-text-faint)", fontStyle: "italic" }}
                  >
                    {/* TODO(backend): product_name, sku, quantity no expuestos en GET /api/sales */}
                    Ver detalle de orden
                  </div>
                  <div className="s">Click para expandir</div>
                </div>
                <span className="pr">—</span>
              </div>
            </div>
          </div>
        </td>

        {/* Col 3 · Cliente — TODO(backend): full_name, phone, document no disponibles */}
        <td data-label="Cliente">
          <div className="c-client">
            <div
              className="c-client-av"
              style={{ background: custAv.bg, color: custAv.color }}
              aria-hidden="true"
            >
              {custIni}
            </div>
            <div className="c-client-info">
              <div className="c-client-nm">{custLabel}</div>
              <div className="c-client-ced">
                <span className="lb">ID </span>
                {sale.customer_id ?? "—"}
              </div>
              {/* TODO(backend): phone no disponible */}
              <div className="c-client-contact">
                <PhoneIcon />
                —
              </div>
            </div>
          </div>
        </td>

        {/* Col 4 · Logística — TODO(backend): warehouse_name, stock_status no disponibles */}
        <td data-label="Logística">
          <div className="c-logistics">
            <div className="logi-row">
              <HomeIcon />
              {/* TODO(backend): warehouse_name no disponible */}
              <span>—</span>
            </div>
            {/* TODO(backend): stock_status no disponible */}
            <span className="logi-stock ok">
              <span className="d" />
              Stock —
            </span>
            {vendor && (
              <div className="vend-chip">
                <div
                  className="v-av"
                  style={{ background: vendorAv.bg, color: vendorAv.color }}
                  aria-hidden="true"
                >
                  {vendorIni}
                </div>
                <span className="vn">{vendor.split(" ")[0]}</span>
              </div>
            )}
          </div>
        </td>

        {/* Col 5 · Estado */}
        <td data-label="Estado">
          <div className="c-state">
            <span className={`status ${cycle.cls}`}>
              <span className="num">{cycle.num} </span>
              {cycle.label}
            </span>
            <span className="next-step">
              <span className="ar">→</span>
              {cycle.next}
            </span>
            <div className="state-row">
              <span className={`elapsed ${bucket}`}>
                <ClockIcon />
                {elapsed}
              </span>
              {sale.chat_id != null && (
                <span className="chat-chip">
                  <span className="dot-g" />
                  <ChatIcon />
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Col 6 · Total */}
        <td data-label="Total" style={{ textAlign: "right" }}>
          <div className="c-total">
            {usd > 0 && (
              <div className="total-usd">
                <span className="c">USD</span>
                {usd.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
            <div className="total-ves">
              <span className="c">{showVes ? "VES" : "USD"}</span>
              {showVes
                ? vesAmt.toLocaleString("es-VE", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : usd > 0
                  ? usd.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
            </div>
            {/* TODO(backend): subtotal, IVA y margin_pct no disponibles en el listado */}
            <span className="margin-tag">
              <UpIcon />—
            </span>
          </div>
        </td>

        {/* Col 7 · Acciones */}
        <td
          data-label="Acciones"
          onClick={(e) => e.stopPropagation()}
          style={{ textAlign: "right" }}
        >
          <div className="c-actions">
            {chatHref ? (
              <Link
                href={chatHref}
                className={`act-chat-btn${isClosed ? " disabled" : ""}`}
                aria-label={`Abrir chat de la orden #${sale.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <ChatIcon />
                Chat
                {!isClosed && sale.chat_id != null && (
                  <span className="notif-d" aria-hidden="true" />
                )}
              </Link>
            ) : (
              <span
                className="act-chat-btn disabled"
                aria-label="Sin chat vinculado a esta orden"
              >
                <ChatIcon />
                Chat
              </span>
            )}

            {isMl && onOpenMlMessaging && (
              <button
                type="button"
                className="act-ml-btn"
                aria-label={`Mensajería ML orden #${sale.id}`}
                title="Mensajería interna Mercado Libre (post-venta)"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMlMessaging(sale);
                }}
              >
                ML
              </button>
            )}

            <button
              className="act-kebab"
              aria-label={`Más opciones para orden #${sale.id}`}
              title={
                onRequestDispatch && sale.status === "paid"
                  ? "Solicitar despacho"
                  : "Más opciones"
              }
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onRequestDispatch && sale.status === "paid") {
                  onRequestDispatch(sale);
                }
              }}
            >
              <KebabIcon />
            </button>
          </div>
        </td>
      </tr>

      {/* ── Mobile card row ───────────────────────────── */}
      <tr
        className="ord-card-row"
        aria-hidden="true"
        onClick={() => onRowClick(sale.id)}
      >
        <td className="ord-card" colSpan={7}>
          <div className="ord-card-inner">
            <div className="ord-card-header">
              <div className={`origin-chip ${ch.key}`}>
                <span className="dt" />
                {ch.label}
              </div>
              <span className="ord-card-id">#{sale.id}</span>
              <span className="ord-card-date">{fmtDate(sale.created_at)}</span>
              {isMl &&
                (sale.ml_account_nickname != null ||
                  sale.ml_user_id != null) && (
                <span
                  className="ord-card-ml-seller"
                  title={
                    sale.ml_user_id != null
                      ? `Cuenta ML (user_id): ${sale.ml_user_id}`
                      : undefined
                  }
                >
                  {sale.ml_account_nickname ??
                    (sale.ml_user_id != null ? `ML #${sale.ml_user_id}` : "")}
                </span>
              )}
            </div>

            <div className="ord-card-body">
              <div className="ord-card-thumb">
                <PkgIcon />
              </div>
              <div className="ord-card-prod-info">
                <div
                  className="ord-card-prod-name"
                  style={{ color: "var(--pd-text-faint)", fontStyle: "italic" }}
                >
                  Ver detalle de orden
                </div>
                <div className="ord-card-customer">
                  <PhoneIcon />
                  {custLabel}
                </div>
              </div>
            </div>

            <div className="ord-card-footer">
              <span className={`status ${cycle.cls}`}>
                <span className="num">{cycle.num} </span>
                {cycle.label}
              </span>
              <span className={`elapsed ${bucket}`}>
                <ClockIcon />
                {elapsed}
              </span>
              {isMl && onOpenMlMessaging && (
                <button
                  type="button"
                  className="act-ml-btn"
                  style={{ marginLeft: 6 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMlMessaging(sale);
                  }}
                >
                  ML Msg
                </button>
              )}
              <span className="ord-card-ves">
                {usd > 0
                  ? `$${usd.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </span>
              {chatHref ? (
                <Link
                  href={chatHref}
                  className={`act-chat-btn${isClosed ? " disabled" : ""}`}
                  aria-label={`Chat de la orden #${sale.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChatIcon />
                  Chat
                </Link>
              ) : (
                <span className="act-chat-btn disabled">
                  <ChatIcon />
                  Chat
                </span>
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

const SK_WIDTHS = [70, 80, 65, 75, 60, 85, 50];

function SkeletonRow({ idx }: { idx: number }) {
  const offset = idx % 3;
  return (
    <tr className="ord-row" style={{ cursor: "default" }}>
      {SK_WIDTHS.map((w, i) => (
        <td key={i} style={{ padding: "20px 14px" }}>
          <span
            className="pd-skeleton"
            style={{ width: `${w - offset * 5}%`, height: 14 }}
          />
          {i < 4 && (
            <span
              className="pd-skeleton"
              style={{
                width: `${w - 20 - offset * 3}%`,
                height: 10,
                marginTop: 6,
                display: "block",
              }}
            />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface OrdTableProps {
  sales: Sale[];
  loading: boolean;
  onRowClick: (id: string | number) => void;
  selectedId: string | number | null;
  onRequestDispatch?: (sale: Sale) => void;
  /** Abre modal de mensajería pack ML (solo filas Mercado Libre). */
  onOpenMlMessaging?: (sale: Sale) => void;
  onClearFilters: () => void;
}

export default function OrdTable({
  sales,
  loading,
  onRowClick,
  selectedId,
  onRequestDispatch,
  onOpenMlMessaging,
  onClearFilters,
}: OrdTableProps) {
  return (
    <table className="ord-table" role="grid">
      <thead>
        <tr>
          <th scope="col">
            Orden <span className="sort" aria-hidden="true">↕</span>
          </th>
          <th scope="col">Productos</th>
          <th scope="col">Cliente</th>
          <th scope="col">Logística</th>
          <th scope="col">
            Estado <span className="sort" aria-hidden="true">↕</span>
          </th>
          <th scope="col" className="right">
            Total <span className="sort" aria-hidden="true">↕</span>
          </th>
          <th scope="col" className="right">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 7 }, (_, i) => <SkeletonRow key={i} idx={i} />)
        ) : sales.length === 0 ? (
          <tr className="ord-row" style={{ cursor: "default" }}>
            <td colSpan={7} style={{ padding: 0, border: "none" }}>
              <div className="pd-empty" role="status">
                <div className="pd-empty-icon" aria-hidden="true">
                  📋
                </div>
                <p className="pd-empty-msg">
                  No hay órdenes que coincidan con los filtros activos
                </p>
                <button
                  className="pd-empty-btn"
                  onClick={onClearFilters}
                  type="button"
                >
                  Limpiar filtros
                </button>
              </div>
            </td>
          </tr>
        ) : (
          sales.map((s) => (
            <OrdRow
              key={s.id}
              sale={s}
              selected={selectedId === s.id}
              onRowClick={onRowClick}
              onRequestDispatch={onRequestDispatch}
              onOpenMlMessaging={onOpenMlMessaging}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
