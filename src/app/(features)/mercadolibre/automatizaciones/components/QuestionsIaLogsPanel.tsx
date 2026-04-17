"use client";
import { useCallback, useEffect, useState } from "react";
import type { QuestionIaLog, LogMeta } from "@/types/automatizaciones";
import AutomationLogTable from "@/app/(features)/automatizaciones/components/AutomationLogTable";
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

function trunc(s: string | null, n: number) {
  if (!s) return null;
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function parseResult(json: unknown): { rows: QuestionIaLog[]; meta: LogMeta } {
  if (!json || typeof json !== "object") return { rows: [], meta: { total: 0, limit: LIMIT, offset: 0 } };
  const o = json as Record<string, unknown>;
  const data = (o.data ?? o) as Record<string, unknown>;
  const rows: QuestionIaLog[] = Array.isArray(data.logs) ? (data.logs as QuestionIaLog[]) : Array.isArray(data) ? (data as QuestionIaLog[]) : [];
  const meta: LogMeta = {
    total:  Number(data.total  ?? o.total  ?? rows.length),
    limit:  Number(data.limit  ?? o.limit  ?? LIMIT),
    offset: Number(data.offset ?? o.offset ?? 0),
  };
  return { rows, meta };
}

export default function QuestionsIaLogsPanel() {
  const [status,  setStatus]  = useState("");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [offset,  setOffset]  = useState(0);
  const [rows,    setRows]    = useState<QuestionIaLog[]>([]);
  const [meta,    setMeta]    = useState<LogMeta>({ total: 0, limit: LIMIT, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (status) p.set("status", status);
      if (from)   p.set("from",   from);
      if (to)     p.set("to",     to);
      const res = await fetch(`/api/automatizaciones/logs/questions?${p}`, {
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
  }, [status, from, to, offset]);

  useEffect(() => { void load(); }, [load]);

  const handleClear = () => { setStatus(""); setFrom(""); setTo(""); setOffset(0); };

  const columns = [
    {
      header: "Fecha",
      render: (r: QuestionIaLog) => <span className="text-nowrap small">{fmtDate(r.sent_at)}</span>,
    },
    {
      header: "Item ML",
      render: (r: QuestionIaLog) => r.item_id ?? <span className="text-muted">—</span>,
    },
    {
      header: "Pregunta",
      render: (r: QuestionIaLog) => {
        if (!r.question_text) return <span className="text-muted small">Texto no disponible</span>;
        return (
          <span className="small" title={r.question_text}>
            {trunc(r.question_text, 60)}
          </span>
        );
      },
    },
    {
      header: "Estado",
      render: (r: QuestionIaLog) => <AutomationStatusBadge outcome={r.outcome} />,
    },
    {
      header: "Respuesta IA",
      render: (r: QuestionIaLog) => {
        if (!r.answer_text) return <span className="text-muted">—</span>;
        return (
          <span className="small" title={r.answer_text}>
            {trunc(r.answer_text, 60)}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="row g-2 mb-3 align-items-end">
        <div className="col-auto">
          <label className="form-label small mb-1">Estado</label>
          <select
            className="form-select form-select-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="sent">Enviado</option>
            <option value="failed">Fallido</option>
            <option value="skipped">Omitido</option>
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1">Desde</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label small mb-1">Hasta</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
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
