import type { PnlPeriod } from "@/hooks/usePnl";

const OPTIONS: { value: PnlPeriod; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week",  label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year",  label: "Año" },
];

interface Props {
  value:    PnlPeriod;
  onChange: (p: PnlPeriod) => void;
}

export default function PeriodSelector({ value, onChange }: Props) {
  return (
    <div className="btn-group" role="group" aria-label="Período">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`btn ${value === opt.value ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
