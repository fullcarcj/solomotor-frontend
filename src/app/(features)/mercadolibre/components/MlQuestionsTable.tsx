"use client";
import { useState } from "react";
import type { MlQuestion } from "@/types/mercadolibre";

function fmtDate(s: string): string {
  try { return new Date(s).toLocaleString("es-VE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

function SkeletonRow() {
  return <tr>{Array.from({ length: 5 }).map((_, i) => <td key={i}><span className="placeholder col-7 rounded" /></td>)}</tr>;
}

interface Props {
  questions:   MlQuestion[];
  loading:     boolean;
  error:       string | null;
  total:       number;
  limit:       number;
  offset:      number;
  onPageChange:(offset: number) => void;
  onAnswer:    (q: MlQuestion) => void;
}

export default function MlQuestionsTable({ questions, loading, error, total, limit, offset, onPageChange, onAnswer }: Props) {
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [expandedAns, setExpandedAns] = useState<string | null>(null);
  const totalPages  = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  if (error) return <div className="alert alert-danger mt-2">{error}</div>;

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover table-sm align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Pregunta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : questions.length === 0
              ? <tr><td colSpan={5} className="text-center text-muted py-4">No hay preguntas</td></tr>
              : questions.map(q => (
                <>
                  <tr key={q.ml_question_id}>
                    <td className="text-nowrap small">{fmtDate(q.date_created)}</td>
                    <td>
                      <div className="small fw-semibold text-truncate" style={{ maxWidth: 180 }} title={q.item_title ?? q.item_id}>
                        {q.item_title ?? q.item_id}
                      </div>
                      {q.item_price && <small className="text-muted">${Number(q.item_price).toFixed(2)}</small>}
                    </td>
                    <td>
                      <span
                        className="small"
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpandedId(expandedId === q.ml_question_id ? null : q.ml_question_id)}
                      >
                        {expandedId === q.ml_question_id
                          ? q.question_text
                          : q.question_text.slice(0, 100) + (q.question_text.length > 100 ? "…" : "")}
                      </span>
                    </td>
                    <td>
                      {q.ml_status === "ANSWERED"
                        ? <span className="badge bg-success">Respondida</span>
                        : <span className="badge bg-warning text-dark">Pendiente</span>}
                    </td>
                    <td>
                      {q.ml_status === "UNANSWERED"
                        ? (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => onAnswer(q)}>
                            Responder
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setExpandedAns(expandedAns === q.ml_question_id ? null : q.ml_question_id)}
                          >
                            Ver respuesta
                          </button>
                        )}
                    </td>
                  </tr>
                  {q.ml_status === "ANSWERED" && expandedAns === q.ml_question_id && (
                    <tr key={`ans-${q.ml_question_id}`} className="table-success">
                      <td colSpan={5} className="small px-4 py-2">
                        <i className="ti ti-corner-down-right me-2 text-success" />
                        {q.answer_text}
                      </td>
                    </tr>
                  )}
                </>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && total > limit && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-1">
          <small className="text-muted">Mostrando {offset + 1}–{Math.min(offset + limit, total)} de {total}</small>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(0, offset - limit))}>‹ Anterior</button>
            <span className="btn btn-sm btn-light pe-none">{currentPage} / {totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => onPageChange(offset + limit)}>Siguiente ›</button>
          </div>
        </div>
      )}
    </>
  );
}
