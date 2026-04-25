"use client";

import { useCallback, useEffect, useState } from "react";
import QuotePanel from "@/app/(features)/bandeja/[chatId]/components/QuotePanel";

export interface SaleQuoteModalContext {
  /** `sales_orders.id` — ancla cross-chat; usado en `from-sales-order` y lookup secundario. */
  saleId: number | string;
  /** `sales_orders.conversation_id` → `crm_chats.id`. Puede ser vacío si aún no hay chat. */
  chatId: string;
  customerId: number | null;
  isMl: boolean;
  saleLabel: string;
}

interface SaleQuoteModalProps {
  ctx: SaleQuoteModalContext | null;
  onClose: () => void;
}

/**
 * Cotización vinculada a la venta:
 * - Si hay chatId → igual que Bandeja (`from-ml-order` vía chatId).
 * - Si no hay chatId (orden ML sin CRM aún) → `from-sales-order` (cliente es el vínculo).
 * La cotización siempre parte de los ítems de la orden ML; si el operario cambia precios,
 * el total del presupuesto puede diferir del total ML (sin tocar Mercado Libre).
 */
export default function SaleQuoteModal({ ctx, onClose }: SaleQuoteModalProps) {
  const [bootstrapId, setBootstrapId] = useState<number | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [prepNote, setPrepNote] = useState<string | null>(null);

  useEffect(() => {
    if (!ctx) {
      setBootstrapId(null);
      setPrepError(null);
      setPrepNote(null);
      setPrepLoading(false);
      return;
    }
    const { saleId, chatId, customerId, isMl } = ctx;
    const hasChatId = chatId !== "" && Number.isFinite(Number(chatId)) && Number(chatId) > 0;

    if (!isMl) {
      // Canales no-ML: requieren chat para cotizar vía CRM.
      if (!hasChatId) {
        setPrepError("Sin chat CRM vinculado no es posible generar cotización para este canal.");
        setPrepLoading(false);
        setBootstrapId(null);
        return;
      }
      setPrepError(null);
      setPrepNote(null);
      setPrepLoading(false);
      setBootstrapId(null);
      return;
    }

    // ML: cotización por defecto = ítems/precios de la orden.
    let alive = true;
    setPrepLoading(true);
    setPrepError(null);
    setPrepNote(null);
    setBootstrapId(null);

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
              setBootstrapId(existingId);
              setPrepNote("Cotización existente de esta orden cargada (disponible desde cualquier chat).");
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

  const hasChatId = ctx.chatId !== "" && Number.isFinite(Number(ctx.chatId)) && Number(ctx.chatId) > 0;
  // QuotePanel requiere chatId; si no hay uno real, pasamos "" y depende
  // únicamente de bootstrapDraftQuotationId para cargar las líneas.
  const effectiveChatId = hasChatId ? ctx.chatId : "";

  const canShowPanel = ctx.isMl
    ? !prepLoading && (bootstrapId != null || !prepError)
    : hasChatId;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-quote-modal-title"
      style={{ background: "rgba(0, 0, 0, 0.55)", zIndex: 1060 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable" style={{ maxWidth: 960 }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="sale-quote-modal-title">
              Cotización — {ctx.saleLabel}
            </h5>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
          </div>
          <div className="modal-body py-2">
            <p className="small text-muted mb-2">
              Cotización por defecto basada en la oferta ML (ítems y precios de la orden). Si
              editás precios, el total del presupuesto puede diferir del total de la orden original
              sin modificar Mercado Libre.{" "}
              {!hasChatId && (
                <span>
                  Al vincular esta orden a un chat CRM en Bandeja, el borrador quedará enlazado
                  automáticamente.
                </span>
              )}
            </p>

            {prepLoading && (
              <div className="d-flex align-items-center gap-2 small text-muted mb-2" role="status">
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                Preparando cotización desde la orden…
              </div>
            )}
            {prepError && (
              <div className="alert alert-warning py-2 small mb-2" role="alert">
                {prepError}
              </div>
            )}
            {prepNote && !prepError && (
              <div className="alert alert-info py-2 small mb-2" role="status">
                {prepNote}
              </div>
            )}

            {canShowPanel && (
              <div
                className="border rounded p-2 bg-body-secondary bg-opacity-25"
                style={{ minHeight: 280 }}
              >
                <QuotePanel
                  key={`${ctx.saleId}-${effectiveChatId || "nochat"}-${bootstrapId ?? "none"}`}
                  chatId={effectiveChatId}
                  customerId={ctx.customerId}
                  salesOrderId={
                    Number.isFinite(Number(ctx.saleId)) && Number(ctx.saleId) > 0
                      ? Number(ctx.saleId)
                      : null
                  }
                  forceOpen
                  bootstrapDraftQuotationId={bootstrapId}
                  onBootstrapDraftConsumed={onBootstrapConsumed}
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
