"use client";
import { useCallback, useEffect, useState } from "react";
import type { WaMessageLog, LogMeta } from "@/types/automatizaciones";
import AutomationLogTable from "@/app/(features)/automatizaciones/components/AutomationLogTable";
import AutomationKindBadge from "@/app/(features)/automatizaciones/components/AutomationKindBadge";
import AutomationStatusBadge from "@/app/(features)/automatizaciones/components/AutomationStatusBadge";

const LIMIT = 50;

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit" }) +
      " " + d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function fmtPhone(p: string | null) {
  if (!p) return null;
  const clean = p.replace(/\D/g, "");
  if (clean.length === 11 && clean.startsWith("0")) {
    return `+58 ${clean.slice(1, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`;
  }
  return p;
}

function parseResult(json: unknown): { rows: WaMessageLog[]; meta: LogMeta } {
  if (!json || typeof json !== "object") return { rows: [], meta: { total: 0, limit: LIMIT, offset: 0 } };
  const o = json as Record<string, unknown>;
  const data = (o.data ?? o) as Record<string, unknown>;
  const rows: WaMessageLog[] = Array.isArray(data.logs) ? (data.logs as WaMessageLog[]) : Array.isArray(data) ? (data as WaMessageLog[]) : [];
  const meta: LogMeta = {
    total:  Number(data.total  ?? o.total  ?? rows.length),
    limit:  Number(data.limit  ?? o.limit  ?? LIMIT),
    offset: Number(data.offset ?? o.offset ?? 0),
  };
  return { rows, meta };
}

export default function WaLogsPanel() {
  const [kind,    setKind]    = useState("");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [offset,  setOffset]  = useState(0);
  const [rows,    setRows]    = useState<WaMessageLog[]>([]);
  const [meta,    setMeta]    = useState<LogMeta>({ total: 0, limit: LIMIT, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (kind) p.set("kind", kind);
      if (from) p.set("from", from);
      if (to)   p.set("to",   to);
      const res = await fetch(`/api/automatizaciones/logs/whatsapp?${p}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as Record<string, string>)?.error ?? "Error al cargar logs");
        return;
      }
      const { rows: r, meta: m } = parseResult(json);
      setRows(r);
      setMeta(m);
    } catch {
      setError("Error de red al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [kind, from, to, offset]);

  useEffect(() => { void load(); }, [load]);

  const handleClear = () => { setKind(""); setFrom(""); setTo(""); setOffset(0); };

  const columns = [
    {
      header: "Fecha",
      render: (r: WaMessageLog) => <span className="text-nowrap small">{fmtDate(r.sent_at)}</span>,
    },
    {
      header: "Tipo",
      render: (r: WaMessageLog) => <AutomationKindBadge kind={r.message_kind} />,
    },
    {
      header: "Teléfono",
      render: (r: WaMessageLog) => {
        const formatted = fmtPhone(r.phone_number);
        return formatted ? <span className="small">{formatted}</span> : <span className="text-muted">—</span>;
      },
    },
    {
      header: "Orden ML",
      render: (r: WaMessageLog) => r.ml_order_id ?? <span className="text-muted">—</span>,
    },
    {
      header: "Estado",
      render: (r: WaMessageLog) => <AutomationStatusBadge outcome={r.outcome} />,
    },
    {
      header: "ID Wasender",
      render: (r: WaMessageLog) => {
        if (!r.wasender_message_id) return <span className="text-muted">—</span>;
        const s = r.wasender_message_id;
        return <span className="font-monospace small">{s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s}</span>;
      },
    },
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="row g-2 mb-3 align-items-end">
        <div className="col-auto">
          <label className="form-label small mb-1">Tipo</label>
          <select
            className="form-select form-select-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="E">E — WA imagen</option>
            <option value="F">F — WA pregunta</option>
            <option value="H">H — WA bienvenida</option>
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1">Desde</label>
          <input type="date" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1">Hasta</label>
          <input type="date" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="col-auto d-flex gap-2 align-items-end">
          <button className="btn btn-sm btn-primary" onClick={() => setOffset(0)}>Filtrar</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleClear}>Limpiar</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => void load()} title="Recargar">
            <i className="ti ti-refresh" />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
          <i className="ti ti-alert-circle" />
          <span className="flex-fill">{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Reintentar</button>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <AutomationLogTable
          columns={columns}
          rows={rows}
          loading={loading}
          keyExtractor={(r, i) => `${r.id ?? i}`}
          pagination={meta}
          onPageChange={(off) => setOffset(off)}
        />
      </div>
    </div>
  );
}
