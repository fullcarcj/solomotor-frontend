"use client";
import type { AutomationStats } from "@/types/automatizaciones";

type Configs = AutomationStats["active_configs"];

const LABELS: { key: keyof Configs; label: string }[] = [
  { key: "post_sale",    label: "Post-venta"     },
  { key: "tipo_e",       label: "Tipo E"         },
  { key: "tipo_f",       label: "Tipo F"         },
  { key: "questions_ia", label: "Preguntas IA"   },
  { key: "ai_responder", label: "AI Responder"   },
];

export default function ActiveConfigsBadges({
  configs,
}: {
  configs: Configs | null | undefined;
}) {
  return (
    <div className="d-flex flex-wrap gap-2 mb-4">
      {LABELS.map(({ key, label }) => {
        const active = configs ? configs[key] : false;
        return (
          <span
            key={key}
            className={`badge rounded-pill d-flex align-items-center gap-1 ${
              active ? "bg-success" : "bg-secondary"
            }`}
          >
            <span style={{ fontSize: 10 }}>{active ? "●" : "○"}</span>
            {label}
          </span>
        );
      })}
    </div>
  );
}
