"use client";
import type { PnlPeriod } from "@/hooks/usePnl";
import PeriodSelector from "@/app/(features)/finanzas/utilidad/components/PeriodSelector";

export type ReportPeriod = PnlPeriod;

interface Props {
  value:    ReportPeriod;
  onChange: (p: ReportPeriod) => void;
}

/** Mismo comportamiento que P&L: Hoy / Semana / Mes / Año */
export default function ReportPeriodSelector({ value, onChange }: Props) {
  return <PeriodSelector value={value} onChange={onChange} />;
}
