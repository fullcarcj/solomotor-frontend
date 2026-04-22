"use client";
import { useCallback, useEffect, useState } from "react";

interface LinkableOrder {
  id:                        number;
  external_order_id:         string | null;
  payment_status:            string | null;
  fulfillment_type:          string | null;
  order_total_amount:        number | null;
  status:                    string | null;
  created_at:                string | null;
  conversation_id:           number | null;
  channel_id:                number | null;
  /** Tipo del chat al que ya apunta conversation_id (si no es null).
   *  ml_message / ml_question → vínculo auto-asignado al importar, reasignable.
   *  wa_inbound / wa_ml_linked → vínculo manual a otro chat WA, conflicto real. */
  linked_chat_source_type:   string | null;
  /** Primer ítem de la orden (título del artículo ML) */
  first_item_title:          string | null;
  /** Cantidad ofertada del primer ítem */
  first_item_quantity:       number | string | null;
  /** URL miniatura (ml_listings o JSON de la orden) */
  first_item_thumbnail:      string | null;
  /** Nombre y teléfono del cliente en el CRM */
  buyer_name:                string | null;
  buyer_phone:               string | null;
}

interface Props {
  open:      boolean;
  chatId:    string;
  onClose:   () => void;
  onSuccess: () => void;
}

/* ── helpers ── */

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function fmtUSD(v: number | null | undefined) {
  if (v == null) return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function fmtQty(q: number | string | null | undefined) {
  if (q == null || q === "") return null;
  const n = Number(q);
  if (!Number.isFinite(n)) return null;
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

/** Miniatura 56×56 con fallback */
function ItemThumb({ url, title }: { url: string | null | undefined; title: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          flexShrink: 0,
          background: "linear-gradient(135deg, #2a313c, #1c222b)",
          border: "1px solid var(--mu-line, rgba(255,255,255,0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--mu-ink-mute, #6e7681)",
        }}
        title={title ?? ""}
      >
        <i className="ti ti-photo" style={{ fontSize: 22, opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={56}
      height={56}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      style={{
        width: 56,
        height: 56,
        borderRadius: 8,
        objectFit: "cover",
        flexShrink: 0,
        border: "1px solid var(--mu-line, rgba(255,255,255,0.08))",
        background: "#111",
      }}
    />
  );
}

const PAYMENT_LABEL: Record<string, string> = {
  not_required: "Sin pago",
  pending:      "Pago pendiente",
  approved:     "Pagada",
  rejected:     "Rechazada",
  refunded:     "Reembolsada",
  waived:       "Exonerada",
};

const PAYMENT_COLOR: Record<string, string> = {
  not_required: "#6b7280",
  pending:      "#f59e0b",
  approved:     "#22c55e",
  rejected:     "#ef4444",
  refunded:     "#a78bfa",
  waived:       "#38bdf8",
};

function PaymentBadge({ status }: { status: string | null }) {
  const s = status ?? "pending";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: `${PAYMENT_COLOR[s] ?? "#6b7280"}22`,
        color: PAYMENT_COLOR[s] ?? "#6b7280",
        border: `1px solid ${PAYMENT_COLOR[s] ?? "#6b7280"}55`,
      }}
    >
      {PAYMENT_LABEL[s] ?? s}
    </span>
  );
}

/* ── componente principal ── */

type Phase = "idle" | "loading" | "loaded" | "empty" | "error" | "linking" | "success";

export default function LinkMlOrderModal({ open, chatId, onClose, onSuccess }: Props) {
  const [phase, setPhase]           = useState<Phase>("idle");
  const [orders, setOrders]         = useState<LinkableOrder[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [mergedIds, setMergedIds]   = useState<{ keptId: number; droppedId: number } | null>(null);

  /* ── cargar órdenes al abrir ── */
  const loadOrders = useCallback(async () => {
    setPhase("loading");
    setSelected(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/linkable-orders`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({})) as { orders?: LinkableOrder[] };
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const list = data.orders ?? [];
      setOrders(list);
      setPhase(list.length === 0 ? "empty" : "loaded");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al cargar órdenes");
      setPhase("error");
    }
  }, [chatId]);

  useEffect(() => {
    if (open) void loadOrders();
  }, [open, loadOrders]);

  /* ── cerrar con Escape ── */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ── vincular orden seleccionada ── */
  async function handleLink() {
    if (selected == null || phase === "linking") return;
    setPhase("linking");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/inbox/${encodeURIComponent(chatId)}/link-ml-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ml_order_id: selected }),
      });
      const data = await res.json().catch(() => ({})) as { message?: string; merged?: { keptId: number; droppedId: number } | null };
      if (!res.ok) {
        const msg = typeof data.message === "string" ? data.message : `Error ${res.status}`;
        throw new Error(msg);
      }
      if (data.merged) setMergedIds(data.merged);
      setPhase("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al vincular");
      setPhase("loaded");
    }
  }

  if (!open) return null;

  const isLinking = phase === "linking";

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 1050,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal
        aria-label="Vincular Orden Mercado Libre"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1051,
          background: "var(--mu-panel, #1e2020)",
          border: "1px solid var(--mu-border, rgba(255,255,255,0.1))",
          borderRadius: 12,
          padding: "1.5rem",
          width: "min(520px, calc(100vw - 2rem))",
          maxHeight: "calc(100vh - 4rem)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
        }}
      >
        {/* ── cabecera ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h6 style={{ fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: "#ff7400",
                  borderRadius: 6,
                  width: 26,
                  height: 26,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i className="ti ti-brand-mercado-pago" style={{ fontSize: 14, color: "#fff" }} />
              </span>
              Vincular Orden de Mercado Libre
            </h6>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--mu-ink-mute, #999)" }}>
              El chat heredará el ciclo de vida de la orden seleccionada.
            </p>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            style={{ opacity: 0.6, flexShrink: 0, marginLeft: 12 }}
            onClick={onClose}
            disabled={isLinking}
          />
        </div>

        {/* ── cuerpo con scroll ── */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>

          {/* Estado: cargando */}
          {phase === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="mu-skeleton"
                  style={{ height: 78, borderRadius: 8 }}
                />
              ))}
            </div>
          )}

          {/* Estado: vacío */}
          {phase === "empty" && (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 1rem",
                color: "var(--mu-ink-mute, #999)",
              }}
            >
              <i className="ti ti-inbox-off" style={{ fontSize: 36, display: "block", marginBottom: 10, opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: 13 }}>
                No hay órdenes de Mercado Libre disponibles para este cliente.
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 11 }}>
                Asegúrate de que el cliente esté identificado y tenga órdenes importadas.
              </p>
            </div>
          )}

          {/* Estado: error */}
          {phase === "error" && (
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem 1rem",
                color: "#ef4444",
              }}
            >
              <i className="ti ti-alert-circle" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 12 }}>{errorMsg}</p>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mt-3"
                onClick={() => void loadOrders()}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Estado: éxito */}
          {phase === "success" && (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 1rem",
                color: "#22c55e",
              }}
            >
              <i className="ti ti-circle-check" style={{ fontSize: 40, display: "block", marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>¡Orden vinculada con éxito!</p>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--mu-ink-mute)" }}>
                El chat ahora sigue el ciclo de vida de la orden de Mercado Libre.
              </p>
              {mergedIds && (
                <div style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  padding: "5px 10px",
                  borderRadius: 6,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#22c55e",
                }}>
                  <i className="ti ti-user-check" style={{ fontSize: 12 }} />
                  Clientes fusionados · se conservó #{mergedIds.keptId}
                </div>
              )}
            </div>
          )}

          {/* Estado: lista de órdenes */}
          {(phase === "loaded" || phase === "linking") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {orders.map(ord => {
                const isSel = selected === ord.id;
                // Vínculo auto-asignado a un chat ML → reasignable sin conflicto
                const isAutoMlLink =
                  ord.conversation_id != null &&
                  (ord.linked_chat_source_type === "ml_message" ||
                   ord.linked_chat_source_type === "ml_question");
                // Vínculo manual a otro chat WA → conflicto real (no debería aparecer, pero por si acaso)
                const isWaLinked =
                  ord.conversation_id != null && !isAutoMlLink;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    disabled={isLinking}
                    onClick={() => setSelected(isSel ? null : ord.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1.5px solid ${isSel ? "var(--bd-accent, #c5f24a)" : "var(--mu-line, rgba(255,255,255,0.08))"}`,
                      background: isSel
                        ? "rgba(197,242,74,0.07)"
                        : "var(--mu-panel-inner, rgba(255,255,255,0.03))",
                      cursor: isLinking ? "not-allowed" : "pointer",
                      textAlign: "left",
                      color: "inherit",
                      width: "100%",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    {/* Selector */}
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: `2px solid ${isSel ? "var(--bd-accent, #c5f24a)" : "var(--mu-line, rgba(255,255,255,0.3))"}`,
                        background: isSel ? "var(--bd-accent, #c5f24a)" : "transparent",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    />

                    <ItemThumb url={ord.first_item_thumbnail} title={ord.first_item_title} />

                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Fila superior: ID + badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--mu-ink)" }}>
                          {ord.external_order_id ?? `#${ord.id}`}
                        </span>
                        <PaymentBadge status={ord.payment_status} />
                        {/* Vínculo auto-asignado al chat ML del comprador — reasignable */}
                        {isAutoMlLink && (
                          <span
                            title="Esta orden fue vinculada automáticamente al chat de ML. Podés reasignarla a este chat WA."
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(255,116,0,0.12)",
                              color: "#ff7400",
                              border: "1px solid rgba(255,116,0,0.3)",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              cursor: "help",
                            }}
                          >
                            CHAT ML
                          </span>
                        )}
                        {/* Vínculo a otro chat WA — conflicto real */}
                        {isWaLinked && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(197,242,74,0.12)",
                              color: "var(--bd-accent, #c5f24a)",
                              border: "1px solid rgba(197,242,74,0.3)",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                            }}
                          >
                            VINCULADA
                          </span>
                        )}
                      </div>

                      {/* Producto ofertado + cantidad (título / cantidad / miniatura vienen del backend) */}
                      {(ord.first_item_title || fmtQty(ord.first_item_quantity) || ord.first_item_thumbnail) && (
                        <div style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          marginBottom: 4,
                          minWidth: 0,
                        }}>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--mu-ink-dim)",
                            lineHeight: 1.35,
                            flex: 1,
                            minWidth: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                            title={ord.first_item_title ?? undefined}
                          >
                            {ord.first_item_title ? (
                              <>
                                <i className="ti ti-package" style={{ fontSize: 10, marginRight: 4, opacity: 0.6, verticalAlign: "middle" }} />
                                {ord.first_item_title}
                              </>
                            ) : (
                              <span style={{ opacity: 0.7 }}>—</span>
                            )}
                          </div>
                          {fmtQty(ord.first_item_quantity) != null && (
                            <span
                              style={{
                                flexShrink: 0,
                                fontFamily: "monospace",
                                fontSize: 10,
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 6,
                                background: "rgba(197,242,74,0.12)",
                                color: "var(--bd-accent, #c5f24a)",
                                border: "1px solid rgba(197,242,74,0.28)",
                                letterSpacing: "0.02em",
                              }}
                              title="Cantidad ofertada (primer ítem)"
                            >
                              ×{fmtQty(ord.first_item_quantity)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadatos: fecha + contacto */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 10, color: "var(--mu-ink-mute)" }}>
                        <span>{fmtDate(ord.created_at)}</span>
                        {ord.fulfillment_type && <span>{ord.fulfillment_type.replace(/_/g, " ")}</span>}
                        {ord.buyer_phone && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <i className="ti ti-phone" style={{ fontSize: 10 }} />
                            {ord.buyer_phone}
                          </span>
                        )}
                        {ord.buyer_name && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <i className="ti ti-user" style={{ fontSize: 10 }} />
                            {ord.buyer_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Monto */}
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--mu-ink)", flexShrink: 0 }}>
                      {fmtUSD(ord.order_total_amount)}
                    </div>
                  </button>
                );
              })}

              {errorMsg && (
                <div className="alert alert-danger py-2 small mt-1 mb-0">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── pie: botones ── */}
        {(phase === "loaded" || phase === "linking") && (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              disabled={isLinking}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: selected != null ? "var(--bd-accent, #c5f24a)" : "var(--mu-line, rgba(255,255,255,0.1))",
                color: selected != null ? "#111" : "var(--mu-ink-mute)",
                fontWeight: 700,
                border: "none",
                cursor: selected != null && !isLinking ? "pointer" : "not-allowed",
                opacity: isLinking ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              disabled={selected == null || isLinking}
              onClick={() => void handleLink()}
            >
              {isLinking ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  Vinculando…
                </>
              ) : (
                <>
                  <i className="ti ti-link" style={{ fontSize: 13 }} />
                  Vincular orden
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
