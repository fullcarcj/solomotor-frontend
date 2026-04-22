"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import "@/app/(features)/supervisor/supervisor-theme.scss";

export interface PendingStatementItem {
  id: string;
  bank_account_id: number | null;
  bank_name: string | null;
  account_number: string | null;
  account_currency: string | null;
  tx_date: string | null;
  reference_number: string | null;
  description: string;
  tx_type: string;
  amount: string | null;
  balance_after: string | null;
  payment_type: string | null;
  reconciliation_status: string | null;
  sales_order_id: number | null;
  row_hash: string | null;
  created_at: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Al elegir un movimiento se cierra el modal y se delega la confirmación al panel de conciliación. */
  onPickStatement: (item: PendingStatementItem) => void;
}

const backdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.58)",
  zIndex: 1060,
};

const shell: CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 1061,
  width: "min(900px, calc(100vw - 1.25rem))",
  maxHeight: "min(90vh, 760px)",
  display: "flex",
  flexDirection: "column",
  borderRadius: 12,
  border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
  background: "var(--mu-panel-2, #1c222b)",
  boxShadow: "0 16px 56px rgba(0,0,0,0.55)",
  color: "var(--mu-text, #e6edf3)",
  overflow: "hidden",
};

const secLabel: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.1em",
  color: "var(--mu-ink-mute, #8b949e)",
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const line: CSSProperties = {
  flex: 1,
  height: 1,
  background: "var(--mu-border, rgba(255,255,255,0.08))",
};

function fmtBs(amount: string | null): string {
  if (amount == null || String(amount).trim() === "") return "—";
  const n = parseFloat(String(amount));
  if (!Number.isFinite(n)) return String(amount);
  return `Bs. ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Columnas fijas para alinear ID, fecha, descripción, referencia y monto entre filas. */
const STMT_ROW_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "6rem 6.25rem minmax(0, 1fr) 9rem 7.25rem",
  alignItems: "center",
  columnGap: 12,
  width: "100%",
};

export default function PendingStatementCreditsModal({
  open,
  onClose,
  onPickStatement,
}: Props) {
  const [items, setItems] = useState<PendingStatementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/inbox/bank-statements/pending-credits?limit=300", {
        credentials: "include",
        cache: "no-store",
      });
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
      const raw = data.items;
      setItems(Array.isArray(raw) ? (raw as PendingStatementItem[]) : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No se pudo cargar el extracto");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div style={backdrop} onClick={onClose} aria-hidden />
      <div style={shell} role="dialog" aria-modal aria-labelledby="psc-title" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 16px",
            background: "linear-gradient(180deg, var(--mu-panel-3, #232a35), var(--mu-panel-2, #1c222b))",
            borderBottom: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(147,197,253,0.12)",
              border: "1px solid rgba(147,197,253,0.28)",
              color: "#93c5fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className="ti ti-building-bank" style={{ fontSize: 18 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="psc-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--mu-text, #e6edf3)",
                letterSpacing: "-0.01em",
              }}
            >
              Extracto Banesco · créditos pendientes
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--mu-ink-dim, #a8a89a)", lineHeight: 1.4 }}>
              Tocá un movimiento para cargarlo en <strong>Comprobantes y conciliación</strong> y confirmá o cancelá
              allí.
            </p>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            style={{ opacity: 0.5, flexShrink: 0 }}
            aria-label="Cerrar"
            onClick={onClose}
          />
        </div>

        <div style={{ padding: "4px 16px 14px", flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ ...secLabel, marginTop: 4 }}>
            <span>Movimientos</span>
            <div style={line} />
          </div>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "1.1rem 0", fontSize: 14, color: "var(--mu-ink-dim, #a8a89a)" }}>
              <span className="spinner-border spinner-border-sm" />
              Cargando extracto…
            </div>
          )}
          {!loading && loadError && (
            <div className="alert alert-danger py-2 small" role="alert">
              {loadError}
            </div>
          )}
          {!loading && !loadError && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.75rem 0.5rem", fontSize: 14, color: "var(--mu-ink-dim, #a8a89a)" }}>
              No hay créditos pendientes por conciliar en el extracto.
            </div>
          )}
          {!loading && !loadError && items.length > 0 && (
            <div
              style={{
                borderRadius: 8,
                border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
                overflow: "hidden",
                background: "var(--mu-panel-3, #232a35)",
              }}
            >
              <div
                style={{
                  ...STMT_ROW_GRID,
                  padding: "6px 10px",
                  borderBottom: "1px solid var(--mu-border, rgba(255,255,255,0.1))",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--mu-ink-mute, #8b949e)",
                }}
              >
                <span>ID</span>
                <span>Fecha</span>
                <span>Descripción</span>
                <span>Referencia</span>
                <span style={{ textAlign: "right" }}>Monto</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {items.map((r, idx) => {
                  const isLast = idx === items.length - 1;
                  const tip = [
                    `ID ${r.id}`,
                    r.bank_name,
                    r.account_number,
                    r.account_currency,
                    r.sales_order_id != null ? `Orden CRM ${r.sales_order_id}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <button
                      key={r.id}
                      type="button"
                      title={tip}
                      onClick={() => {
                        onPickStatement(r);
                        onClose();
                      }}
                      style={{
                        ...STMT_ROW_GRID,
                        textAlign: "left",
                        cursor: "pointer",
                        border: "none",
                        borderBottom: isLast
                          ? "none"
                          : "1px solid var(--mu-border, rgba(255,255,255,0.06))",
                        background: "transparent",
                        padding: "5px 10px",
                        color: "inherit",
                        transition: "background 0.12s",
                        margin: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--mu-ink-dim, #a8a89a)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 0,
                        }}
                      >
                        {r.id}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--mu-text, #e6edf3)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.tx_date ?? "—"}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--mu-text, #e6edf3)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                          textAlign: "left",
                        }}
                      >
                        {r.description || "—"}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--mu-ink-dim, #a8a89a)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {r.reference_number ?? "—"}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#c5f24a",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtBs(r.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            padding: "10px 16px 12px",
            borderTop: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
            background: "var(--mu-panel-2, #1c222b)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--mu-ink-dim, #a8a89a)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
            {!loading && !loadError ? `${items.length} movimiento${items.length !== 1 ? "s" : ""}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              border: "1px solid var(--mu-border, rgba(255,255,255,0.14))",
              background: "transparent",
              color: "var(--mu-text, #e6edf3)",
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
