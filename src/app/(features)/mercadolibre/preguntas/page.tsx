"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MlQuestion } from "@/types/mercadolibre";
import MlQuestionsTable from "../components/MlQuestionsTable";
import MlQuestionAnswerModal from "../components/MlQuestionAnswerModal";

const STATUS_OPTIONS = [
  { value: "",            label: "Todas" },
  { value: "UNANSWERED",  label: "Pendientes" },
  { value: "ANSWERED",    label: "Respondidas" },
];

function parseQuestions(raw: unknown): { rows: MlQuestion[]; total: number } {
  if (!raw || typeof raw !== "object") return { rows: [], total: 0 };
  const r = raw as Record<string, unknown>;
  const inner = (r.data as Record<string, unknown>) ?? r;
  const rows: MlQuestion[] = Array.isArray(inner.questions) ? (inner.questions as MlQuestion[])
    : Array.isArray(inner.rows) ? (inner.rows as MlQuestion[])
    : Array.isArray(raw) ? (raw as MlQuestion[]) : [];
  const total = typeof inner.total === "number" ? inner.total : typeof r.total === "number" ? r.total : rows.length;
  return { rows, total };
}

export default function PreguntasPage() {
  const [questions, setQuestions] = useState<MlQuestion[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [status,    setStatus]    = useState("");
  const [search,    setSearch]    = useState("");
  const [offset,    setOffset]    = useState(0);
  const [selected,  setSelected]  = useState<MlQuestion | null>(null);
  const [toastMsg,  setToastMsg]  = useState<string | null>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 50;

  const load = useCallback(async (st: string, q: string, off: number) => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
      if (st) p.set("status", st);
      if (q)  p.set("search", q);
      const r = await fetch(`/api/mercadolibre/questions?${p}`, { credentials: "include" });
      const d: unknown = await r.json().catch(() => ({}));
      if (!r.ok) { const err = (d as Record<string,unknown>).error as string; throw new Error(err ?? `HTTP ${r.status}`); }
      const { rows, total: t } = parseQuestions(d);
      setQuestions(rows); setTotal(t);
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(status, search, offset); }, [status, offset]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchChange(v: string) {
    setSearch(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setOffset(0); void load(status, v, 0); }, 300);
  }

  function showToast(msg: string) { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); }

  return (
    <div className="page-wrapper">
      <div className="content">
        {toastMsg && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
            <div className="toast show align-items-center text-bg-success border-0">
              <div className="d-flex">
                <div className="toast-body"><i className="ti ti-check me-2" />{toastMsg}</div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMsg(null)} />
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h4 className="page-title">Preguntas Pre-venta</h4>
            <p className="text-muted mb-0">{total > 0 ? `${total.toLocaleString()} preguntas en total` : "Cargando…"}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-3">
          <div className="card-body py-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={status} onChange={e => { setStatus(e.target.value); setOffset(0); }}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
                <span className="input-group-text bg-transparent border-end-0"><i className="ti ti-search text-muted" /></span>
                <input type="text" className="form-control border-start-0" placeholder="Buscar en pregunta…" value={search} onChange={e => onSearchChange(e.target.value)} />
              </div>
              {(status || search) && (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStatus(""); setSearch(""); setOffset(0); void load("", "", 0); }}>
                  <i className="ti ti-x me-1" />Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <MlQuestionsTable
              questions={questions} loading={loading} error={error}
              total={total} limit={LIMIT} offset={offset}
              onPageChange={(o) => setOffset(o)}
              onAnswer={setSelected}
            />
          </div>
        </div>

        <MlQuestionAnswerModal
          question={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); showToast("Respondida correctamente"); void load(status, search, offset); }}
        />
      </div>
    </div>
  );
}
