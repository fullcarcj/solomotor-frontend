const CONFIG: Record<string, { bg: string; label: string }> = {
  mostrador:    { bg: "primary",           label: "Mostrador" },
  mercadolibre: { bg: "warning text-dark", label: "ML"        },
  cartera:      { bg: "success",           label: "Cartera"   },
  online:       { bg: "dark",              label: "Online"    },
};

export default function CustomerTypeBadge({
  type,
}: {
  type: string | null | undefined;
}) {
  const key = (type ?? "").toLowerCase();
  const cfg = CONFIG[key];
  if (!cfg) return null;

  return (
    <span className={`badge rounded-pill bg-${cfg.bg} me-1`}>
      {cfg.label}
    </span>
  );
}
