"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { InboxChat } from "@/types/inbox";

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
}

function parseChats(raw: unknown): InboxChat[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  return Array.isArray(r.chats) ? (r.chats as InboxChat[]) : Array.isArray(r.data) ? (r.data as InboxChat[]) : [];
}

export default function MensajesPage() {
  const [chats, setChats]     = useState<InboxChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bandeja?src=ml_message&limit=5", { credentials: "include" })
      .then(async r => { const d: unknown = await r.json().catch(() => ({})); setChats(parseChats(d)); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div>
            <h4 className="page-title">Mensajería Post-venta ML</h4>
            <p className="text-muted mb-0">Conversaciones post-venta de MercadoLibre</p>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body text-center py-5">
            <i className="ti ti-messages d-block mb-3" style={{ fontSize: "3rem", color: "#F5A623" }} />
            <h5 className="mb-2">Las conversaciones post-venta de MercadoLibre</h5>
            <p className="text-muted mb-4">se gestionan desde Spacework (omnicanal).</p>
            <Link href="/bandeja?src=ml_message" className="btn btn-warning btn-lg d-inline-flex align-items-center gap-2">
              <i className="ti ti-inbox" />
              Ir a Spacework (ML) →
            </Link>
          </div>
        </div>

        {/* Preview */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent">
            <h6 className="card-title mb-0">Últimas 5 conversaciones ML</h6>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="placeholder-glow p-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="placeholder col-12 rounded mb-2" style={{ height: 50 }} />)}
              </div>
            ) : chats.length === 0 ? (
              <p className="text-muted text-center py-4">No hay conversaciones ML post-venta.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {chats.map(c => (
                  <li key={String(c.id)} className="list-group-item d-flex align-items-center gap-3 py-2">
                    <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                         style={{ width: 36, height: 36, fontSize: "0.75rem" }}>
                      {(c.customer_name ?? c.phone).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold small text-truncate">{c.customer_name ?? c.phone}</div>
                      <div className="text-muted small text-truncate">{c.last_message_text ?? "Sin mensajes"}</div>
                    </div>
                    <div className="flex-shrink-0 text-end">
                      <div className="text-muted small">{fmtTime(c.last_message_at)}</div>
                      {Number(c.unread_count) > 0 && (
                        <span className="badge bg-danger rounded-pill">{Number(c.unread_count)}</span>
                      )}
                    </div>
                    <Link href={`/bandeja/${String(c.id)}`} className="btn btn-sm btn-outline-secondary">
                      <i className="ti ti-arrow-right" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
