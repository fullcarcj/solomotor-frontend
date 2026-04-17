const CONFIG: Record<string, { bg: string; label: string }> = {
  active:   { bg: "success",          label: "Activo"    },
  lead:     { bg: "info text-dark",   label: "Lead"      },
  inactive: { bg: "secondary",        label: "Inactivo"  },
  blocked:  { bg: "danger",           label: "Bloqueado" },
};

export default function CustomerStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const key = (status ?? "").toLowerCase();
  const cfg = CONFIG[key];

  if (!cfg) {
    return (
      <span className="badge bg-light text-dark border">—</span>
    );
  }

  return <span className={`badge bg-${cfg.bg}`}>{cfg.label}</span>;
}
