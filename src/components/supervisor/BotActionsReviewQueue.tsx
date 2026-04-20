"use client";

import { useState } from "react";
import { Table, Modal, Input, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import type { BotAction } from "@/types/botActions";
import { useUnreviewedBotActions } from "@/hooks/useSupervisorBotActions";
import { useReviewBotAction } from "@/hooks/useBotActions";
import Swal from "sweetalert2";

/* ── Helpers ──────────────────────────────────────────────────── */

const ACTION_TYPE_LABELS: Record<string, string> = {
  auto_reply:        "Respuesta automática",
  classification:    "Clasificación",
  entity_extraction: "Extracción de entidades",
  intent_detection:  "Detección de intención",
  handoff_decision:  "Decisión de transferencia",
};

function ConfidenceBar({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "#5e6a82" }}>—</span>;
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? "#22c55e" : value >= 0.6 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
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
          Revisar acción #{action?.id}
        </span>
      }
      width={600}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Guardar revisión"
      cancelText="Cancelar"
      confirmLoading={reviewing}
      okButtonProps={{ disabled: isCorrect === null }}
    >
      {action && (
        <>
          <div style={{ marginBottom: 6, fontSize: 12 }}>
            <strong>Chat:</strong>{" "}
            <Link href={`/bandeja?chat_id=${action.chat_id}`} target="_blank">
              #{action.chat_id}
            </Link>
            {"  ·  "}
            <strong>Tipo:</strong> {ACTION_TYPE_LABELS[action.action_type] ?? action.action_type}
          </div>
          <div style={{ marginBottom: 10, fontSize: 11, color: "#9aa4b8" }}>
            Correlation ID: <code>{action.correlation_id ?? "—"}</code>
          </div>

          <pre
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              maxHeight: 220,
              overflow: "auto",
              marginBottom: 16,
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

/* ── Tabla principal ──────────────────────────────────────────── */

export default function BotActionsReviewQueue() {
  const { data, isLoading, total, refetch } = useUnreviewedBotActions({ limit: 20 });
  const [reviewTarget, setReviewTarget] = useState<BotAction | null>(null);

  const columns: ColumnsType<BotAction> = [
    {
      title: "Chat",
      dataIndex: "chat_id",
      width: 90,
      render: (chatId: number) => (
        <Link href={`/bandeja?chat_id=${chatId}`} style={{ fontFamily: "monospace", fontSize: 12 }}>
          #{chatId}
        </Link>
      ),
    },
    {
      title: "Acción",
      dataIndex: "action_type",
      render: (type: string) => (
        <span style={{ fontSize: 12 }}>
          {ACTION_TYPE_LABELS[type] ?? type}
        </span>
      ),
    },
    {
      title: "Confianza",
      dataIndex: "confidence",
      width: 120,
      render: (v: number | null) => <ConfidenceBar value={v} />,
    },
    {
      title: "Duración",
      dataIndex: "duration_ms",
      width: 90,
      render: (ms: number | null) => (
        <span style={{ fontFamily: "monospace", fontSize: 11 }}>
          {ms !== null ? (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`) : "—"}
        </span>
      ),
    },
    {
      title: "Fecha",
      dataIndex: "created_at",
      width: 130,
      render: (iso: string) => (
        <span style={{ fontSize: 11 }}>
          {new Date(iso).toLocaleString("es-VE", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      title: "Acciones",
      width: 100,
      render: (_: unknown, record: BotAction) => (
        <button
          type="button"
          className="sup-review-btn"
          onClick={() => setReviewTarget(record)}
        >
          Revisar
        </button>
      ),
    },
  ];

  return (
    <div className="sup-queue">
      <div className="sup-queue-header">
        <div className="sup-queue-title">
          <i className="ti ti-robot me-2" style={{ color: "#3b82f6" }} />
          Cola de revisión bot
          {/* NEW */}
          <Badge
            count={total}
            style={{ background: "#ef4444", marginLeft: 8, fontSize: 11 }}
            title="Acciones pendientes de revisión"
          />
          <span className="sup-queue-new-tag">NEW</span>
        </div>
        <button type="button" className="bat-refresh-btn" onClick={refetch}>
          <i className="ti ti-refresh" /> Actualizar
        </button>
      </div>

      <Table<BotAction>
        columns={columns}
        dataSource={data}
        loading={isLoading}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: "Sin acciones pendientes de revisión" }}
      />

      <ReviewModal
        action={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onDone={refetch}
      />
    </div>
  );
}
