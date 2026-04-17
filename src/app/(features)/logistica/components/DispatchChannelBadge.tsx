const CONFIG: Record<string, { bg: string; label: string }> = {
  mostrador:     { bg: "primary",           label: "Mostrador"     },
  mercadolibre:  { bg: "warning text-dark", label: "ML"            },
  whatsapp:      { bg: "success",           label: "WhatsApp"      },
  social_media:  { bg: "info text-dark",    label: "Redes"         },
  ecommerce:     { bg: "dark",              label: "E-commerce"    },
  fuerza_ventas: { bg: "success",           label: "Fuerza Ventas" },
};

export default function DispatchChannelBadge({ channel }: { channel: string }) {
  const key = (channel ?? "").toLowerCase();
  const cfg = CONFIG[key] ?? { bg: "secondary", label: channel || "—" };
  return <span className={`badge rounded-pill bg-${cfg.bg}`}>{cfg.label}</span>;
}
