"use client";

/**
 * PriceAdjustPanel — Panel de ajuste de precio de catálogo (unit_price_usd).
 *
 * Solo visible para roles SUPERUSER | ADMIN | SUPERVISOR.
 * Se monta en ChatContextPanel cuando hay un producto seleccionado desde el
 * QuotePanel (prop productId) o desde la búsqueda de inventario contextual.
 *
 * Flujo:
 *  1. Muestra el precio actual del producto.
 *  2. Formulario: nuevo precio USD + razón (obligatoria).
 *  3. POST /api/inventory/products/:id/price-adjustment
 *  4. Sección de historial colapsable: GET /api/inventory/products/:id/price-history
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PriceHistoryItem {
  id: number;
  price_before: number | null;
  price_after: number;
  changed_by_name: string | null;
  reason: string | null;
  source: string;
  created_at: string;
}

interface ProductPriceInfo {
  id: number;
  sku: string;
  name: string;
  unit_price_usd: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = new Set(["SUPERUSER", "ADMIN", "SUPERVISOR"]);

function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function deltaColor(before: number | null, after: number): string {
  if (before == null) return "#8b949e";
  if (after > before) return "#86efac";
  if (after < before) return "#fca5a5";
  return "#8b949e";
}

function deltaLabel(before: number | null, after: number): string {
  if (before == null) return "—";
  const diff = after - before;
  const pct  = before > 0 ? ((diff / before) * 100).toFixed(1) : "∞";
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(2)} (${diff >= 0 ? "+" : ""}${pct}%)`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export interface PriceAdjustPanelProps {
  productId: number;
  /** Si se pasa, se usa como cabecera sin necesidad de un fetch adicional */
  productInfo?: ProductPriceInfo | null;
  /** Callback tras un ajuste exitoso para que el padre refresque datos */
  onAdjusted?: (newPrice: number) => void;
}

export default function PriceAdjustPanel({
  productId,
  productInfo,
  onAdjusted,
}: PriceAdjustPanelProps) {
  const { user, loading: userLoading } = useCurrentUser();

  const [product, setProduct]     = useState<ProductPriceInfo | null>(productInfo ?? null);
  const [loadingProd, setLoadingP] = useState(!productInfo);

  const [newPrice, setNewPrice]   = useState("");
  const [reason, setReason]       = useState("");
  const [submitting, setSubmit]   = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk]   = useState<string | null>(null);

  const [histOpen, setHistOpen]         = useState(false);
  const [history, setHistory]           = useState<PriceHistoryItem[]>([]);
  const [histTotal, setHistTotal]       = useState(0);
  const [loadingHist, setLoadingHist]   = useState(false);
  const [histOffset, setHistOffset]     = useState(0);
  const HIST_PAGE = 8;

  const priceInputRef = useRef<HTMLInputElement>(null);

  // Cargar producto si no viene por prop
  useEffect(() => {
    if (productInfo) { setProduct(productInfo); setLoadingP(false); return; }
    let alive = true;
    setLoadingP(true);
    fetch(`/api/inventory/products/${productId}`, { credentials: "include", cache: "no-store" })
      .then(r => r.json().catch(() => ({})))
      .then((d: Record<string, unknown>) => {
        if (!alive) return;
        const p = (d.data ?? d) as Record<string, unknown>;
        setProduct({
          id: Number(p.id),
          sku: String(p.sku ?? ""),
          name: String(p.name ?? ""),
          unit_price_usd: p.unit_price_usd != null ? Number(p.unit_price_usd) : null,
        });
      })
      .catch(() => { if (alive) setProduct(null); })
      .finally(() => { if (alive) setLoadingP(false); });
    return () => { alive = false; };
  }, [productId, productInfo]);

  // Cargar historial
  const loadHistory = useCallback(async (offset = 0) => {
    setLoadingHist(true);
    try {
      const r = await fetch(
        `/api/inventory/products/${productId}/price-history?limit=${HIST_PAGE}&offset=${offset}`,
        { credentials: "include", cache: "no-store" }
      );
      const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      const data = (d.data ?? d) as Record<string, unknown>;
      const items = (data.items ?? []) as PriceHistoryItem[];
      const total = Number(data.total ?? 0);
      setHistory(prev => offset === 0 ? items : [...prev, ...items]);
      setHistTotal(total);
      setHistOffset(offset + items.length);
    } catch {/* ignore */}
    finally { setLoadingHist(false); }
  }, [productId]);

  useEffect(() => {
    if (histOpen && history.length === 0) void loadHistory(0);
  }, [histOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refrescar cuando cambia el producto
  useEffect(() => {
    setHistory([]);
    setHistTotal(0);
    setHistOffset(0);
    setNewPrice("");
    setReason("");
    setSubmitErr(null);
    setSubmitOk(null);
    if (histOpen) void loadHistory(0);
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enviar ajuste
  const handleSubmit = async () => {
    const val = parseFloat(newPrice.replace(",", "."));
    if (!Number.isFinite(val) || val < 0) {
      setSubmitErr("Ingresá un precio válido (mayor o igual a 0)."); return;
    }
    if (!reason.trim()) {
      setSubmitErr("La razón del ajuste es obligatoria."); return;
    }
    setSubmit(true);
    setSubmitErr(null);
    setSubmitOk(null);
    try {
      const res = await fetch(
        `/api/inventory/products/${productId}/price-adjustment`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unit_price_usd: val, reason: reason.trim() }),
        }
      );
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setSubmitErr(String(
          (json.error as Record<string, unknown>)?.message ?? json.message ?? "Error al guardar el ajuste."
        ));
        return;
      }
      const data = (json.data ?? json) as Record<string, unknown>;
      const prod = data.product as Record<string, unknown>;
      if (prod) {
        setProduct(prev => prev ? {
          ...prev,
          unit_price_usd: prod.unit_price_usd != null ? Number(prod.unit_price_usd) : prev.unit_price_usd,
        } : prev);
      }
      setSubmitOk(`Precio actualizado a ${fmtUSD(val)}.`);
      setNewPrice("");
      setReason("");
      onAdjusted?.(val);
      // Refrescar historial
      setHistory([]);
      setHistOffset(0);
      if (histOpen) void loadHistory(0);
      else setHistOpen(true);
    } catch {
      setSubmitErr("Error de red al guardar el ajuste.");
    } finally {
      setSubmit(false);
    }
  };

  // Guard de rol
  if (userLoading) return null;
  if (!user || !ALLOWED_ROLES.has(user.role ?? "")) return null;

  return (
    <div style={{
      borderRadius: 10,
      border: "1px solid rgba(197,130,255,0.25)",
      background: "linear-gradient(160deg, rgba(80,30,100,0.18) 0%, var(--mu-panel-2,#1c222b) 100%)",
      marginBottom: 6,
      overflow: "visible",
    }}>
      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        borderBottom: "1px solid rgba(197,130,255,0.15)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "rgba(197,130,255,0.12)",
          border: "1px solid rgba(197,130,255,0.3)",
          color: "#d8b4fe",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ti ti-tag" style={{ fontSize: 13 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mu-text,#e6edf3)" }}>
            Ajuste de precio
          </div>
          {loadingProd ? (
            <div style={{ fontSize: 9, color: "#8b949e" }}>Cargando…</div>
          ) : product ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, color: "#8b949e", letterSpacing: "0.06em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {product.sku} · precio actual: <span style={{ color: "#d8b4fe", fontWeight: 700 }}>{fmtUSD(product.unit_price_usd)}</span>
            </div>
          ) : null}
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, fontWeight: 800, letterSpacing: "0.1em",
          padding: "2px 6px", borderRadius: 4,
          background: "rgba(197,130,255,0.12)",
          border: "1px solid rgba(197,130,255,0.3)",
          color: "#d8b4fe",
        }}>
          {user.role}
        </span>
      </div>

      {/* ── Formulario de ajuste ──────────────────────────────────── */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Nombre del producto */}
        {product && (
          <div style={{
            padding: "7px 10px", borderRadius: 7,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11, color: "var(--mu-text,#e6edf3)", fontWeight: 600,
            lineHeight: 1.35,
          }}>
            {product.name}
          </div>
        )}

        {/* Nuevo precio */}
        <div>
          <label style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: "0.12em", fontWeight: 800,
            color: "#8b949e", textTransform: "uppercase",
            display: "block", marginBottom: 5,
          }}>
            Nuevo precio USD
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13, fontWeight: 700, color: "#8b949e", flexShrink: 0,
            }}>$</span>
            <input
              ref={priceInputRef}
              type="text"
              inputMode="decimal"
              placeholder={product?.unit_price_usd != null ? String(product.unit_price_usd) : "0.00"}
              value={newPrice}
              onChange={e => { setNewPrice(e.target.value); setSubmitErr(null); setSubmitOk(null); }}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 7,
                border: "1px solid rgba(197,130,255,0.3)",
                background: "var(--mu-panel-3,#232a35)",
                color: "var(--mu-text,#e6edf3)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13, fontWeight: 700,
                outline: "none",
              }}
            />
            {/* Preview delta */}
            {newPrice && product?.unit_price_usd != null && (() => {
              const val = parseFloat(newPrice.replace(",", "."));
              if (!Number.isFinite(val)) return null;
              return (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                  color: deltaColor(product.unit_price_usd, val),
                }}>
                  {deltaLabel(product.unit_price_usd, val)}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Razón */}
        <div>
          <label style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: "0.12em", fontWeight: 800,
            color: "#8b949e", textTransform: "uppercase",
            display: "block", marginBottom: 5,
          }}>
            Razón del ajuste *
          </label>
          <input
            type="text"
            placeholder="ej. actualización de lista, ajuste por mercado…"
            maxLength={300}
            value={reason}
            onChange={e => { setReason(e.target.value); setSubmitErr(null); setSubmitOk(null); }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px",
              borderRadius: 7,
              border: "1px solid rgba(197,130,255,0.2)",
              background: "var(--mu-panel-3,#232a35)",
              color: "var(--mu-text,#e6edf3)",
              fontFamily: "inherit",
              fontSize: 11,
              outline: "none",
            }}
          />
        </div>

        {/* Feedback */}
        {submitErr && (
          <div style={{
            padding: "6px 10px", borderRadius: 6,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            fontSize: 10, color: "#fca5a5",
          }}>
            {submitErr}
          </div>
        )}
        {submitOk && (
          <div style={{
            padding: "6px 10px", borderRadius: 6,
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
            fontSize: 10, color: "#86efac", display: "flex", alignItems: "center", gap: 6,
          }}>
            <i className="ti ti-check" /> {submitOk}
          </div>
        )}

        {/* Botón guardar */}
        <button
          type="button"
          disabled={submitting || loadingProd || !newPrice.trim()}
          onClick={() => void handleSubmit()}
          style={{
            width: "100%",
            height: 34,
            borderRadius: 8,
            border: "1px solid rgba(197,130,255,0.5)",
            background: submitting
              ? "rgba(197,130,255,0.08)"
              : "linear-gradient(180deg, rgba(197,130,255,0.9) 0%, #8b3fc8 100%)",
            color: submitting ? "#8b949e" : "#f5f0ff",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 800,
            cursor: submitting ? "wait" : "pointer",
            transition: "background 0.15s",
            letterSpacing: "0.04em",
          }}
        >
          {submitting ? "Guardando…" : "Guardar ajuste de precio"}
        </button>
      </div>

      {/* ── Historial ─────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(197,130,255,0.12)" }}>
        <button
          type="button"
          onClick={() => setHistOpen(v => !v)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 14px",
            background: "transparent", border: "none", cursor: "pointer",
            color: "#8b949e",
          }}
        >
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: "0.12em", fontWeight: 800,
            textTransform: "uppercase",
          }}>
            Historial de ajustes{histTotal > 0 ? ` (${histTotal})` : ""}
          </span>
          <i className={`ti ti-chevron-${histOpen ? "up" : "down"}`} style={{ fontSize: 12 }} />
        </button>

        {histOpen && (
          <div style={{ padding: "0 14px 12px" }}>
            {loadingHist && history.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#8b949e", padding: "6px 0" }}>
                Cargando historial…
              </div>
            ) : history.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#8b949e", padding: "6px 0" }}>
                Sin ajustes registrados aún.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map(h => (
                  <div key={h.id} style={{
                    padding: "8px 10px",
                    borderRadius: 7,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    {/* Fila principal: precios + delta */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {h.price_before != null && (
                          <>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#8b949e", textDecoration: "line-through" }}>
                              {fmtUSD(h.price_before)}
                            </span>
                            <span style={{ color: "#555e6b", fontSize: 10 }}>→</span>
                          </>
                        )}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: "#d8b4fe" }}>
                          {fmtUSD(h.price_after)}
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9, fontWeight: 700,
                          color: deltaColor(h.price_before, h.price_after),
                        }}>
                          {deltaLabel(h.price_before, h.price_after)}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#8b949e", flexShrink: 0 }}>
                        {fmtDateShort(h.created_at)}
                      </span>
                    </div>
                    {/* Razón + usuario */}
                    <div style={{ marginTop: 5, display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                      {h.reason && (
                        <span style={{ fontSize: 10, color: "var(--mu-text,#e6edf3)", flex: 1 }}>
                          {h.reason}
                        </span>
                      )}
                      {h.changed_by_name && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 8, color: "#8b949e", flexShrink: 0,
                          letterSpacing: "0.04em",
                        }}>
                          {h.changed_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Paginación */}
                {histOffset < histTotal && (
                  <button
                    type="button"
                    disabled={loadingHist}
                    onClick={() => void loadHistory(histOffset)}
                    style={{
                      width: "100%", height: 28,
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent",
                      color: "#8b949e",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9, cursor: "pointer",
                    }}
                  >
                    {loadingHist ? "Cargando…" : `Ver más (${histTotal - histOffset} restantes)`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
