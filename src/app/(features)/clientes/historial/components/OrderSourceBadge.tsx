const CONFIG: Record<string, { bg: string; label: string }> = {
  mercadolibre:  { bg: "warning text-dark", label: "MercadoLibre" },
  mostrador:     { bg: "primary",           label: "Mostrador"    },
};

export default function OrderSourceBadge({ source }: { source: string }) {
  const key = (source ?? "").toLowerCase();
  const cfg = CONFIG[key] ?? { bg: "secondary", label: source || "—" };
  return (
    <span className={`badge rounded-pill bg-${cfg.bg}`}>{cfg.label}</span>
  );
}
