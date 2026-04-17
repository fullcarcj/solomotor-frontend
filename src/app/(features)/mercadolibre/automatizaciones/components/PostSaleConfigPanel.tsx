"use client";
import { useCallback, useEffect, useState } from "react";
import type { PostSaleMessage } from "@/types/automatizaciones";

function parseMessages(json: unknown): PostSaleMessage[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const data = (o.data ?? o) as unknown;
  if (Array.isArray(data)) return data as PostSaleMessage[];
  if (Array.isArray((o as { messages?: unknown[] }).messages)) return (o as { messages: PostSaleMessage[] }).messages;
  return [];
}

function Toast({ msg, onClose }: { msg: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="toast show position-fixed bottom-0 end-0 m-3 bg-success text-white" style={{ zIndex: 9999, minWidth: 220 }}>
      <div className="toast-body d-flex align-items-center gap-2">
        <i className="ti ti-check" /> {msg}
        <button className="btn-close btn-close-white ms-auto" onClick={onClose} />
      </div>
    </div>
  );
}

interface EditState { msg: PostSaleMessage; saving: boolean; error: string | null }

export default function PostSaleConfigPanel() {
  const [messages, setMessages] = useState<PostSaleMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/automatizaciones/config/post-sale", {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as Record<string, string>)?.error ?? "Error al cargar configuración");
        return;
      }
      setMessages(parseMessages(json));
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openEdit = (msg: PostSaleMessage) => setEditState({ msg: { ...msg }, saving: false, error: null });
  const closeEdit = () => setEditState(null);

  const save = async () => {
    if (!editState) return;
    setEditState((s) => s && { ...s, saving: true, error: null });
    try {
      const res = await fetch(`/api/automatizaciones/config/post-sale/${editState.msg.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_text: editState.msg.message_text,
          is_active: editState.msg.is_active,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as Record<string, string>)?.error ?? "Error al guardar";
        setEditState((s) => s && { ...s, saving: false, error: msg });
        return;
      }
      setToast("Mensaje actualizado");
      closeEdit();
      await load();
    } catch {
      setEditState((s) => s && { ...s, saving: false, error: "Error de red." });
    }
  };

  if (loading) {
    return (
      <div className="placeholder-glow">
        {[1, 2].map((i) => (
          <div key={i} className="card mb-3 border-0 shadow-sm">
            <div className="card-body">
              <div className="placeholder col-12 rounded" style={{ height: 60 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Reintentar</button>
        </div>
      )}

      <div className="alert alert-info small mb-4">
        <i className="ti ti-info-circle me-1" />
        Los mensajes se envían automáticamente al comprador de ML tras confirmar la orden.
      </div>

      {messages.length === 0 && !error && (
        <p className="text-muted">Sin mensajes post-venta configurados.</p>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold small">#{msg.message_order}</span>
                {msg.is_active ? (
                  <span className="badge bg-success">● Activo</span>
                ) : (
                  <span className="badge bg-secondary">○ Inactivo</span>
                )}
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(msg)}>
                <i className="ti ti-pencil me-1" />Editar
              </button>
            </div>
            <p className="mb-0 small" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {msg.message_text}
            </p>
          </div>
        </div>
      ))}

      {/* Modal inline */}
      {editState && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={closeEdit}
            style={{ zIndex: 1040 }}
          />
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ zIndex: 1050 }}
            aria-modal
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Editar mensaje #{editState.msg.message_order}</h5>
                  <button className="btn-close" onClick={closeEdit} />
                </div>
                <div className="modal-body">
                  {editState.error && (
                    <div className="alert alert-danger small">{editState.error}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Texto del mensaje</label>
                    <textarea
                      rows={6}
                      className="form-control font-monospace small"
                      value={editState.msg.message_text}
                      onChange={(e) =>
                        setEditState((s) =>
                          s ? { ...s, msg: { ...s.msg, message_text: e.target.value } } : s
                        )
                      }
                    />
                    <div className="form-text">
                      Puedes usar placeholders: <code>{"{{order_id}}"}</code>, <code>{"{{buyer_name}}"}</code>, etc.
                    </div>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="is_active_toggle"
                      checked={editState.msg.is_active}
                      onChange={(e) =>
                        setEditState((s) =>
                          s ? { ...s, msg: { ...s.msg, is_active: e.target.checked } } : s
                        )
                      }
                    />
                    <label className="form-check-label" htmlFor="is_active_toggle">
                      {editState.msg.is_active ? "Activo" : "Inactivo"}
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeEdit} disabled={editState.saving}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => void save()}
                    disabled={editState.saving}
                  >
                    {editState.saving ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Guardando…</>
                    ) : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Toast msg={toast} onClose={() => setToast(null)} />
    </div>
  );
}
