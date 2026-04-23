"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ml-order-messaging-modal.scss";

interface PackRow {
  id?: number;
  ml_user_id?: number;
  order_id?: number;
  from_user_id?: string | number | null;
  to_user_id?: string | number | null;
  message_text?: string | null;
  date_created?: string | null;
}

interface PackPayload {
  messages: PackRow[];
  ml_order_id: number;
  ml_user_id: number;
  buyer_id: number;
  chat_id: number | null;
  external_order_id?: string | null;
}

/** El backend (`webhook-receiver`) envía texto legible en `error` y contexto en `detail` / `meta.sync_error`. */
function pickMlPackErrorMessage(
  j: Record<string, unknown> | null | undefined,
  fallbackStatus: number
): string {
  if (!j || typeof j !== "object") return `Error ${fallbackStatus}`;
  const err = j.error != null ? String(j.error).trim() : "";
  const msg = j.message != null ? String(j.message).trim() : "";
  if (err) return err;
  if (msg) return msg;
  const code = j.code != null ? String(j.code) : "";
  if (code) return `${code} (HTTP ${fallbackStatus})`;
  return `Error ${fallbackStatus}`;
}

function isSellerMessage(row: PackRow, sellerId: number): boolean {
  const from = row.from_user_id != null ? Number(row.from_user_id) : NaN;
  return Number.isFinite(from) && from === sellerId;
}

function storageHideBandejaKey(chatId: number | string) {
  return `mu_ml_hide_bandeja_link_${String(chatId)}`;
}

function isBandejaLinkHiddenForChat(chatId: number | string | null | undefined): boolean {
  if (chatId == null) return false;
  try {
    return sessionStorage.getItem(storageHideBandejaKey(chatId)) === "1";
  } catch {
    return false;
  }
}

function markBandejaLinkHidden(chatId: number | string) {
  try {
    sessionStorage.setItem(storageHideBandejaKey(chatId), "1");
  } catch {
    /* modo privado */
  }
}

export default function MlOrderMessagingModal({
  saleId,
  externalHint,
  onClose,
  onAfterReply,
}: {
  saleId: string | number;
  externalHint?: string | null;
  onClose: () => void;
  /** Tras enviar OK (p. ej. refrescar bandeja). */
  onAfterReply?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PackPayload | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const load = useCallback(async (sync: boolean): Promise<PackPayload | null> => {
    setError(null);
    if (sync) setSyncing(true);
    else setLoading(true);
    let dataOut: PackPayload | null = null;
    try {
      const q = sync ? "?sync=1" : "";
      const res = await fetch(`/api/ventas/pedidos/${encodeURIComponent(String(saleId))}/ml-pack-messages${q}`, {
        credentials: "include",
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as {
        data?: PackPayload;
        error?: string;
        message?: string;
        code?: string;
        meta?: { sync_error?: string };
      };
      if (!res.ok) {
        setError(pickMlPackErrorMessage(j as Record<string, unknown>, res.status));
        setPayload(null);
        return null;
      }
      if (j.data) {
        setPayload(j.data);
        dataOut = j.data;
      }
      const syncErr = j.meta && typeof j.meta === "object" && "sync_error" in j.meta ? String((j.meta as { sync_error?: string }).sync_error ?? "").trim() : "";
      if (syncErr) setError(syncErr);
      return dataOut;
    } catch {
      setError("Error de red al cargar mensajes.");
      setPayload(null);
      return null;
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [saleId]);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (!listRef.current || loading) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [payload?.messages, loading]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventas/pedidos/${encodeURIComponent(String(saleId))}/ml-pack-messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(pickMlPackErrorMessage(j, res.status));
        return;
      }
      setDraft("");
      const prevChatId = payload?.chat_id ?? null;
      const refreshed = await load(false);
      const cid = refreshed?.chat_id ?? prevChatId;
      if (cid != null) {
        markBandejaLinkHidden(cid);
      }
      onAfterReply?.();
      onClose();
    } catch {
      setError("Error de red al enviar.");
    } finally {
      setSending(false);
    }
  };

  const sellerId = payload?.ml_user_id ?? 0;
  const titleExt = externalHint ?? payload?.external_order_id ?? "";
  const bandejaChatId = payload?.chat_id ?? null;
  const showBandejaLink =
    bandejaChatId != null && !isBandejaLinkHiddenForChat(bandejaChatId);

  const modal = (
    <div className="pd-ml-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="pd-ml-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-ml-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="pd-ml-modal-head">
          <div>
            <h2 id="pd-ml-modal-title" className="pd-ml-modal-title">
              Mensajería Mercado Libre
            </h2>
            <p className="pd-ml-modal-sub">
              Orden venta #{saleId}
              {titleExt ? (
                <>
                  {" "}
                  · <span className="pd-ml-mono">{titleExt}</span>
                </>
              ) : null}
            </p>
          </div>
          <button type="button" className="pd-ml-modal-x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="pd-ml-modal-toolbar">
          <button type="button" className="pd-ml-sync-btn" disabled={syncing || loading} onClick={() => void load(true)}>
            {syncing ? "Sincronizando…" : "Sincronizar con ML"}
          </button>
          {showBandejaLink && (
            <Link href={`/bandeja/${bandejaChatId}`} className="pd-ml-band-link">
              Abrir en bandeja
            </Link>
          )}
        </div>

        {error && (
          <div className="pd-ml-err" role="alert">
            {error}
          </div>
        )}

        <div className="pd-ml-thread" ref={listRef}>
          {loading ? (
            <p className="pd-ml-muted">Cargando historial…</p>
          ) : !payload?.messages?.length ? (
            <p className="pd-ml-muted">No hay mensajes guardados. Usá «Sincronizar con ML» o esperá al job de sync.</p>
          ) : (
            payload.messages.map((m) => {
              const seller = isSellerMessage(m, sellerId);
              return (
                <div key={String(m.id ?? `${m.date_created}-${m.message_text?.slice(0, 20)}`)} className={`pd-ml-bubble-wrap ${seller ? "out" : "in"}`}>
                  <div className={`pd-ml-bubble ${seller ? "out" : "in"}`}>
                    <div className="pd-ml-bubble-meta">{seller ? "Vendedor" : "Comprador"}</div>
                    <div className="pd-ml-bubble-text">{m.message_text ?? "—"}</div>
                    {m.date_created && (
                      <div className="pd-ml-bubble-time">
                        {new Date(m.date_created).toLocaleString("es-VE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="pd-ml-modal-foot">
          <label className="pd-ml-muted pd-ml-attach-hint">
            <input type="file" disabled className="pd-ml-file-dummy" title="Adjuntos: no disponible en esta versión (API post_sale texto)" />
            Adjuntos (próximamente)
          </label>
          <div className="pd-ml-compose">
            <textarea
              className="pd-ml-textarea"
              rows={3}
              maxLength={350}
              placeholder="Escribí mensaje al comprador (máx. 350 caracteres, límite ML)…"
              value={draft}
              disabled={sending}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="pd-ml-compose-foot">
              <span className="pd-ml-count">{draft.length}/350</span>
              <button type="button" className="pd-ml-send" disabled={sending || !draft.trim()} onClick={() => void send()}>
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  if (!portalReady || typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
