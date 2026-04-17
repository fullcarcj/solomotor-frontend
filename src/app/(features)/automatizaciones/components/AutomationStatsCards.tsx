"use client";
import type { AutomationStats } from "@/types/automatizaciones";

interface CardDef {
  label: string;
  value: number;
}

function Row({ label, cards }: { label: string; cards: CardDef[] }) {
  return (
    <>
      <div className="col-12">
        <p className="text-muted small mb-1 mt-2">{label}</p>
      </div>
      {cards.map((c) => (
        <div key={c.label} className="col-6 col-md-3">
          <div className="card bg-light border-0">
            <div className="card-body py-3">
              <div className="fs-4 fw-bold">{c.value}</div>
              <div className="text-muted small mt-1">{c.label}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function AutomationStatsCards({
  stats,
}: {
  stats: AutomationStats | null;
}) {
  if (!stats) {
    return (
      <div className="row g-2 mb-4 placeholder-glow">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="card bg-light border-0">
              <div className="card-body py-3">
                <div className="placeholder col-6 rounded mb-1" style={{ height: 32 }} />
                <div className="placeholder col-10 rounded" style={{ height: 14 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const todayCards: CardDef[] = [
    { label: "ML hoy",           value: stats.today.ml_messages.total       },
    { label: "WA hoy",           value: stats.today.whatsapp_messages.total },
    { label: "Preguntas IA hoy", value: stats.today.questions_ia.total      },
    { label: "Post-venta hoy",   value: stats.today.post_sale.total         },
  ];

  const monthCards: CardDef[] = [
    { label: "ML mes",           value: stats.month.ml_messages.total       },
    { label: "WA mes",           value: stats.month.whatsapp_messages.total },
    { label: "Preguntas IA mes", value: stats.month.questions_ia.total      },
    { label: "Post-venta mes",   value: stats.month.post_sale.total         },
  ];

  return (
    <div className="row g-2 mb-4">
      <Row label="Hoy"       cards={todayCards} />
      <Row label="Este mes"  cards={monthCards} />
    </div>
  );
}
