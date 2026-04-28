"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import QuotePanel from "@/app/(features)/bandeja/[chatId]/components/QuotePanel";
import { OP_FRANJA_SECTION } from "@/app/(features)/bandeja/components/operativeFranjaShared";

export interface SaleQuoteModalContext {
  /** `sales_orders.id` — ancla cross-chat; usado en `from-sales-order` y lookup secundario. */
  saleId: number | string;
  /** `sales_orders.conversation_id` → `crm_chats.id`. Puede ser vacío si aún no hay chat. */
  chatId: string;
  customerId: number | null;
  isMl: boolean;
  saleLabel: string;
  /** Presupuesto activo del listado (`quote_preview.id`), para resolver `chat_id` en canales no-ML. */
  quotationId?: number | null;
}

interface SaleQuoteModalProps {
  ctx: SaleQuoteModalContext | null;
  onClose: () => void;
}

/**
 * Cotización vinculada a la venta:
 * - Si hay chatId → igual que Bandeja (`from-ml-order` vía chatId).
 * - Si no hay chatId (orden ML sin CRM aún) → `from-sales-order` (cliente es el vínculo).
 * - Canales no-ML sin `chat_id` en la venta: si hay cotización, GET `by-sales-order` para obtener `chat_id` del presupuesto.
 * La cotización siempre parte de los ítems de la orden ML; si el operario cambia precios,
 * el total del presupuesto puede diferir del total ML (sin tocar Mercado Libre).
 */
export default function SaleQuoteModal({ ctx, onClose }: SaleQuoteModalProps) {
  const [bootstrapId, setBootstrapId] = useState<number | null>(null);
  /** Evita un segundo GET `…/quotations/:chatId` si ya resolvimos cotizaciones vía `by-sales-order`. */
  const [prefetchedInboxQuotationItems, setPrefetchedInboxQuotationItems] = useState<
    Array<Record<string, unknown>> | null
  >(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [prepNote, setPrepNote] = useState<string | null>(null);
  /** `chat_id` obtenido de `inventario_presupuesto` cuando la fila de venta no trae `conversation_id`. */
  const [resolvedChatId, setResolvedChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!ctx) {
      setBootstrapId(null);
      setPrefetchedInboxQuotationItems(null);
      setPrepError(null);
      setPrepNote(null);
      setPrepLoading(false);
      setResolvedChatId(null);
      return;
    }
    setResolvedChatId(null);
    const { saleId, chatId, isMl, quotationId } = ctx;
    const hasChatId = chatId !== "" && Number.isFinite(Number(chatId)) && Number(chatId) > 0;

    if (!isMl) {
      if (hasChatId) {
        setPrepError(null);
        setPrepNote(null);
        setPrepLoading(false);
        setBootstrapId(null);
        setPrefetchedInboxQuotationItems(null);
        return;
      }
      const soIdNum = Number(String(saleId).replace(/^so-/i, ""));
      if (!Number.isFinite(soIdNum) || soIdNum <= 0) {
        setPrepError(
          "Sin chat CRM vinculado no es posible generar cotización para este canal."
        );
        setPrepLoading(false);
        setBootstrapId(null);
        return;
      }
      let aliveNl = true;
      setPrepLoading(true);
      setPrepError(null);
      setPrepNote(null);
      setBootstrapId(null);
      setPrefetchedInboxQuotationItems(null);
      void (async () => {
        try {
          const prevRes = await fetch(
            `/api/inbox/quotations/by-sales-order/${encodeURIComponent(String(soIdNum))}`,
            { credentials: "include", cache: "no-store" }
          );
          const prevJ = (await prevRes.json().catch(() => ({}))) as Record<string, unknown>;
          const items = Array.isArray(prevJ.items)
            ? (prevJ.items as Record<string, unknown>[])
            : [];
          const wantQ =
            quotationId != null &&
            Number.isFinite(Number(quotationId)) &&
            Number(quotationId) > 0
              ? Number(quotationId)
              : null;
          const pick =
            wantQ != null
              ? items.find((it) => Number(it.id) === wantQ) ?? items[0]
              : items[0];
          const cid = pick?.chat_id != null ? Number(pick.chat_id) : NaN;
          if (!aliveNl) return;
          if (Number.isFinite(cid) && cid > 0) {
            setResolvedChatId(String(cid));
            setPrepError(null);
          } else {
            setPrepError(
              "Sin chat CRM vinculado no es posible generar cotización para este canal."
            );
          }
        } catch {
          if (aliveNl)
            setPrepError("Error de red al resolver el chat de la cotización.");
        } finally {
          if (aliveNl) setPrepLoading(false);
        }
      })();
      return () => {
        aliveNl = false;
      };
    }

    // ML: cotización por defecto = ítems/precios de la orden.
    let alive = true;
    setPrepLoading(true);
    setPrepError(null);
    setPrepNote(null);
    setBootstrapId(null);
    setPrefetchedInboxQuotationItems(null);

    void (async () => {
      try {
        // Paso 0: lookup previo cross-chat por sales_order_id (evita crear duplicado sea cual sea el chat).
        // El id puede venir con prefijo "so-" (ej. "so-1253") desde v_sales_unified.
        const soIdNum = Number(String(saleId).replace(/^so-/i, ""));
        if (Number.isFinite(soIdNum) && soIdNum > 0) {
          const prevRes = await fetch(
            `/api/inbox/quotations/by-sales-order/${encodeURIComponent(String(soIdNum))}`,
            { credentials: "include", cache: "no-store" }
          );
          if (prevRes.ok) {
            const prevJ = (await prevRes.json().catch(() => ({}))) as Record<string, unknown>;
            const prevItems = Array.isArray(prevJ.items) ? (prevJ.items as Record<string, unknown>[]) : [];
            const existing = prevItems[0];
            const existingId = existing?.id != null ? Number(existing.id) : NaN;
            if (Number.isFinite(existingId) && existingId > 0) {
              if (!alive) return;
              setPrefetchedInboxQuotationItems(prevItems);
              setBootstrapId(existingId);
              return;
            }
          }
        }

        if (hasChatId) {
          // Camino A: hay chat → from-ml-order (incluye dedup y resuelve sales_order_id).
          const res = await fetch(
            `/api/inbox/${encodeURIComponent(chatId)}/quotations/from-ml-order`,
            { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}), cache: "no-store" }
          );
          const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (!alive) return;
          if (!res.ok) {
            setPrepError(String(j.message ?? j.error ?? "No se pudo generar el borrador desde la orden ML."));
            return;
          }
          if (j.reused) setPrepNote("Borrador existente de esta orden cargado.");
          applyBootstrap(j, alive);
        } else {
          // Camino B: sin chat → from-sales-order (cliente + sales_order_id como vínculo).
          const res = await fetch("/api/inbox/quotations/from-sales-order", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sales_order_id: soIdNum }),
            cache: "no-store",
          });
          const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          if (!alive) return;
          if (!res.ok) {
            setPrepError(String(j.message ?? j.error ?? "No se pudo generar el borrador."));
            return;
          }
          if (j.reused) setPrepNote("Cotización existente de esta orden cargada.");
          applyBootstrap(j, alive);
        }
      } catch {
        if (alive) setPrepError("Error de red al preparar la cotización.");
      } finally {
        if (alive) setPrepLoading(false);
      }
    })();

    function applyBootstrap(j: Record<string, unknown>, alive: boolean) {
      const pres = j.presupuesto as Record<string, unknown> | undefined;
      const rawId = pres?.id ?? j.id;
      const newId = typeof rawId === "number" ? rawId : Number(rawId);
      if (!Number.isFinite(newId) || newId <= 0) {
        if (alive) setPrepError("Respuesta inválida del servidor al crear la cotización.");
        return;
      }
      const warnings = Array.isArray(j.warnings) ? j.warnings : [];
      const skipped = Array.isArray(j.skipped) ? j.skipped : [];
      const parts: string[] = [];
      if (warnings.length) parts.push("Avisos de precio (orden vs catálogo). Revisá las líneas antes de enviar.");
      if (skipped.length) parts.push(`Se omitieron ${skipped.length} ítem(es) sin mapeo a producto.`);
      if (parts.length && alive) setPrepNote(parts.join(" "));
      if (alive) setBootstrapId(newId);
    }

    return () => { alive = false; };
  }, [ctx]);

  const onBootstrapConsumed = useCallback(() => {
    setBootstrapId(null);
  }, []);

  if (!ctx) return null;

  /** Presupuesto a hidratar en QuotePanel: resultado async del padre o id ya conocido del listado (editar). */
  const quotationIdNum =
    ctx.quotationId != null &&
    Number.isFinite(Number(ctx.quotationId)) &&
    Number(ctx.quotationId) > 0
      ? Number(ctx.quotationId)
      : null;
  const effectiveBootstrapId =
    bootstrapId != null && Number.isFinite(Number(bootstrapId)) && Number(bootstrapId) > 0
      ? Number(bootstrapId)
      : quotationIdNum;

  const hasChatId = ctx.chatId !== "" && Number.isFinite(Number(ctx.chatId)) && Number(ctx.chatId) > 0;
  const hasResolvedChat =
    resolvedChatId != null &&
    resolvedChatId !== "" &&
    Number.isFinite(Number(resolvedChatId)) &&
    Number(resolvedChatId) > 0;
  // QuotePanel requiere chatId; si no hay uno real, pasamos "" y depende
  // únicamente de bootstrapDraftQuotationId para cargar las líneas (solo ML).
  const effectiveChatId = hasChatId
    ? ctx.chatId
    : hasResolvedChat
      ? String(resolvedChatId)
      : "";

  const canShowPanel = ctx.isMl
    ? !prepLoading && (bootstrapId != null || !prepError)
    : (hasChatId || hasResolvedChat) && !prepLoading && !prepError;

  const shellStyle: CSSProperties = {
    position: "relative",
    width: "min(980px, 96vw)",
    margin: "2vh auto",
    maxHeight: "96vh",
    overflowY: "auto",
    boxSizing: "border-box",
  };

  const mutedLine: CSSProperties = {
    fontSize: 11,
    color: "rgba(226,232,240,0.72)",
    padding: "8px 14px 0",
    borderBottom: prepNote && !prepError ? "1px solid var(--mu-border, rgba(255,255,255,0.08))" : undefined,
  };

  return (
    <div
      className="d-block"
      tabIndex={-1}
      role="presentation"
      style={{ background: "rgba(0, 0, 0, 0.55)", zIndex: 1060, position: "fixed", inset: 0, overflowY: "auto" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-quote-a11y-title"
        style={shellStyle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span id="sale-quote-a11y-title" className="visually-hidden">
          {ctx.saleLabel} — cotización
        </span>
        <button
          type="button"
          className="d-flex align-items-center justify-content-center border-0 rounded-circle"
          aria-label="Cerrar"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 4,
            width: 36,
            height: 36,
            background: "rgba(0,0,0,0.4)",
            color: "#f1f5f9",
          }}
        >
          <i className="ti ti-x" style={{ fontSize: 20 }} aria-hidden />
        </button>

        {prepLoading && (
          <div
            className="d-flex align-items-center gap-2 small"
            role="status"
            style={{
              ...OP_FRANJA_SECTION,
              padding: "18px 44px 18px 14px",
              color: "rgba(226,232,240,0.78)",
              boxShadow: "0 24px 56px rgba(0,0,0,0.45)",
            }}
          >
            <span className="spinner-border spinner-border-sm text-light" aria-hidden="true" />
            Preparando cotización desde la orden…
          </div>
        )}

        {prepError && (
          <div
            role="alert"
            style={{
              ...OP_FRANJA_SECTION,
              marginTop: 8,
              padding: "12px 44px 12px 14px",
              fontSize: 12,
              background: "rgba(251,191,36,0.08)",
              borderColor: "rgba(251,191,36,0.35)",
              color: "#fde68a",
              boxShadow: "0 24px 56px rgba(0,0,0,0.45)",
            }}
          >
            {prepError}
          </div>
        )}

        {prepNote && !prepError && (
          <div style={mutedLine} role="status">
            {prepNote}
          </div>
        )}

        {canShowPanel && (
          <QuotePanel
            key={`${ctx.saleId}-${effectiveChatId || "nochat"}`}
            chatId={effectiveChatId}
            customerId={ctx.customerId}
            salesOrderId={
              Number.isFinite(Number(String(ctx.saleId).replace(/^so-/i, "")))
                ? Number(String(ctx.saleId).replace(/^so-/i, ""))
                : null
            }
            forceOpen
            bootstrapDraftQuotationId={effectiveBootstrapId}
            onBootstrapDraftConsumed={onBootstrapConsumed}
            prefetchedInboxQuotationItems={prefetchedInboxQuotationItems}
          />
        )}
      </div>
    </div>
  );
}
