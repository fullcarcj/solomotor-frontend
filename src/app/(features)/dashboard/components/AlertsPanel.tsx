"use client";

import type { OverviewAlert } from "@/types/stats";

function alertText(a: OverviewAlert): string {
  switch (a.type) {
    case "unjustified_debits":
      return `⚠ ${a.count} débitos bancarios sin justificar`;
    case "payment_overdue":
      return `⚠ ${a.count} órdenes con pago vencido`;
    case "manual_review":
      return `ℹ ${a.count} conciliaciones requieren revisión manual`;
    default:
      return `${a.type}: ${a.count}`;
  }
}

function alertClass(severity: string): string {
  const s = String(severity).toLowerCase();
  if (s === "high") return "alert alert-danger";
  if (s === "medium") return "alert alert-warning";
  return "alert alert-info";
}

export default function AlertsPanel({ alerts }: { alerts: OverviewAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="mb-4">
      {alerts.map((a, i) => (
        <div key={`${a.type}-${i}`} className={`${alertClass(a.severity)} py-2 mb-2`} role="alert">
          {alertText(a)}
        </div>
      ))}
    </div>
  );
}
