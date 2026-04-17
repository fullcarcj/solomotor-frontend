"use client";

const config: Record<string, { bg: string; label: string }> = {
  mostrador:     { bg: "primary",           label: "Mostrador"      },
  mercadolibre:  { bg: "warning text-dark", label: "MercadoLibre"   },
  social_media:  { bg: "info text-dark",    label: "Redes"          },
  ecommerce:     { bg: "dark",              label: "E-commerce"     },
  fuerza_ventas: { bg: "success",           label: "Fuerza Ventas"  },
};

export default function SaleSourceBadge({ source }: { source: string }) {
  const key = (source ?? "").toLowerCase();
  const { bg, label } = config[key] ?? { bg: "secondary", label: source ?? "—" };
  return <span className={`badge rounded-pill bg-${bg}`}>{label}</span>;
}
