"use client";
import { useEffect, useState } from "react";
import type { MlQuestion } from "@/types/mercadolibre";
import { useAppSelector } from "@/store/hooks";

interface Props {
  question:  MlQuestion | null;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function MlQuestionAnswerModal({ question, onClose, onSuccess }: Props) {
  const role = useAppSelector(s => s.auth.role ?? "agent");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => { if (question) { setAnswer(""); setError(null); } }, [question]);

  if (!question) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answer.trim().length < 10) { setError("La respuesta debe tener al menos 10 caracteres."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/mercadolibre/questions/${encodeURIComponent(question!.ml_question_id)}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answer_text: answer.trim(), answered_by: role }),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="ti ti-message-reply text-primary" />
              Responder pregunta ML
            </h5>
            <button className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="bg-light rounded p-3 mb-3 border">
                <small className="text-muted d-block mb-1">Pregunta del comprador:</small>
                <p className="mb-1 fw-semibold">{question.question_text}</p>
                {question.item_title && (
                  <small className="text-muted">
                    <i className="ti ti-package me-1" />
                    Producto: {question.item_title}
                    {question.item_price && ` · $${Number(question.item_price).toFixed(2)}`}
                  </small>
                )}
              </div>

              <div>
                <label className="form-label fw-semibold">
                  Respuesta <span className="text-danger">*</span>
                  <small className="fw-normal text-muted ms-2">(mín. 10 caracteres)</small>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Escribe tu respuesta para el comprador…"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  required
                  minLength={10}
                />
                <small className="text-muted">{answer.length} caracteres</small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-send me-2" />}
                Enviar Respuesta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
