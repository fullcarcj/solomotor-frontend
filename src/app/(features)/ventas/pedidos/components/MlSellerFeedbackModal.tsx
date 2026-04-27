"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Sale } from "@/types/sales";
import "./ml-order-messaging-modal.scss";
import { mlVentasOrderUrl } from "./mlVentasUrls";

const DEFAULT_MSG = "Gracias por la compra. Todo correcto.";

function pickErrorMessage(j: Record<string, unknown> | null, status: number): string {
  if (!j) return `Error ${status}`;
  const msg = j.message != null ? String(j.message).trim() : "";
  if (msg) return msg;
  const err = j.error;
  if (typeof err === "string" && err.trim()) return err.trim();
  if (err && typeof err === "object") {
    const m = (err as { message?: string }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return `Error ${status}`;
}

export default function MlSellerFeedbackModal({
  sale,
  onClose,
  onSubmitted,
}: {
  sale: Sale;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mlUid = sale.ml_user_id;
  const orderId = sale.ml_api_order_id;
  const ventasUrl = mlVentasOrderUrl(sale.ml_site_id ?? null, orderId);

  const submit = useCallback(async () => {
    setErr(null);
    if (mlUid == null || orderId == null) {
      setErr("Falta cuenta u orden ML en esta fila.");
      return;
    }
    const msg = message.trim();
    if (msg.length < 1 || msg.length > 160) {
      setErr("El mensaje debe tener entre 1 y 160 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ventas/pedidos/ml-feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ml_user_id: mlUid,
          order_id: orderId,
          fulfilled: true,
          rating: "positive",
          message: msg,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setErr(pickErrorMessage(j, res.status));
        return;
      }
      onSubmitted?.();
      onClose();
    } catch {
      setErr("Error de red al enviar la calificación.");
    } finally {
      setSubmitting(false);
    }
  }, [message, mlUid, orderId, onClose, onSubmitted]);

  if (!mounted || typeof document === "undefined") return null;

  const title = "Calificar al comprador (Mercado Libre)";
  const sub = `Orden ML #${orderId ?? "—"} · cuenta ${mlUid ?? "—"}`;

  return createPortal(
    <div
      className="pd-ml-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pd-ml-modal" role="dialog" aria-labelledby="ml-seller-fb-title">
        <div className="pd-ml-modal-head">
          <div>
            <h2 id="ml-seller-fb-title" className="pd-ml-modal-title">
              {title}
            </h2>
            <p className="pd-ml-modal-sub pd-ml-mono">{sub}</p>
          </div>
          <button type="button" className="pd-ml-modal-x" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="pd-ml-modal-toolbar" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <label className="small text-secondary mb-1" htmlFor="ml-seller-fb-msg">
            Mensaje para el comprador (obligatorio en ML, máx. 160 caracteres)
          </label>
          <textarea
            id="ml-seller-fb-msg"
            className="form-control form-control-sm"
            rows={3}
            maxLength={160}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            style={{
              background: "var(--pd-panel-2, #1a222d)",
              color: "var(--pd-text, #e6edf3)",
              border: "1px solid var(--pd-border, #2a3340)",
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
            }}
          />
          <span className="small text-muted mt-1">{message.trim().length}/160</span>
        </div>

        {err ? <p className="pd-ml-err">{err}</p> : null}

        <div
          className="pd-ml-modal-toolbar"
          style={{ justifyContent: "space-between", paddingTop: 4, paddingBottom: 16 }}
        >
          {ventasUrl ? (
            <a
              href={ventasUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pd-ml-band-link"
            >
              Abrir venta en Mercado Libre ↗
            </a>
          ) : (
            <span className="pd-ml-modal-sub">Sin enlace directo (falta site u orden)</span>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="pd-ml-sync-btn" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="pd-ml-sync-btn"
              style={{ borderColor: "rgba(34,197,94,0.45)", color: "#86efac" }}
              disabled={submitting || mlUid == null || orderId == null}
              onClick={() => void submit()}
            >
              {submitting ? "Enviando…" : "Enviar positiva"}
            </button>
          </div>
        </div>

        <p className="px-3 pb-3 small text-muted mb-0" style={{ fontSize: 11, lineHeight: 1.45 }}>
          Equivale a marcar la venta como cumplida y calificación positiva en ML. Solo se puede enviar una vez por
          orden; si ML rechaza el envío, revisá el mensaje de error o completá el flujo en el sitio de Mercado Libre.
        </p>
      </div>
    </div>,
    document.body
  );
}
