"use client";

import { useState } from "react";
import { Timeline, Modal, Input } from "antd";
import type { BotAction } from "@/types/botActions";
import { useBotActions, useReviewBotAction } from "@/hooks/useBotActions";
import Swal from "sweetalert2";

/* ── Helpers ──────────────────────────────────────────────────── */

const ACTION_TYPE_LABELS: Record<string, string> = {
  auto_reply:        "Respuesta automática",
  classification:    "Clasificación",
  entity_extraction: "Extracción de entidades",
  intent_detection:  "Detección de intención",
  handoff_decision:  "Decisión de transferencia",
};

const ACTION_TYPE_ICONS: Record<string, string> = {
  auto_reply:        "ti-message-2",
  classification:    "ti-tag",
  entity_extraction: "ti-scan",
  intent_detection:  "ti-brain",
  handoff_decision:  "ti-transfer",
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  auto_reply:        "#3b82f6",
  classification:    "#8b5cf6",
  entity_extraction: "#06b6d4",
  intent_detection:  "#f59e0b",
  handoff_decision:  "#f97316",
};

function fmtMs(ms: number | null): string {
  if (ms === null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function ConfidenceBar({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "#5e6a82", fontSize: 11 }}>—</span>;
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? "#22c55e" : value >= 0.6 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          height: 4,
          width: 80,
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: "monospace" }}>{pct}%</span>
    </div>
  );
}

/* ── Modal de revisión ────────────────────────────────────────── */

interface ReviewModalProps {
  action: BotAction | null;
  onClose: () => void;
  onDone: () => void;
}

function ReviewModal({ action, onClose, onDone }: ReviewModalProps) {
  const { reviewing, review } = useReviewBotAction();
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!action || isCorrect === null) return;
    await review(action.id, { is_correct: isCorrect, review_notes: notes || undefined });
    onDone();
    onClose();
    void Swal.fire({
      icon: "success",
      title: "Revisión guardada",
      timer: 1600,
      showConfirmButton: false,
      background: "var(--mu-panel, #1a1f2e)",
      color: "var(--mu-ink, #e2e8f0)",
    });
  };

  return (
    <Modal
      open={!!action}
      title={
        <span>
          <i className="ti ti-pencil-check" style={{ marginRight: 8, color: "#3b82f6" }} />
          Revisar acción del bot
        </span>
      }
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Guardar revisión"
      cancelText="Cancelar"
      confirmLoading={reviewing}
      okButtonProps={{ disabled: isCorrect === null }}
    >
      {action && (
        <>
          <div style={{ marginBottom: 12, fontSize: 12 }}>
            <strong>Tipo:</strong> {ACTION_TYPE_LABELS[action.action_type] ?? action.action_type}
          </div>
          <pre
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              maxHeight: 180,
              overflow: "auto",
              marginBottom: 14,
              color: "#c9d1d9",
            }}
          >
            {JSON.stringify(action.payload, null, 2)}
          </pre>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={`bat-review-btn${isCorrect === true ? " bat-review-btn--active-ok" : ""}`}
              onClick={() => setIsCorrect(true)}
            >
              <i className="ti ti-check" /> Correcto
            </button>
            <button
              type="button"
              className={`bat-review-btn${isCorrect === false ? " bat-review-btn--active-err" : ""}`}
              onClick={() => setIsCorrect(false)}
            >
              <i className="ti ti-x" /> Incorrecto
            </button>
          </div>

          <Input.TextArea
            rows={3}
            placeholder="Notas de revisión (opcional)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            showCount
          />
        </>
      )}
    </Modal>
  );
}

/* ── Componente principal ─────────────────────────────────────── */

interface Props {
  chatId: number | string;
}

export default function BotActionsTimeline({ chatId }: Props) {
  const { data, isLoading, error, refetch } = useBotActions(chatId);
  const [reviewTarget, setReviewTarget] = useState<BotAction | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: "16px 0" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mu-skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 10 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "#ef4444", fontSize: 12, padding: 12 }}>
        <i className="ti ti-alert-circle me-2" />
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#5e6a82", fontSize: 12 }}>
        <i className="ti ti-robot" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
        Sin acciones del bot en este chat.
      </div>
    );
  }

  const items = data.map((action) => {
    const label = ACTION_TYPE_LABELS[action.action_type] ?? action.action_type;
    const icon = ACTION_TYPE_ICONS[action.action_type] ?? "ti-bolt";
    const color = ACTION_TYPE_COLORS[action.action_type] ?? "#9aa4b8";
    const isWrong = action.is_reviewed && action.is_correct === false;

    return {
      dot: (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `${color}22`,
            border: `1.5px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: 14, color }} />
        </div>
      ),
      children: (
        <div
          className={`bat-item${isWrong ? " bat-item--wrong" : ""}`}
          style={{ marginBottom: 4 }}
        >
          <div className="bat-item-header">
            <span className="bat-item-label">{label}</span>
            <span className="bat-item-time">
              {new Date(action.created_at).toLocaleTimeString("es-VE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="bat-item-meta">
            <span>Duración: <strong>{fmtMs(action.duration_ms)}</strong></span>
            {action.confidence !== null && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Confianza: <ConfidenceBar value={action.confidence} />
              </span>
            )}
          </div>

          {action.is_reviewed ? (
            <div
              className={`bat-item-review ${action.is_correct ? "bat-item-review--ok" : "bat-item-review--err"}`}
            >
              {action.is_correct ? (
                <span><i className="ti ti-check" /> Revisado: correcto</span>
              ) : (
                <span><i className="ti ti-x" /> Revisado: incorrecto</span>
              )}
              {action.review_notes && (
                <p className="bat-item-notes">{action.review_notes}</p>
              )}
            </div>
          ) : (
            <div className="bat-item-pending">
              <span className="bat-item-pending-label">Pendiente de revisión</span>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button
                  type="button"
                  className="bat-mini-btn bat-mini-btn--ok"
                  onClick={() => setReviewTarget(action)}
                >
                  <i className="ti ti-check" /> Correcto
                </button>
                <button
                  type="button"
                  className="bat-mini-btn bat-mini-btn--err"
                  onClick={() => setReviewTarget(action)}
                >
                  <i className="ti ti-x" /> Incorrecto
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <>
      <div className="bat-header">
        <span className="bat-header-title">
          <i className="ti ti-robot me-2" style={{ color: "#3b82f6" }} />
          Timeline del bot
        </span>
        <button type="button" className="bat-refresh-btn" onClick={refetch} title="Actualizar">
          <i className="ti ti-refresh" />
          Actualizar
        </button>
      </div>

      <Timeline items={items} style={{ paddingTop: 8 }} />

      <ReviewModal
        action={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onDone={refetch}
      />
    </>
  );
}
