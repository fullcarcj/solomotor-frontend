"use client";

import { useEffect, useState } from "react";

interface CustomerRow {
  id:         number;
  full_name:  string | null;
  phone:      string | null;
  document_id?: string | null;
}

interface Props {
  open:      boolean;
  chatId:    string;
  onClose:   () => void;
  onSuccess: () => void;
}

type Phase = "idle" | "searching" | "ready" | "linking" | "error";

export default function LinkCustomerModal({ open, chatId, onClose, onSuccess }: Props) {
  const [q, setQ]               = useState("");
  const [deb, setDeb]           = useState("");
  const [rows, setRows]         = useState<CustomerRow[]>([]);
  const [phase, setPhase]       = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sel, setSel]           = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDeb(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    if (deb.length < 2) {
      setRows([]);
      setPhase("idle");
      return;
    }
    let cancelled = false;
    setPhase("searching");
    setErrorMsg(null);
    (async () => {
      try {
        const params = new URLSearchParams({ search: deb, limit: "30", offset: "0" });
        const res = await fetch(`/api/clientes/directorio?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as { data?: CustomerRow[] };
        if (!res.ok) throw new Error("No se pudo buscar clientes");
        if (!cancelled) {
          setRows(Array.isArray(json.data) ? json.data : []);
          setPhase("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : "Error de búsqueda");
          setPhase("error");
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deb, open]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setDeb("");
      setRows([]);
      setSel(null);
      setPhase("idle");
      setErrorMsg(null);
    }
  }, [open]);

  async function handleLink() {
    if (sel == null || phase === "linking") return;
    setPhase("linking");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/inbox/${encodeURIComponent(chatId)}/link-customer`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link_type: "manual", customer_id: sel }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(j.message ?? j.error ?? `Error ${res.status}`);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo vincular");
      setPhase("error");
    }
  }

  if (!open) return null;

  const isLinking = phase === "linking";

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
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Vincular cliente"
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
        onClick={(e) => e.stopPropagation()}
      >
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
                <i className="ti ti-user-plus" style={{ fontSize: 14, color: "#fff" }} />
              </span>
              Vincular Cliente
            </h6>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--mu-ink-mute, #999)" }}>
              Busca en el directorio y confirma el vínculo con este chat.
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

        <input
          type="text"
          className="form-control form-control-sm mb-2"
          placeholder="Nombre, teléfono o documento…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />

        {errorMsg && phase === "error" && (
          <div className="alert alert-danger py-1 px-2 small mb-2" role="alert">
            {errorMsg}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem", minHeight: 120 }}>
          {phase === "searching" && (
            <div className="text-muted small py-3 text-center">Buscando…</div>
          )}
          {phase !== "searching" && deb.length >= 2 && rows.length === 0 && (
            <div className="text-muted small py-3 text-center">Sin resultados</div>
          )}
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSel(r.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                marginBottom: 6,
                borderRadius: 8,
                border: sel === r.id ? "2px solid #ff7400" : "1px solid var(--mu-border, rgba(255,255,255,0.12))",
                background: sel === r.id ? "rgba(255,116,0,0.08)" : "var(--mu-panel-2, #252b35)",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.full_name ?? `Cliente #${r.id}`}</div>
              <div style={{ fontSize: 11, color: "var(--mu-ink-mute)", marginTop: 2 }}>
                {r.phone ?? "—"}
                {r.document_id ? ` · ${r.document_id}` : ""}
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={isLinking}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#ff7400", color: "#fff", fontWeight: 700 }}
            disabled={sel == null || isLinking}
            onClick={() => void handleLink()}
          >
            {isLinking ? "Vinculando…" : "Vincular"}
          </button>
        </div>
      </div>
    </>
  );
}
