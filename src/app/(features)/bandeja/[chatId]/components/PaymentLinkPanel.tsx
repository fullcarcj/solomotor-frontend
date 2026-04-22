"use client";

/**
 * PaymentLinkPanel — Sección "Comprobantes y conciliación" (misma cabecera colapsable que Cotización).
 *
 * Muestra todos los comprobantes de pago recibidos por WhatsApp para el chat/cliente
 * que aún no tienen match con una orden o cotización (reconciliation_status ≠ matched).
 * Permite vincular manualmente un comprobante a la cotización activa.
 * La vinculación comprobante ↔ extracto se confirma en este panel (el modal solo elige el movimiento).
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTodayRate } from "@/hooks/useTodayRate";
import PendingStatementCreditsModal, {
  type PendingStatementItem,
} from "./PendingStatementCreditsModal";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PaymentAttempt {
  id: number;
  chat_id: number | null;
  customer_id: number | null;
  firebase_url: string;
  extracted_reference: string | null;
  extracted_amount_bs: string | null;
  extracted_date: string | null;
  extracted_bank: string | null;
  extracted_payment_type: string | null;
  extraction_confidence: string | null;
  is_receipt: boolean;
  prefiler_reason: string | null;
  reconciliation_status: string;
  /** Movimiento de extracto vinculado manualmente (si existe columna en BD). */
  linked_bank_statement_id?: number | null;
  created_at: string;
}

export interface PaymentLinkPanelProps {
  chatId: string;
  customerId: number | null;
  /** ID de la cotización activa enviada — para ofrecer vincular directamente */
  activeQuotationId?: number | null;
  activeQuotationRef?: string | null;
  /** Total USD de la cotización activa (misma fuente que QuotePanel) — para alertas en Bs. */
  activeQuotationTotalUsd?: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBs(raw: string | null): string {
  if (!raw) return "—";
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return raw;
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Alineado al motor de conciliación: extracto ±0,05 Bs; cotización vs comprobante ±max(1, 0,5 %). */
const TOL_BANK_STATEMENT_BS = 0.05;
function tolQuotationVsAttemptBs(quotationBs: number): number {
  return Math.max(1, Math.abs(quotationBs) * 0.005);
}

function parseAmountBs(raw: string | null | undefined): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function fmtDate(raw: string | null): string {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw).slice(0, 10);
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(raw).slice(0, 10); }
}

function statusLabel(s: string): { text: string; color: string } {
  if (s === "pending")       return { text: "Pendiente",     color: "#fcd34d" };
  if (s === "manual_review") return { text: "Revisión manual", color: "#93c5fd" };
  if (s === "no_match")      return { text: "Sin match",      color: "#fca5a5" };
  return { text: s, color: "#8b949e" };
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const S = {
  section: {
    borderRadius: 10,
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    overflow: "visible",
    marginBottom: 6,
    background: "var(--mu-panel-2, #1c222b)",
  } as CSSProperties,

  header: (open: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    cursor: "pointer",
    userSelect: "none" as const,
    background: open
      ? "linear-gradient(180deg, var(--mu-panel-3, #232a35), var(--mu-panel-2, #1c222b))"
      : "transparent",
    borderBottom: open ? "1px solid var(--mu-border, rgba(255,255,255,0.08))" : "none",
    transition: "background 0.15s",
    borderRadius: open ? "10px 10px 0 0" : 10,
  }),

  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "rgba(147,197,253,0.1)",
    border: "1px solid rgba(147,197,253,0.25)",
    color: "#93c5fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as CSSProperties,

  body: {
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    maxHeight: "min(55vh, 480px)",
    overflowY: "auto" as const,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },

  card: {
    borderRadius: 8,
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    background: "var(--mu-panel-3, #232a35)",
    overflow: "hidden",
  } as CSSProperties,

  cardRow: {
    display: "flex",
    gap: 8,
    padding: "9px 12px",
    borderBottom: "1px solid var(--mu-border-soft, rgba(255,255,255,0.04))",
  } as CSSProperties,

  thumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    objectFit: "cover" as const,
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    flexShrink: 0,
    background: "var(--mu-panel-4, #2a313c)",
    cursor: "pointer",
  } as CSSProperties,

  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 6,
    flexShrink: 0,
    background: "var(--mu-panel-4, #2a313c)",
    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--mu-ink-mute, #6e7681)",
  } as CSSProperties,

  kv: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--mu-ink-mute, #6e7681)",
    fontWeight: 700,
  },

  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 800,
    color: "#c5f24a",
    lineHeight: 1.2,
  },

  valueSm: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--mu-text, #e6edf3)",
    lineHeight: 1.3,
  },

  btn: (variant: "primary" | "ghost" | "danger") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 28,
    padding: "0 10px",
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid",
    transition: "all 0.1s",
    ...(variant === "primary"
      ? { background: "#1e4a7a", color: "#93c5fd", borderColor: "rgba(147,197,253,0.3)" }
      : variant === "danger"
      ? { background: "rgba(239,68,68,0.08)", color: "#fca5a5", borderColor: "rgba(239,68,68,0.25)" }
      : { background: "transparent", color: "var(--mu-ink-mute, #8b949e)", borderColor: "var(--mu-border, rgba(255,255,255,0.08))" }),
  }) as CSSProperties,
};

/** Sin match automático con extracto bancario (`matched` = OK motor de conciliación). */
function attemptNeedsManualStatement(a: PaymentAttempt): boolean {
  const s = String(a.reconciliation_status || "").toLowerCase();
  return s !== "matched";
}

const SvgPayment = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       style={{ width: 14, height: 14 }}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <circle cx="12" cy="15" r="2" />
  </svg>
);

const SvgChevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
       style={{ width: 13, height: 13, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const SvgImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
       style={{ width: 20, height: 20 }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

// ── Modal imagen ──────────────────────────────────────────────────────────────

function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Comprobante de pago"
        style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: "50%", width: 36, height: 36,
          color: "#fff", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >×</button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PaymentLinkPanel({
  chatId,
  customerId,
  activeQuotationId,
  activeQuotationRef,
  activeQuotationTotalUsd,
}: PaymentLinkPanelProps) {
  const { rate } = useTodayRate();
  const vesPerUsd = rate?.active_rate != null ? Number(rate.active_rate) : null;
  const quotationBs =
    activeQuotationId != null &&
    activeQuotationTotalUsd != null &&
    Number.isFinite(activeQuotationTotalUsd) &&
    vesPerUsd != null &&
    Number.isFinite(vesPerUsd) &&
    vesPerUsd > 0
      ? activeQuotationTotalUsd * vesPerUsd
      : null;

  const [isOpen, setIsOpen]       = useState(false);
  const [attempts, setAttempts]   = useState<PaymentAttempt[]>([]);
  const [loading, setLoading]     = useState(false);
  const [imageUrl, setImageUrl]   = useState<string | null>(null);
  const [linking, setLinking]     = useState<number | null>(null);
  const [linked, setLinked]       = useState<Set<number>>(new Set());
  const [pendingStatementsOpen, setPendingStatementsOpen] = useState(false);
  const [draftStatement, setDraftStatement] = useState<PendingStatementItem | null>(null);
  const [draftAttemptId, setDraftAttemptId] = useState<number | null>(null);
  const [stmtLinkSaving, setStmtLinkSaving] = useState(false);
  const [stmtLinkError, setStmtLinkError] = useState<string | null>(null);
  const [stmtLinkOkMsg, setStmtLinkOkMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!chatId && !customerId) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (chatId)     params.set("chat_id",     chatId);
    if (customerId) params.set("customer_id", String(customerId));
    fetch(`/api/inbox/payment-attempts?${params}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        const items = (data as { items?: unknown }).items;
        if (Array.isArray(items)) setAttempts(items as PaymentAttempt[]);
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false));
  }, [chatId, customerId]);

  // Datos al cambiar chat/cliente (título, badge y «Vincular Statement» sin abrir el panel)
  useEffect(() => {
    setAttempts([]);
    setLinked(new Set());
    setDraftStatement(null);
    setDraftAttemptId(null);
    setStmtLinkError(null);
    setStmtLinkOkMsg(null);
    void load();
  }, [chatId, customerId, load]);

  // Refresco al expandir
  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  const unlinkedCount = attempts.filter((a) => !linked.has(a.id)).length;

  const needsManualStatement = useMemo(
    () => attempts.some((a) => attemptNeedsManualStatement(a)),
    [attempts]
  );

  /**
   * Comprobantes aún sin movimiento de extracto vinculado.
   * No usar el Set `linked` (vinculación a cotización): un comprobante puede estar
   * ligado a la cotización y aun así necesitar «Vincular movimiento» al banco.
   */
  const statementLinkTargets = useMemo(
    () =>
      attempts
        .filter((a) => a.linked_bank_statement_id == null || Number(a.linked_bank_statement_id) <= 0)
        .map((a) => ({
          id: a.id,
          extracted_amount_bs: a.extracted_amount_bs,
          created_at: a.created_at,
        })),
    [attempts]
  );

  useEffect(() => {
    if (draftAttemptId == null) return;
    const ok = statementLinkTargets.some((t) => t.id === draftAttemptId);
    if (!ok) {
      const first = statementLinkTargets[0]?.id ?? null;
      setDraftAttemptId(first != null && Number.isFinite(first) ? first : null);
    }
  }, [statementLinkTargets, draftAttemptId]);

  const draftAttempt = useMemo(
    () => (draftAttemptId != null ? attempts.find((a) => a.id === draftAttemptId) ?? null : null),
    [attempts, draftAttemptId]
  );

  const amountAlerts = useMemo(() => {
    if (!draftStatement) return [];
    const stmtBs = parseAmountBs(draftStatement.amount);
    const attBs = draftAttempt ? parseAmountBs(draftAttempt.extracted_amount_bs) : null;
    const lines: string[] = [];
    if (attBs != null && stmtBs != null && Math.abs(attBs - stmtBs) > TOL_BANK_STATEMENT_BS) {
      lines.push(
        `El monto del comprobante (${fmtBs(String(attBs))}) no coincide con el del extracto (${fmtBs(String(stmtBs))}) — diferencia Bs. ${Math.abs(attBs - stmtBs).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      );
    }
    if (quotationBs != null && attBs != null && Math.abs(attBs - quotationBs) > tolQuotationVsAttemptBs(quotationBs)) {
      lines.push(
        `El monto del comprobante (${fmtBs(String(attBs))}) no coincide con el total de la cotización en bolívares (${fmtBs(String(quotationBs))}, tasa del día) — revisá antes de confirmar.`
      );
    }
    if (quotationBs != null && stmtBs != null && Math.abs(stmtBs - quotationBs) > tolQuotationVsAttemptBs(quotationBs)) {
      lines.push(
        `El monto del extracto (${fmtBs(String(stmtBs))}) no coincide con el total de la cotización en bolívares (${fmtBs(String(quotationBs))}).`
      );
    }
    return lines;
  }, [draftStatement, draftAttempt, quotationBs]);

  const clearStatementDraft = () => {
    setDraftStatement(null);
    setDraftAttemptId(null);
    setStmtLinkError(null);
  };

  const confirmStatementLink = async () => {
    if (!draftStatement || draftAttemptId == null || !Number.isFinite(draftAttemptId)) {
      setStmtLinkError("Elegí un comprobante para vincular.");
      return;
    }
    setStmtLinkSaving(true);
    setStmtLinkError(null);
    setStmtLinkOkMsg(null);
    try {
      const res = await fetch(
        `/api/inbox/payment-attempts/${encodeURIComponent(String(draftAttemptId))}/link-bank-statement`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bank_statement_id: Number(draftStatement.id),
            chat_id: Number(chatId),
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const msg =
          typeof data.message === "string"
            ? data.message
            : typeof data.error === "string"
              ? data.error
              : `Error ${res.status}`;
        throw new Error(msg);
      }
      const mismatch = data.mismatch as { warnings?: unknown[] } | undefined;
      const warnCount = Array.isArray(mismatch?.warnings) ? mismatch.warnings.length : 0;
      setStmtLinkOkMsg(
        warnCount > 0
          ? "Vinculación guardada. Quedó registrada alerta para supervisión por diferencia de montos."
          : "Vinculación guardada."
      );
      setDraftStatement(null);
      setDraftAttemptId(null);
      setStmtLinkError(null);
      void load();
    } catch (e) {
      setStmtLinkError(e instanceof Error ? e.message : "No se pudo guardar la vinculación");
    } finally {
      setStmtLinkSaving(false);
    }
  };

  const linkToQuotation = async (attemptId: number) => {
    if (!activeQuotationId || linking) return;
    setLinking(attemptId);
    try {
      const res = await fetch(
        `/api/inbox/payment-attempts/${encodeURIComponent(String(attemptId))}/link-quotation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quotation_id: activeQuotationId }),
        }
      );
      if (res.ok) {
        setLinked((prev) => new Set([...prev, attemptId]));
      }
    } catch {/* ignore */} finally {
      setLinking(null);
    }
  };

  /** Mismo estilo que «Vincular Orden ML» en ChatContextPanel (zona MercadoLibre). */
  const mlLinkButtonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 6,
    background: "#ff7400",
    color: "#fff",
    fontWeight: 700,
    fontSize: 11,
    border: "none",
    cursor: "pointer",
  };

  return (
    <>
      <div style={S.section}>
        {/* Cabecera: mismo patrón que QuotePanel («Cotización») */}
        <div
          style={S.header(isOpen)}
          onClick={() => setIsOpen((v) => !v)}
          role="button"
          aria-expanded={isOpen}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsOpen((v) => !v);
          }}
        >
          <div style={S.icon}>
            <SvgPayment />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mu-text, #e6edf3)" }}>
                Comprobantes y conciliación
              </span>
              {unlinkedCount > 0 && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "rgba(147,197,253,0.12)",
                    color: "#93c5fd",
                    border: "1px solid rgba(147,197,253,0.3)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {unlinkedCount} comprobante{unlinkedCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {!isOpen && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "var(--mu-ink-mute, #6e7681)",
                  letterSpacing: "0.06em",
                  marginTop: 1,
                }}
              >
                {unlinkedCount === 0 && !loading
                  ? "Sin pendientes · click para abrir"
                  : loading
                    ? "Cargando…"
                    : `${unlinkedCount} pendiente${unlinkedCount !== 1 ? "s" : ""} · click para abrir`}
              </div>
            )}
            {isOpen && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: "var(--mu-ink-mute, #6e7681)",
                  letterSpacing: "0.06em",
                  marginTop: 1,
                }}
              >
                {loading ? "Cargando…" : `${unlinkedCount} sin conciliar / vincular`}
              </div>
            )}
          </div>
          <div style={{ color: "var(--mu-ink-mute, #6e7681)" }}>
            <SvgChevron open={isOpen} />
          </div>
        </div>

        {/* Caja naranja tipo «Vincular Orden ML» — solo cuando el acordeón está expandido */}
        {isOpen && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(255,116,0,0.06)",
              border: "1px solid rgba(255,116,0,0.2)",
              marginBottom: 4,
            }}
          >
            <button
              type="button"
              style={mlLinkButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                setStmtLinkError(null);
                setPendingStatementsOpen(true);
              }}
              title="Ver créditos del extracto pendientes de conciliar (sin match automático)"
            >
              <i className="ti ti-link" style={{ fontSize: 13 }} />
              Vincular Movimiento
            </button>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "var(--mu-ink-mute, #6e7681)",
                letterSpacing: "0.06em",
                marginTop: 6,
              }}
            >
              {needsManualStatement
                ? "Sin conciliación automática · revisá el listado y vinculá al extracto"
                : "Extracto bancario · usá el listado cuando haya comprobantes"}
            </div>
          </div>
        )}

        {isOpen && stmtLinkOkMsg && (
          <div style={{ padding: "0 12px 8px" }}>
            <div
              className="alert alert-success py-2 small mb-0"
              role="status"
              style={{ margin: 0, fontSize: 12 }}
            >
              {stmtLinkOkMsg}
            </div>
          </div>
        )}

        {isOpen && stmtLinkError && !draftStatement && (
          <div style={{ padding: "0 12px 8px" }}>
            <div className="alert alert-warning py-2 small mb-0" role="alert" style={{ margin: 0, fontSize: 12 }}>
              {stmtLinkError}
            </div>
          </div>
        )}

        {isOpen && draftStatement && (
          <div style={{ padding: "0 12px 10px" }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(255,116,0,0.14) 0%, rgba(255,116,0,0.06) 100%)",
                border: "1px solid rgba(255,116,0,0.38)",
                boxShadow: "0 0 0 1px rgba(255,140,60,0.12) inset",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "#ffb366",
                  marginBottom: 8,
                }}
              >
                CONFIRMAR VINCULACIÓN CON EXTRACTO
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "#c5f24a" }}>
                Mov. #{draftStatement.id} · {fmtBs(draftStatement.amount)}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", marginTop: 6, lineHeight: 1.35 }}>
                {draftStatement.tx_date ?? "—"}
                {draftStatement.reference_number ? ` · Ref. ${draftStatement.reference_number}` : ""}
                {draftStatement.description ? ` · ${draftStatement.description}` : ""}
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ ...S.label, marginBottom: 6 }}>Comprobante (este chat)</div>
                <select
                  className="form-select form-select-sm"
                  style={{
                    maxWidth: "100%",
                    background: "var(--mu-panel-3, #232a35)",
                    border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
                    color: "var(--mu-text, #e6edf3)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  value={draftAttemptId ?? ""}
                  onChange={(e) => setDraftAttemptId(Number(e.target.value))}
                  disabled={stmtLinkSaving}
                >
                  {statementLinkTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} · {fmtBs(t.extracted_amount_bs)}
                      {t.created_at ? ` · ${fmtDate(t.created_at)}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {activeQuotationId == null && (
                <div style={{ fontSize: 11, color: "var(--mu-ink-mute, #8b949e)", marginTop: 8 }}>
                  Sin cotización activa en panel: no se compara el total en Bs.
                </div>
              )}
              {activeQuotationId != null && quotationBs == null && (
                <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 8 }}>
                  No hay tasa del día cargada: no se puede comparar la cotización en bolívares.
                </div>
              )}

              {amountAlerts.length > 0 && (
                <div style={{ marginTop: 10 }} role="alert">
                  {amountAlerts.map((txt, i) => (
                    <div
                      key={i}
                      className="alert alert-warning py-2 small mb-2"
                      style={{ margin: 0, fontSize: 12, lineHeight: 1.35 }}
                    >
                      {txt}
                    </div>
                  ))}
                </div>
              )}

              {stmtLinkError && (
                <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">
                  {stmtLinkError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid var(--mu-border, rgba(255,255,255,0.14))",
                    background: "transparent",
                    color: "var(--mu-text, #e6edf3)",
                    cursor: stmtLinkSaving ? "not-allowed" : "pointer",
                  }}
                  disabled={stmtLinkSaving}
                  onClick={() => {
                    clearStatementDraft();
                    setStmtLinkError(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    border: "none",
                    background: "#ff7400",
                    color: "#fff",
                    cursor:
                      stmtLinkSaving || draftAttemptId == null || statementLinkTargets.length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity: stmtLinkSaving || draftAttemptId == null ? 0.55 : 1,
                  }}
                  disabled={stmtLinkSaving || draftAttemptId == null || statementLinkTargets.length === 0}
                  onClick={() => void confirmStatementLink()}
                >
                  {stmtLinkSaving ? "Guardando…" : "Confirmar vinculación"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isOpen && (
          <div style={S.body}>

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[1, 2].map((i) => (
                  <div key={i} className="mu-skeleton" style={{ height: 70, borderRadius: 8 }} />
                ))}
              </div>
            )}

            {!loading && attempts.length === 0 && (
              <div style={{
                padding: "20px 12px",
                textAlign: "center",
                background: "var(--mu-panel-3, #232a35)",
                border: "1px dashed var(--mu-border, rgba(255,255,255,0.08))",
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 22, marginBottom: 6, color: "var(--mu-ink-mute, #6e7681)" }}>🧾</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mu-text, #e6edf3)", marginBottom: 3 }}>
                  Sin comprobantes pendientes
                </div>
                <div style={{ fontSize: 10, color: "var(--mu-ink-mute, #8b949e)" }}>
                  Cuando el cliente envíe una imagen de pago<br/>aparecerá aquí automáticamente.
                </div>
              </div>
            )}

            {!loading && attempts.map((a) => {
              const isLinked = linked.has(a.id);
              const st = statusLabel(isLinked ? "matched" : a.reconciliation_status);
              const conf = a.extraction_confidence ? Math.round(parseFloat(a.extraction_confidence) * 100) : null;
              return (
                <div key={a.id} style={{ ...S.card, opacity: isLinked ? 0.55 : 1 }}>
                  {/* Fila principal */}
                  <div style={S.cardRow}>
                    {/* Thumbnail comprobante */}
                    {a.firebase_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.firebase_url}
                        alt="Comprobante"
                        style={S.thumb}
                        onClick={() => setImageUrl(a.firebase_url)}
                        title="Ver imagen"
                      />
                    ) : (
                      <div style={S.thumbPlaceholder}><SvgImage /></div>
                    )}

                    {/* Datos extraídos */}
                    <div style={S.kv}>
                      <div style={S.label}>Monto</div>
                      <div style={S.value}>{fmtBs(a.extracted_amount_bs)}</div>
                      <div style={{ ...S.valueSm, marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                        {a.extracted_date && <span>📅 {fmtDate(a.extracted_date)}</span>}
                        {a.extracted_bank && <span>🏦 {a.extracted_bank}</span>}
                      </div>
                      {a.extracted_reference && (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)", marginTop: 2 }}>
                          Ref: {a.extracted_reference}
                        </div>
                      )}
                      {a.linked_bank_statement_id != null && Number(a.linked_bank_statement_id) > 0 && (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#93c5fd", marginTop: 4 }}>
                          Extracto vinculado · mov. #{a.linked_bank_statement_id}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer de la tarjeta */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 12px",
                    gap: 8,
                  }}>
                    {/* Status + confianza */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, fontWeight: 700,
                        padding: "1px 5px", borderRadius: 4,
                        background: isLinked ? "rgba(52,211,153,0.12)" : "rgba(250,250,250,0.06)",
                        color: isLinked ? "#86efac" : st.color,
                        border: `1px solid ${isLinked ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                      }}>
                        {isLinked ? "✓ Vinculado" : st.text}
                      </span>
                      {conf != null && !isLinked && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)" }}>
                          {conf}% conf.
                        </span>
                      )}
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)" }}>
                        {fmtDate(a.created_at)}
                      </span>
                    </div>

                    {/* Acciones */}
                    {!isLinked && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {a.firebase_url && (
                          <button
                            type="button"
                            style={S.btn("ghost")}
                            onClick={() => setImageUrl(a.firebase_url)}
                            title="Ver imagen"
                          >
                            Ver imagen
                          </button>
                        )}
                        {activeQuotationId && (
                          <button
                            type="button"
                            style={S.btn("primary")}
                            disabled={linking === a.id}
                            onClick={() => void linkToQuotation(a.id)}
                            title={`Vincular a ${activeQuotationRef ?? `#${activeQuotationId}`}`}
                          >
                            {linking === a.id ? "…" : `Vincular a ${activeQuotationRef ?? `#${activeQuotationId}`}`}
                          </button>
                        )}
                        {!activeQuotationId && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--mu-ink-mute, #6e7681)" }}>
                            Sin cotización activa
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal imagen ampliada */}
      {imageUrl && (
        <ImageModal url={imageUrl} onClose={() => setImageUrl(null)} />
      )}

      <PendingStatementCreditsModal
        open={pendingStatementsOpen}
        onClose={() => setPendingStatementsOpen(false)}
        onPickStatement={(item) => {
          setIsOpen(true);
          setStmtLinkError(null);
          setStmtLinkOkMsg(null);
          setDraftStatement(item);
          const first = statementLinkTargets[0]?.id ?? null;
          setDraftAttemptId(first != null && Number.isFinite(first) ? first : null);
        }}
      />
    </>
  );
}
