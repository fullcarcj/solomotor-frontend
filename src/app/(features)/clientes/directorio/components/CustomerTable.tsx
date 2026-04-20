import type { Customer, CustomersMeta } from "@/types/customers";
import {
  directorioAvatarClass,
  directorioInitials,
} from "../directorioChannel";

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function fmtUsd(v: number | string | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "—";
  return `$ ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function channelPill(c: Customer): { cls: string; label: string } {
  const t = (c.customer_type ?? "").toLowerCase();
  if (t === "mercadolibre" || c.primary_ml_buyer_id)
    return { cls: "crm-dir-pill-mini crm-dir-pill-ml", label: "Mercado Libre" };
  if (t === "mostrador")
    return { cls: "crm-dir-pill-mini crm-dir-pill-mostrador", label: "Mostrador" };
  if (t === "online")
    return { cls: "crm-dir-pill-mini crm-dir-pill-ecom", label: "E-com" };
  if (t === "cartera")
    return { cls: "crm-dir-pill-mini crm-dir-pill-fuerza", label: "Fuerza ventas" };
  if (c.wa_status?.trim())
    return { cls: "crm-dir-pill-mini crm-dir-pill-wa", label: "WhatsApp" };
  return { cls: "crm-dir-pill-mini", label: t || "—" };
}

function stageVisual(status: string | null | undefined): {
  label: string;
  color: string;
  dot: string;
} {
  const s = (status ?? "").toLowerCase();
  if (s === "active")
    return { label: "Activo", color: "#22c55e", dot: "#22c55e" };
  if (s === "lead")
    return { label: "Lead", color: "#60a5fa", dot: "#3b82f6" };
  if (s === "inactive")
    return { label: "Inactivo", color: "#9aa4b8", dot: "#6e7681" };
  if (s === "blocked")
    return { label: "Bloqueado", color: "#ef4444", dot: "#ef4444" };
  return { label: "—", color: "#9aa4b8", dot: "#5e6a82" };
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}>
          <div className="crm-dir-skel" style={{ width: i === 0 ? "70%" : "80%" }} />
        </td>
      ))}
    </tr>
  );
}

interface Props {
  customers: Customer[];
  meta: CustomersMeta;
  loading: boolean;
  error: string | null;
  onRowClick: (id: number) => void;
  onPageChange: (offset: number) => void;
  onRetry: () => void;
  /** Si false, no mostrar paginación (p. ej. filtro por origen solo en cliente). */
  showPagination?: boolean;
}

export default function CustomerTable({
  customers,
  meta,
  loading,
  error,
  onRowClick,
  onPageChange,
  onRetry,
  showPagination = true,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const currentPage = Math.floor(meta.offset / meta.limit) + 1;

  return (
    <>
      {error && (
        <div className="crm-dir-alert" role="alert">
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          <button type="button" className="crm-dir-btn crm-dir-btn--ghost" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      )}

      <div className="crm-dir-table-wrap">
        <table className="crm-dir-customers">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Doc. / contacto</th>
              <th>Teléfonos</th>
              <th>Canal</th>
              <th>Etapa</th>
              <th>Órdenes</th>
              <th>LTV</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && !error && customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--crm-text-lo, #5e6a82)" }}>
                  No se encontraron clientes con estos criterios
                </td>
              </tr>
            )}

            {!loading &&
              customers.map((c) => {
                const av = directorioAvatarClass(c);
                const ini = directorioInitials(c.full_name || "?");
                const ch = channelPill(c);
                const st = stageVisual(c.crm_status);
                const subId =
                  c.primary_ml_buyer_id != null
                    ? `buyer_id: ${c.primary_ml_buyer_id}`
                    : `id: ${c.id}`;
                const displayName = toTitleCase(c.full_name || "?");
                const nick = (c.full_name || "").toLowerCase().replace(/\s+/g, "");
                const phone2 = c.phone_2 || c.alternative_phone;
                const orders = c.total_orders ?? 0;

                return (
                  <tr key={c.id} onClick={() => onRowClick(c.id)}>
                    <td>
                      <div className="crm-dir-cust">
                        <div className={`crm-dir-avatar${av ? ` ${av}` : ""}`}>{ini}</div>
                        <div>
                          <div className="crm-dir-name">{displayName}</div>
                          {nick && <div className="crm-dir-nick">@{nick}</div>}
                          <div className="crm-dir-sub">{subId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="crm-dir-rif"
                        title={c.email ?? undefined}
                      >
                        {c.primary_ml_buyer_id != null
                          ? `ML #${c.primary_ml_buyer_id}`
                          : c.email
                            ? c.email.length > 28
                              ? `${c.email.slice(0, 26)}…`
                              : c.email
                            : "—"}
                      </span>
                    </td>
                    <td className="crm-dir-phone">
                      {c.phone ?? <span style={{ opacity: 0.5 }}>—</span>}
                      {phone2 ? (
                        <span className="crm-dir-phone-sec">{phone2}</span>
                      ) : (
                        <span className="crm-dir-phone-sec">—</span>
                      )}
                    </td>
                    <td>
                      <span className={ch.cls}>
                        <span className="dot" />
                        {ch.label}
                      </span>
                    </td>
                    <td>
                      <span className="crm-dir-stage" style={{ color: st.color }}>
                        <span
                          className="crm-dir-stage-dot"
                          style={{ background: st.dot }}
                        />
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`crm-dir-ticket${orders > 0 ? " has" : ""}`}
                      >
                        {orders}{" "}
                        {orders === 1 ? (
                          <span className="small">orden</span>
                        ) : (
                          <span className="small">órdenes</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="crm-dir-ltv">{fmtUsd(c.total_spent_usd)}</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showPagination && !loading && meta.total > meta.limit && (
        <div className="crm-dir-foot">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(0, meta.offset - meta.limit))}
          >
            <i className="ti ti-chevron-left" /> Anterior
          </button>
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            {" · "}
            {meta.total.toLocaleString("es-VE")} clientes
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(meta.offset + meta.limit)}
          >
            Siguiente <i className="ti ti-chevron-right" />
          </button>
        </div>
      )}
    </>
  );
}
