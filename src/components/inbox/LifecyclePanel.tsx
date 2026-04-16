"use client";

import type { CSSProperties } from "react";
import type { InboxChat, LifecycleStage } from "./inboxTypes";

const STAGES: { key: LifecycleStage; label: string }[] = [
  { key: "contact", label: "Contacto" },
  { key: "ml_answer", label: "Resp. ML" },
  { key: "quote", label: "Cotizar" },
  { key: "order", label: "Orden" },
  { key: "payment", label: "Pago" },
  { key: "dispatch", label: "Despacho" },
  { key: "closed", label: "Cerrado" },
];

function stageIndex(s: LifecycleStage): number {
  return STAGES.findIndex((x) => x.key === s);
}

function pillStyle(chat: InboxChat, stageKey: LifecycleStage): CSSProperties {
  const cur = stageIndex(chat.lifecycle_stage);
  const i = stageIndex(stageKey);
  const base: CSSProperties = {
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
  };
  if (i < cur) {
    return { ...base, background: "#d4edda", color: "#155724" };
  }
  if (i === cur) {
    return { ...base, background: "#FF6B2C", color: "#fff" };
  }
  return { ...base, background: "#e9ecef", color: "#6c757d" };
}

interface Props {
  chat: InboxChat | null;
}

/** Columna 4 — ciclo de vida (etapa derivada de datos del chat / cotización activa en el padre). */
export default function LifecyclePanel({ chat }: Props) {
  if (!chat) {
    return (
      <div className="d-flex flex-column h-100 p-3 text-muted small">
        <p className="mb-0">Seleccione una conversación para ver el ciclo de vida.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100 overflow-auto p-3">
      <h6 className="fw-bold mb-3">Ciclo de vida</h6>
      <div className="d-flex flex-column gap-2 mb-4">
        {STAGES.map(({ key, label }) => (
          <div key={key} style={pillStyle(chat, key)}>
            {label}
          </div>
        ))}
      </div>
      <div className="border-top pt-3 small text-muted">
        <div>
          <strong className="text-dark">Etapa actual:</strong>{" "}
          {STAGES.find((s) => s.key === chat.lifecycle_stage)?.label ?? chat.lifecycle_stage}
        </div>
        {chat.payment_status && (
          <div className="mt-2">
            <strong className="text-dark">Pago:</strong> {chat.payment_status}
          </div>
        )}
      </div>
    </div>
  );
}
