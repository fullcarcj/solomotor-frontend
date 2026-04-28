"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SaleDetail, SalePaymentReconciliation, ItemPreview, SaleItem } from "@/types/sales";
import { useTodayCurrencyRates } from "@/hooks/useTodayCurrencyRates";
import { paymentMethodLabel } from "@/app/(features)/ventas/pedidos/paymentMethodCatalog";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getChannel(source: string) {
  const s = source.toLowerCase();
  if (s.includes("mercadolibre") || s.startsWith("ml_"))
    return { key: "ml", label: "Mercado Libre", extPrefix: "ML", color: "#f59e0b" };
  if (s.includes("wa_") || s.includes("whatsapp") || s.includes("social_media"))
    return { key: "wa", label: "WhatsApp", extPrefix: "WA", color: "#22c55e" };
  if (s.includes("ecommerce") || s.includes("shopify"))
    return { key: "ecom", label: "E-commerce", extPrefix: "ECO", color: "#8b5cf6" };
  if (s.includes("mostrador") || s.includes("pos"))
    return { key: "mostrador", label: "Mostrador", extPrefix: "POS", color: "#06b6d4" };
  return { key: "other", label: source || "—", extPrefix: "—", color: "#94a3b8" };
}

function normStatus(raw: string) {
  const s = String(raw ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const a: Record<string, string> = {
    pagada: "paid", confirmed: "paid",
    anulada: "cancelled", cancelada: "cancelled",
    pendiente: "pending", cerrada: "completed",
    entregada: "delivered", enviada: "shipped", despachada: "dispatched",
  };
  return a[s] ?? s;
}

interface Cycle { num: string; label: string; cls: string; next: string }
function getCycle(raw: string): Cycle {
  switch (normStatus(raw)) {
    case "pending":               return { num: "01", label: "Captura",      cls: "st-01", next: "Cotizar" };
    case "pending_payment":       return { num: "02", label: "Cotizada",     cls: "st-02", next: "Aprobar" };
    case "approved":              return { num: "03", label: "Aprobada",     cls: "st-03", next: "Pago" };
    case "pending_cash_approval": return { num: "04", label: "Pago (caja)", cls: "st-02", next: "Aprueba caja" };
    case "payment_overdue":       return { num: "02", label: "Cobro vencido", cls: "st-02", next: "Regularizar" };
    case "paid":                  return { num: "04", label: "Pagada",       cls: "st-04", next: "Picking" };
    case "ready_to_ship":         return { num: "05", label: "Picking",      cls: "st-03", next: "Tránsito" };
    case "shipped":
    case "dispatched":            return { num: "06", label: "Tránsito",     cls: "st-06", next: "Entrega" };
    case "completed":
    case "delivered":             return { num: "07", label: "Cerrada",      cls: "st-07", next: "✓ Completada" };
    case "cancelled":
    case "canceled":
    case "refunded":              return { num: "—",  label: "Anulada",      cls: "st-xx", next: "—" };
    default:                      return { num: "?",  label: raw || "—",     cls: "st-07", next: "—" };
  }
}

const CYCLE_PALETTE: Record<string, { bg: string; color: string; border: string }> = {
  "st-01": { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  "st-02": { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.3)"   },
  "st-03": { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.3)"   },
  "st-04": { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", border: "rgba(74,222,128,0.3)"   },
  "st-05": { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.3)"  },
  "st-06": { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8", border: "rgba(56,189,248,0.3)"   },
  "st-07": { bg: "rgba(148,163,184,0.10)", color: "#94a3b8", border: "rgba(148,163,184,0.2)"  },
  "st-xx": { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)"  },
};

function cyclePalette(cls: string) {
  return CYCLE_PALETTE[cls] ?? CYCLE_PALETTE["st-07"];
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-VE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtElapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "—";
  const d = ms / 86_400_000, h = ms / 3_600_000, m = ms / 60_000;
  if (d >= 1) return `${Math.floor(d)}d`;
  if (h >= 1) return `${Math.floor(h)}h`;
  return `${Math.floor(m)}m`;
}

function fmtN(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!isFinite(n)) return "—";
  return n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const FULFILLMENT_LABELS: Record<string, string> = {
  retiro_tienda: "Retiro en tienda",
  envio_propio: "Envío propio",
  mercado_envios: "Mercado Envíos",
  entrega_vendedor: "Entrega vendedor",
  retiro_acordado: "Retiro acordado",
  desde_bodega: "Desde bodega",
};
function fulfillmentLabel(v: string | null | undefined): string {
  const k = v?.trim() ?? "";
  return FULFILLMENT_LABELS[k] ?? (k || "Sin definir");
}

// ─── Micro-componentes ────────────────────────────────────────────────────────

const MUTED: React.CSSProperties = { color: "var(--mu-ink-mute)", fontSize: 10, lineHeight: 1.4 };
const MONO: React.CSSProperties  = { fontFamily: "monospace" };

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 8, fontWeight: 800, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--mu-ink-mute)",
      marginBottom: 10,
    }}>
      <i className={icon} style={{ fontSize: 11 }} />
      {label}
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      background: "var(--mu-panel-2, rgba(255,255,255,0.04))",
      border: `1px solid ${accent ?? "var(--mu-line, rgba(255,255,255,0.07))"}`,
      borderRadius: 8,
      padding: "12px 14px",
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 11, lineHeight: 1.5 }}>
      <span style={{ color: "var(--mu-ink-mute)", minWidth: 90, flexShrink: 0, fontSize: 10 }}>{label}</span>
      <span style={{ color: "var(--mu-ink)", ...(mono ? MONO : {}) }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--mu-line, rgba(255,255,255,0.07))", margin: "12px 0" }} />;
}

// ─── CycleBadge ──────────────────────────────────────────────────────────────

function CycleBadge({ cycle, small }: { cycle: Cycle; small?: boolean }) {
  const p = cyclePalette(cycle.cls);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: p.bg, color: p.color,
      border: `1px solid ${p.border}`,
      fontSize: small ? 9 : 10, fontWeight: 700, padding: small ? "2px 6px" : "3px 9px",
      borderRadius: 5, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ opacity: 0.65, fontSize: small ? 8 : 9 }}>{cycle.num}</span>
      {cycle.label}
    </span>
  );
}

// ─── ProductsBlock ────────────────────────────────────────────────────────────

interface DisplayItem {
  key: string;
  name: string;
  sku: string;
  qty: number | string;
  unit_price_usd: number | string | null;
  line_total_usd: number | string | null;
  image_url?: string | null;
}

function buildDisplayItems(preview: ItemPreview[] | null | undefined, detail: SaleItem[]): DisplayItem[] {
  if (preview && preview.length > 0) {
    return preview.map((p, i) => {
      const d = detail.find((x) => x.sku === p.sku);
      return {
        key: `${p.sku}-${i}`,
        name: p.name || p.sku,
        sku: p.sku,
        qty: p.qty,
        unit_price_usd: d?.unit_price_usd ?? p.unit_price_usd,
        line_total_usd: d?.line_total_usd ?? null,
        image_url: p.image_url,
      };
    });
  }
  if (detail.length > 0) {
    return detail.map((d) => ({
      key: String(d.id),
      name: d.sku,
      sku: d.sku,
      qty: d.quantity,
      unit_price_usd: d.unit_price_usd,
      line_total_usd: d.line_total_usd,
      image_url: null,
    }));
  }
  return [];
}

function ProductThumb({ url, name }: { url: string | null | undefined; name: string }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name}
        onError={() => setErr(true)} loading="lazy"
        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6,
                 border: "1px solid var(--mu-line)", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 6, flexShrink: 0,
      background: "rgba(255,255,255,0.04)", border: "1px solid var(--mu-line)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--mu-ink-mute)",
    }}>
      <i className="ti ti-package" style={{ fontSize: 16 }} />
    </div>
  );
}

function ProductsBlock({ items, total }: { items: DisplayItem[]; total: number }) {
  if (items.length === 0) {
    return (
      <p style={{ ...MUTED, margin: 0, fontStyle: "italic" }}>Sin ítems registrados</p>
    );
  }
  return (
    <div>
      {items.map((it) => (
        <div key={it.key} style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          padding: "8px 0",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <ProductThumb url={it.image_url} name={it.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mu-ink)", lineHeight: 1.35,
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {it.name}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
              {it.sku !== it.name && (
                <span style={{ ...MUTED, ...MONO, fontSize: 9 }}>{it.sku}</span>
              )}
              <span style={{ ...MUTED }}>×{it.qty}</span>
              {it.unit_price_usd != null && (
                <span style={{ ...MUTED }}>$ {fmtN(it.unit_price_usd)} c/u</span>
              )}
            </div>
          </div>
          {it.line_total_usd != null && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mu-ink)", ...MONO, flexShrink: 0 }}>
              $ {fmtN(it.line_total_usd)}
            </div>
          )}
        </div>
      ))}
      {total > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 10 }}>
          <span style={{ ...MUTED, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total ítems</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mu-ink)", ...MONO }}>$ {fmtN(total)}</span>
        </div>
      )}
    </div>
  );
}

// ─── AmountsBlock ─────────────────────────────────────────────────────────────

function AmountsBlock({ sale, bcv, bin }: {
  sale: SaleDetail;
  bcv: number;
  bin: number;
}) {
  const isNativeVes = sale.rate_type === "NATIVE_VES";
  const usd = !isNativeVes ? (Number(sale.total_usd) || 0) : 0;
  const bs  = isNativeVes
    ? (Number(sale.total_amount_bs) || Number(sale.order_total_amount) || 0)
    : (Number(sale.total_amount_bs) || 0);

  return (
    <div>
      {usd > 0 && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--mu-ink)", ...MONO }}>$ {fmtN(usd)}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--mu-ink-mute)" }}>USD</span>
        </div>
      )}
      {bs > 0 && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: bs === usd ? 0 : 6 }}>
          <span style={{ fontSize: bs > 0 && usd <= 0 ? 22 : 16, fontWeight: bs > 0 && usd <= 0 ? 800 : 600,
                         color: "var(--mu-ink)", ...MONO }}>
            Bs. {fmtN(bs)}
          </span>
        </div>
      )}
      {(usd > 0 || bs > 0) && sale.exchange_rate_bs_per_usd != null && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, marginBottom: 2 }}>
          <span style={{ ...MUTED }}>Tasa</span>
          <span style={{ fontSize: 11, color: "var(--mu-ink)", ...MONO }}>Bs. {fmtN(sale.exchange_rate_bs_per_usd)}</span>
          {sale.rate_type && (
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              background: "rgba(255,255,255,0.07)", color: "var(--mu-ink-mute)",
              padding: "1px 5px", borderRadius: 3,
            }}>{sale.rate_type.replace("_", " ")}</span>
          )}
        </div>
      )}
      {bs > 0 && (bcv > 0 || bin > 0) && (
        <div style={{
          marginTop: 8, padding: "8px 10px",
          background: "rgba(255,255,255,0.03)", borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {bcv > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ ...MUTED, fontSize: 10 }}>≈ BCV</span>
              <span style={{ color: "var(--mu-ink-mute)", ...MONO }}>$ {fmtN(bs / bcv)} USD</span>
            </div>
          )}
          {bin > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ ...MUTED, fontSize: 10 }}>≈ Binance</span>
              <span style={{ color: "var(--mu-ink-mute)", ...MONO }}>$ {fmtN(bs / bin)} USD</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ReconCard ────────────────────────────────────────────────────────────────

function ReconCard({ pr, stmtId }: { pr: SalePaymentReconciliation | null | undefined; stmtId: number | null }) {
  if (!pr && stmtId == null) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
                    background: "rgba(255,255,255,0.03)", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", flexShrink: 0 }} />
        <span style={{ ...MUTED }}>Sin pago vinculado</span>
      </div>
    );
  }
  if (!pr && stmtId != null) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
                    background: "rgba(74,222,128,0.06)", borderRadius: 6,
                    border: "1px solid rgba(74,222,128,0.2)" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Pago vinculado · Extracto #{stmtId}</span>
      </div>
    );
  }
  const b  = pr!.bank;
  const pa = pr!.payment_attempt;
  const fu = pa?.firebase_url?.trim() ?? "";
  const isManual = pr!.resolved_by === "manual_ui" ||
    (pr!.match_level != null && Number(pr!.match_level) >= 3);

  return (
    <div style={{
      background: "rgba(74,222,128,0.05)", borderRadius: 8,
      border: "1px solid rgba(74,222,128,0.2)", overflow: "hidden",
    }}>
      {/* Status strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 12px",
        borderBottom: "1px solid rgba(74,222,128,0.15)",
        background: "rgba(74,222,128,0.07)",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80" }}>
          Pago vinculado · {isManual ? "Manual" : "Automático"}
        </span>
        {pr!.created_at && (
          <span style={{ ...MUTED, marginLeft: "auto", fontSize: 9 }}>{fmtDate(pr!.created_at)}</span>
        )}
      </div>
      {/* Detail */}
      <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {b?.tx_date && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ ...MUTED, fontSize: 10 }}>Fecha mov.</span>
            <span style={{ color: "var(--mu-ink)", ...MONO, fontSize: 11 }}>{fmtDate(String(b.tx_date))}</span>
          </div>
        )}
        {b?.amount != null && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ ...MUTED, fontSize: 10 }}>Monto</span>
            <span style={{ color: "var(--mu-ink)", fontWeight: 700, ...MONO }}>Bs. {fmtN(b.amount)}</span>
          </div>
        )}
        {b?.reference_number && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ ...MUTED, fontSize: 10 }}>Referencia</span>
            <span style={{ color: "var(--mu-ink)", ...MONO }}>{String(b.reference_number)}</span>
          </div>
        )}
        {b?.payment_type && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ ...MUTED, fontSize: 10 }}>Tipo</span>
            <span style={{ color: "var(--mu-ink)" }}>{String(b.payment_type)}</span>
          </div>
        )}
        {b?.description && (
          <div style={{ fontSize: 10, color: "var(--mu-ink-mute)", fontStyle: "italic",
                        marginTop: 2, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 4 }}>
            {String(b.description).slice(0, 160)}
          </div>
        )}
        {/* Comprobante WA */}
        {pa?.extracted_amount_bs != null && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
            <span style={{ ...MUTED, fontSize: 10 }}>Monto comp. (IA)</span>
            <span style={{ color: "var(--mu-ink)", ...MONO }}>Bs. {fmtN(pa.extracted_amount_bs)}</span>
          </div>
        )}
        {pa?.extracted_reference && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ ...MUTED, fontSize: 10 }}>Ref. comp.</span>
            <span style={{ color: "var(--mu-ink)", ...MONO }}>{String(pa.extracted_reference)}</span>
          </div>
        )}
        {fu && (
          <a href={fu} target="_blank" rel="noopener noreferrer" style={{ marginTop: 4, display: "block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fu} alt="Comprobante"
              style={{ maxWidth: 120, maxHeight: 80, objectFit: "cover",
                       borderRadius: 6, border: "1px solid var(--mu-line)" }} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return <div className="mu-skeleton" style={{ width: w, height: h, borderRadius: 4, marginBottom: 7 }} />;
}

function ModalSkeleton() {
  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div>
          <Skel w="50%" h={9} /><Skel w="80%" h={14} /><Skel w="60%" />
          <div style={{ height: 14 }} />
          <Skel w="40%" h={9} />
          {[90,75,85,70].map((w,i)=><Skel key={i} w={`${w}%`} />)}
        </div>
        <div>
          <Skel w="40%" h={9} /><Skel w="100%" h={28} /><Skel w="80%" />
          <div style={{ height: 14 }} />
          <Skel w="40%" h={9} /><Skel /><Skel w="85%" /><Skel w="70%" />
        </div>
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function SaleFromBandejaModal({
  mlOrderId,
  salesOrderId: salesOrderIdProp = null,
  onClose,
}: {
  mlOrderId: string | number;
  salesOrderId?: string | null;
  onClose: () => void;
}) {
  const [resolvedId, setResolvedId] = useState<string | null>(salesOrderIdProp);
  const [sale, setSale]             = useState<SaleDetail | null>(null);
  const [phase, setPhase]           = useState<"resolving" | "loading" | "done" | "error">(
    salesOrderIdProp ? "loading" : "resolving",
  );
  const [error, setError]     = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const rates = useTodayCurrencyRates();

  useEffect(() => { setPortalReady(true); }, []);

  useEffect(() => {
    if (salesOrderIdProp) { setResolvedId(salesOrderIdProp); return; }
    const id = String(mlOrderId).trim();
    if (!id) return;
    let alive = true;
    setPhase("resolving");
    void (async () => {
      try {
        const res = await fetch(
          `/api/ventas/pedidos/resolve-ml-order?ml_order_id=${encodeURIComponent(id)}`,
          { credentials: "include", cache: "no-store" },
        );
        const j = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
        if (!alive) return;
        if (!res.ok || !j.data?.id) {
          setError("No hay venta importada en ERP para esta orden ML."); setPhase("error"); return;
        }
        setResolvedId(String(j.data.id).trim());
      } catch { if (alive) { setError("Error de red al resolver la orden."); setPhase("error"); } }
    })();
    return () => { alive = false; };
  }, [mlOrderId, salesOrderIdProp]);

  useEffect(() => {
    if (!resolvedId) return;
    let alive = true;
    setPhase("loading");
    void (async () => {
      try {
        const res = await fetch(
          `/api/ventas/pedidos/${encodeURIComponent(resolvedId)}`,
          { credentials: "include", cache: "no-store" },
        );
        const j = (await res.json().catch(() => ({}))) as { data?: SaleDetail } & Record<string, unknown>;
        if (!alive) return;
        if (!res.ok) { setError((j.error as string | undefined) ?? "No se pudo cargar el detalle."); setPhase("error"); return; }
        const d = (j.data ?? j) as SaleDetail;
        if (!d?.id) { setError("Respuesta inesperada del servidor."); setPhase("error"); return; }
        setSale(d); setPhase("done");
      } catch { if (alive) { setError("Error de red."); setPhase("error"); } }
    })();
    return () => { alive = false; };
  }, [resolvedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isLoading    = phase === "resolving" || phase === "loading";
  const mlOidStr     = String(mlOrderId).trim();
  const mlUrl        = mlOidStr ? `https://www.mercadolibre.com.ve/ventas/${mlOidStr}/detalle` : null;
  const pedidosHref  = resolvedId
    ? `/ventas/pedidos?open_ml_pack=${encodeURIComponent(resolvedId)}`
    : `/ventas/pedidos?highlight_ml_order_id=${encodeURIComponent(mlOidStr)}`;

  const ch    = sale ? getChannel(sale.source) : null;
  const cycle = sale ? getCycle(sale.status)   : null;
  const isMl  = ch?.key === "ml";

  const displayItems = sale ? buildDisplayItems(sale.items_preview, sale.items) : [];
  const itemsTotal   = sale?.items.reduce((s, it) => {
    const n = Number(it.line_total_usd); return s + (isFinite(n) ? n : 0);
  }, 0) ?? 0;
  const bcv = rates.bcvRate  ?? 0;
  const bin = rates.binanceRate ?? 0;

  const customerLabel =
    sale?.customer_name?.trim()
    || (sale?.customer_id ? `Cliente #${sale.customer_id}` : "Consumidor final");

  const modal = (
    <div
      role="dialog" aria-modal="true" aria-label="Detalle del pedido"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px 8px",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--mu-panel, #161b22)",
        border: "1px solid var(--mu-line, rgba(255,255,255,0.1))",
        borderRadius: 12,
        width: "min(820px, 100%)",
        maxHeight: "calc(100dvh - 24px)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 18px 13px",
          borderBottom: "1px solid var(--mu-line)",
          display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0,
        }}>
          {/* Icono canal */}
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: ch ? `${ch.color}18` : "rgba(255,255,255,0.06)",
            border: `1px solid ${ch ? `${ch.color}30` : "rgba(255,255,255,0.1)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className={isMl ? "ti ti-brand-mercadopago" : "ti ti-shopping-bag"}
               style={{ fontSize: 16, color: ch?.color ?? "var(--mu-ink-mute)" }} />
          </div>

          {/* Título */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--mu-ink)" }}>
                {isLoading ? "Cargando…" : sale ? `Pedido #${sale.id}` : "Pedido"}
              </span>
              {sale?.external_order_id && (
                <span style={{ fontSize: 10, ...MONO, color: "var(--mu-ink-mute)",
                               background: "rgba(255,255,255,0.05)", padding: "1px 6px",
                               borderRadius: 4, border: "1px solid rgba(255,255,255,0.07)" }}>
                  {ch?.extPrefix} {sale.external_order_id}
                </span>
              )}
              {cycle && <CycleBadge cycle={cycle} />}
            </div>
            <div style={{ marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {ch && <span style={{ fontSize: 10, color: ch.color, fontWeight: 600 }}>{ch.label}</span>}
              {sale && <span style={{ ...MUTED }}>·</span>}
              {sale && <span style={{ ...MUTED }}>{fmtDate(sale.created_at)}</span>}
              {sale?.ml_account_nickname && (
                <><span style={{ ...MUTED }}>·</span>
                <span style={{ ...MUTED }}>{sale.ml_account_nickname}</span></>
              )}
              {sale && cycle && (
                <span style={{ ...MUTED }}>
                  · <i className="ti ti-clock" style={{ fontSize: 9 }} /> {fmtElapsed(sale.created_at)}
                  {" "}→ {cycle.next}
                </span>
              )}
              {sale?.chat_id && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#4ade80" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
                  Chat vinculado
                </span>
              )}
            </div>
          </div>

          {/* Acciones header */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {mlUrl && (
              <a href={mlUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: 10, color: "var(--mu-ink-mute)", textDecoration: "none",
                  padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)", whiteSpace: "nowrap",
                }}>
                <i className="ti ti-external-link" style={{ fontSize: 9, marginRight: 3 }} />ML
              </a>
            )}
            <Link href={pedidosHref} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 10, color: "var(--mu-ink-mute)", textDecoration: "none",
                padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", whiteSpace: "nowrap",
              }}>
              <i className="ti ti-list-check" style={{ fontSize: 9, marginRight: 3 }} />Pedidos
            </Link>
            <button type="button" onClick={onClose} aria-label="Cerrar"
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                color: "var(--mu-ink-mute)", fontSize: 16, lineHeight: 1,
                padding: "4px 6px", borderRadius: 5,
              }}>
              <i className="ti ti-x" />
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {isLoading && <ModalSkeleton />}

          {phase === "error" && (
            <div style={{ padding: 28, display: "flex", gap: 10, alignItems: "center" }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 20, color: "#f87171" }} />
              <span style={{ color: "#f87171", fontSize: 12 }}>{error ?? "Error desconocido."}</span>
            </div>
          )}

          {phase === "done" && sale && (
            <div style={{ padding: "18px 20px" }}>
              {/* 2-column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(220px,1fr)", gap: 20 }}>

                {/* ── Columna izquierda ─────────────────────── */}
                <div>

                  {/* Orden */}
                  <Card>
                    <SectionLabel icon="ti ti-receipt" label="Orden" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 0" }}>
                      <MetaRow label="ID interno" value={<span style={MONO}>#{sale.id}</span>} />
                      <MetaRow label="Canal" value={<span style={{ color: ch?.color }}>{ch?.label}</span>} />
                      {sale.external_order_id && (
                        <MetaRow label={`ID ${ch?.extPrefix}`} value={<span style={MONO}>{sale.external_order_id}</span>} />
                      )}
                      <MetaRow label="Fecha" value={fmtDate(sale.created_at)} />
                      {sale.ml_account_nickname && <MetaRow label="Cuenta" value={sale.ml_account_nickname} />}
                      {sale.sold_by?.trim() && <MetaRow label="Vendedor" value={sale.sold_by.trim()} />}
                      {sale.ml_status && (
                        <MetaRow label="ML status" value={<span style={{ ...MONO, textTransform: "lowercase" }}>{sale.ml_status}</span>} />
                      )}
                    </div>
                  </Card>

                  {/* Productos */}
                  <Card>
                    <SectionLabel icon="ti ti-package" label="Productos" />
                    <ProductsBlock items={displayItems} total={itemsTotal} />
                  </Card>

                  {/* Cliente */}
                  <Card>
                    <SectionLabel icon="ti ti-user" label="Cliente" />
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                        background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "#a78bfa",
                      }}>
                        {customerLabel.substring(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mu-ink)", lineHeight: 1.3 }}>
                          {customerLabel}
                        </div>
                        <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                          {sale.customer_id && (
                            <span style={{ ...MUTED }}>CRM #{sale.customer_id}</span>
                          )}
                          {sale.customer_phones_line?.trim() && (
                            <span style={{ ...MUTED }}>
                              <i className="ti ti-phone" style={{ fontSize: 9, marginRight: 3 }} />
                              {sale.customer_phones_line}
                            </span>
                          )}
                          {sale.customer_primary_ml_buyer_id && (
                            <span style={{ ...MUTED, ...MONO }}>ML #{sale.customer_primary_ml_buyer_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Notas/anulación si existen */}
                  {(sale.notes?.trim() || sale.motivo_anulacion?.trim()) && (
                    <Card accent="rgba(251,191,36,0.25)">
                      {sale.motivo_anulacion?.trim() && (
                        <div style={{ fontSize: 11, color: "#f87171", marginBottom: 4 }}>
                          <i className="ti ti-ban" style={{ marginRight: 4 }} />
                          <strong>Anulación:</strong> {sale.motivo_anulacion.trim()}
                        </div>
                      )}
                      {sale.notes?.trim() && (
                        <div style={{ fontSize: 11, color: "var(--mu-ink-mute)" }}>
                          <i className="ti ti-notes" style={{ marginRight: 4 }} />
                          {sale.notes.trim()}
                        </div>
                      )}
                    </Card>
                  )}
                </div>

                {/* ── Columna derecha ───────────────────────── */}
                <div>

                  {/* Totales */}
                  <Card>
                    <SectionLabel icon="ti ti-coins" label="Total" />
                    <AmountsBlock sale={sale} bcv={bcv} bin={bin} />
                  </Card>

                  {/* Pago */}
                  <Card>
                    <SectionLabel icon="ti ti-credit-card" label="Pago" />
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ ...MUTED }}>Forma  </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mu-ink)" }}>
                        {paymentMethodLabel(sale.payment_method)}
                      </span>
                    </div>
                    <ReconCard pr={sale.payment_reconciliation} stmtId={sale.reconciled_statement_id} />
                  </Card>

                  {/* Logística */}
                  <Card>
                    <SectionLabel icon="ti ti-truck" label="Logística" />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mu-ink)" }}>
                        {fulfillmentLabel(sale.fulfillment_type)}
                      </span>
                      {normStatus(sale.status) === "paid" && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                          background: "rgba(74,222,128,0.1)", color: "#4ade80",
                          border: "1px solid rgba(74,222,128,0.25)", padding: "2px 7px", borderRadius: 4,
                        }}>
                          Apto despacho
                        </span>
                      )}
                    </div>
                    {sale.sold_by?.trim() && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="ti ti-user-circle" style={{ fontSize: 12, color: "var(--mu-ink-mute)" }} />
                        <span style={{ ...MUTED }}>{sale.sold_by.trim()}</span>
                      </div>
                    )}
                    {isMl && sale.ml_api_order_id && (
                      <div style={{ marginTop: 5 }}>
                        <span style={{ ...MUTED }}>Pack ML  </span>
                        <span style={{ fontSize: 11, ...MONO, color: "var(--mu-ink-mute)" }}>#{sale.ml_api_order_id}</span>
                      </div>
                    )}
                  </Card>

                  {/* Estado */}
                  <Card>
                    <SectionLabel icon="ti ti-flag" label="Estado" />
                    {cycle && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <CycleBadge cycle={cycle} />
                        <span style={{ fontSize: 11, color: "var(--mu-ink-mute)" }}>→ {cycle.next}</span>
                      </div>
                    )}
                    <Divider />
                    <MetaRow label="Antigüedad" value={<span style={MONO}>{fmtElapsed(sale.created_at)}</span>} />
                    {sale.lifecycle_status?.trim() && (
                      <MetaRow label="Ciclo vida" value={sale.lifecycle_status} />
                    )}
                    {isMl && sale.ml_feedback_sale && (
                      <MetaRow label="Calif. → comprador" value={<span style={MONO}>{sale.ml_feedback_sale}</span>} />
                    )}
                    {isMl && sale.ml_feedback_purchase && (
                      <MetaRow label="Calif. → vendedor" value={<span style={MONO}>{sale.ml_feedback_purchase}</span>} />
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={{
          padding: "10px 18px",
          borderTop: "1px solid var(--mu-line)",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 8, flexShrink: 0,
        }}>
          {mlUrl && (
            <a href={mlUrl} target="_blank" rel="noopener noreferrer"
              style={{
                fontSize: 11, color: "var(--mu-ink-mute)", textDecoration: "none",
                padding: "5px 12px", borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <i className="ti ti-external-link" style={{ fontSize: 11 }} />
              Ver en ML
            </a>
          )}
          <Link href={pedidosHref} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11, color: "var(--mu-ink-mute)", textDecoration: "none",
              padding: "5px 12px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
            <i className="ti ti-list-check" style={{ fontSize: 11 }} />
            Abrir en Pedidos
          </Link>
          <button type="button" onClick={onClose}
            style={{
              fontSize: 12, color: "var(--mu-ink)", cursor: "pointer",
              padding: "5px 16px", borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
            }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  if (!portalReady || typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
