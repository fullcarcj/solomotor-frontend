"use client";
import {
  useCallback, useEffect, useRef, useState,
  type CSSProperties, type FormEvent,
} from "react";
import { invalidateChatContextClientCache } from "@/hooks/useChatContext";

const ID_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Sin definir" },
  { value: "V", label: "V — Venezolano" },
  { value: "E", label: "E — Extranjero" },
  { value: "J", label: "J — Jurídico" },
  { value: "G", label: "G — Gubernamental" },
  { value: "P", label: "P — Pasaporte" },
];

/** Valores CHECK en BD: draft | active | blocked */
const CRM_STATUS_OPTIONS: { value: "draft" | "active" | "blocked"; label: string }[] = [
  { value: "draft", label: "Prospecto" },
  { value: "active", label: "Activo" },
  { value: "blocked", label: "Bloqueado" },
];

function channelLabel(sourceType: string | null | undefined): string {
  switch (sourceType) {
    case "wa_inbound":
      return "WhatsApp";
    case "ml_message":
      return "MercadoLibre (mensaje)";
    case "ml_question":
      return "MercadoLibre (pregunta)";
    default:
      return sourceType?.trim() ? String(sourceType) : "—";
  }
}

function normalizeCrmStatus(raw: string | null | undefined): "draft" | "active" | "blocked" {
  const s = String(raw ?? "draft").toLowerCase();
  if (s === "active" || s === "blocked" || s === "draft") return s;
  return "draft";
}

function extractPayload(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if ("data" in o && o.data && typeof o.data === "object") return o.data as Record<string, unknown>;
  return o;
}

interface Props {
  open: boolean;
  customerId: number;
  /** Contexto UI (subtítulo); no se persiste */
  chatId?: string | null;
  sourceType?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const panel: CSSProperties = {
  background: "var(--mu-panel, #151611)",
  border: "1px solid var(--mu-line, #2a2c24)",
  borderRadius: 12,
  color: "var(--mu-ink, #efeadb)",
};

const labelStyle: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--mu-ink-mute, #6e6f64)",
  marginBottom: 6,
  display: "block",
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "var(--mu-panel-2, #1c1e18)",
  border: "1px solid var(--mu-line, #2a2c24)",
  borderRadius: 8,
  color: "var(--mu-ink, #efeadb)",
  padding: "8px 10px",
  fontSize: "0.875rem",
};

const sectionTitle: CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "var(--mu-ink-dim, #a8a89a)",
  marginBottom: 12,
  paddingBottom: 6,
  borderBottom: "1px solid var(--mu-line, #2a2c24)",
};

/**
 * Modal de edición de cliente CRM (identidad + contacto).
 * GET/PATCH → /api/clientes/:id → BFF → /api/crm/customers/:id
 */
export default function EditCustomerModal({
  open,
  customerId,
  chatId,
  sourceType,
  onClose,
  onSuccess,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [crmStatus, setCrmStatus] = useState<"draft" | "active" | "blocked">("draft");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/clientes/${customerId}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
        const msg =
          typeof o.error === "string"
            ? o.error
            : typeof o.message === "string"
              ? o.message
              : `Error ${res.status}`;
        throw new Error(msg);
      }
      const row = extractPayload(json);
      if (!row) {
        setLoadError("Respuesta vacía del servidor");
        return;
      }
      setFullName(String(row.full_name ?? "").trim());
      setCrmStatus(normalizeCrmStatus(row.crm_status as string | undefined));
      setIdType(row.id_type != null ? String(row.id_type).trim().toUpperCase() : "");
      setIdNumber(row.id_number != null ? String(row.id_number).trim() : "");
      setPhone(row.phone != null ? String(row.phone).trim() : "");
      setPhone2(row.phone_2 != null ? String(row.phone_2).trim() : "");
      setEmail(row.email != null ? String(row.email).trim() : "");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No se pudo cargar el cliente");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!open) return;
    void loadCustomer();
    setError(null);
    setTimeout(() => nameRef.current?.focus(), 80);
  }, [open, loadCustomer]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string | null> = {
        full_name: fullName.trim(),
        crm_status: crmStatus,
        id_type: idType.trim() ? idType.trim().toUpperCase() : null,
        id_number: idNumber.trim() || null,
        phone: phone.trim() || null,
        phone_2: phone2.trim() || null,
        email: email.trim() || null,
      };

      const res = await fetch(`/api/clientes/${customerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
        const msg =
          typeof o.error === "string"
            ? o.error
            : typeof o.message === "string"
              ? o.message
              : `Error ${res.status}`;
        throw new Error(msg);
      }
      // Invalidar caché de módulo para que el panel muestre datos frescos tras editar.
      if (customerId != null) invalidateChatContextClientCache(customerId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const subtitle =
    chatId != null && String(chatId).trim()
      ? `Chat #${String(chatId).trim()} · ${channelLabel(sourceType)}`
      : channelLabel(sourceType);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 1050,
        }}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal
        aria-labelledby="ecm-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1051,
          width: "min(520px, calc(100vw - 1.5rem))",
          maxHeight: "min(92vh, 720px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 48px rgba(0,0,0,0.55)",
          ...panel,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "1.1rem 1.25rem 0.75rem", flexShrink: 0 }}>
          <div className="d-flex align-items-start justify-content-between gap-2">
            <div>
              <h2
                id="ecm-title"
                style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--mu-ink, #efeadb)" }}
              >
                Editar cliente
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--mu-ink-mute, #6e6f64)" }}>
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              style={{ opacity: 0.55, flexShrink: 0 }}
              aria-label="Cerrar"
              onClick={onClose}
            />
          </div>
        </div>

        <div style={{ padding: "0 1.25rem", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {loadError && (
            <div className="alert alert-danger py-2 small mb-2" role="alert">
              {loadError}
            </div>
          )}
          {loading && !loadError && (
            <div className="text-muted small py-3 d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              Cargando datos del cliente…
            </div>
          )}

          {!loading && !loadError && (
            <form id="ecm-form" onSubmit={(e) => void handleSave(e)}>
              {(error ?? "") !== "" && (
                <div className="alert alert-danger py-2 small mb-3" role="alert">
                  {error}
                </div>
              )}

              <div style={sectionTitle}>Identidad legal</div>

              <div style={{ marginBottom: 14 }}>
                <label htmlFor="ecm-fullname" style={labelStyle}>
                  Nombre o razón social
                </label>
                <input
                  id="ecm-fullname"
                  ref={nameRef}
                  type="text"
                  style={inputStyle}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                  autoComplete="name"
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <span style={labelStyle}>Estado en CRM</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CRM_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCrmStatus(opt.value)}
                      disabled={saving}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 999,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        border:
                          crmStatus === opt.value
                            ? "1px solid var(--mu-accent, #d4ff3a)"
                            : "1px solid var(--mu-line, #2a2c24)",
                        background:
                          crmStatus === opt.value ? "rgba(212, 255, 58, 0.12)" : "var(--mu-panel-2, #1c1e18)",
                        color: crmStatus === opt.value ? "var(--mu-accent, #d4ff3a)" : "var(--mu-ink-dim, #a8a89a)",
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 120px) 1fr", gap: 10, marginBottom: 18 }}>
                <div>
                  <label htmlFor="ecm-id-type" style={labelStyle}>
                    Tipo doc.
                  </label>
                  <select
                    id="ecm-id-type"
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    disabled={saving}
                  >
                    {ID_TYPE_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ecm-id-number" style={labelStyle}>
                    Número de documento
                  </label>
                  <input
                    id="ecm-id-number"
                    type="text"
                    style={inputStyle}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    disabled={saving}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div style={sectionTitle}>Contacto</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label htmlFor="ecm-phone" style={labelStyle}>
                    Teléfono principal
                  </label>
                  <input
                    id="ecm-phone"
                    type="tel"
                    style={inputStyle}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={saving}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="ecm-phone2" style={labelStyle}>
                    Teléfono secundario
                  </label>
                  <input
                    id="ecm-phone2"
                    type="tel"
                    style={inputStyle}
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    disabled={saving}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label htmlFor="ecm-email" style={labelStyle}>
                  Correo electrónico
                </label>
                <input
                  id="ecm-email"
                  type="email"
                  style={inputStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  autoComplete="email"
                />
              </div>
            </form>
          )}
        </div>

        <div
          style={{
            padding: "12px 1.25rem 1rem",
            borderTop: "1px solid var(--mu-line, #2a2c24)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              border: "1px solid var(--mu-line, #2a2c24)",
              background: "transparent",
              color: "var(--mu-ink-dim, #a8a89a)",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="ecm-form"
            disabled={saving || loading || !!loadError || !fullName.trim()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 700,
              border: "none",
              background: "#ff7400",
              color: "#fff",
              cursor: saving || loading || !!loadError ? "not-allowed" : "pointer",
              opacity: saving || loading || !!loadError ? 0.75 : 1,
            }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
