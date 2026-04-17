const CONFIG: Record<string, { bg: string; label: string }> = {
  pending:        { bg: "warning text-dark", label: "Pendiente"        },
  ready_to_ship:  { bg: "primary",           label: "Listo para enviar"},
  shipped:        { bg: "success",           label: "Despachado"       },
  cancelled:      { bg: "danger",            label: "Cancelado"        },
};

export default function DispatchStatusBadge({ status }: { status: string }) {
  const key = (status ?? "").toLowerCase();
  const cfg = CONFIG[key] ?? { bg: "secondary", label: status || "—" };
  return <span className={`badge bg-${cfg.bg}`}>{cfg.label}</span>;
}
