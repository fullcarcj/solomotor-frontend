"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SalesChartDay } from "@/types/reportes";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = {
  mercadolibre: "#EF9F27",
  mostrador:    "#378ADD",
  ecommerce:    "#444441",
  social_media: "#1D9E75",
} as const;

type Ch = keyof typeof COLORS;

function fmtDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default function SalesByChannelChart({ chart }: { chart: SalesChartDay[] }) {
  const { labels, datasets } = useMemo(() => {
    if (!chart.length) return { labels: [] as string[], datasets: [] as { label: string; data: number[]; backgroundColor: string }[] };

    const labels = chart.map((c) => fmtDay(c.date));
    const channels: Ch[] = ["mercadolibre", "mostrador", "ecommerce", "social_media"];

    const active = channels.filter((ch) =>
      chart.some((row) => Number(row[ch]) > 0)
    );

    const datasets = active.map((ch) => ({
      label: ch === "mercadolibre" ? "MercadoLibre" : ch === "mostrador" ? "Mostrador" : ch === "ecommerce" ? "E-commerce" : "Redes",
      data: chart.map((row) => Number(row[ch]) || 0),
      backgroundColor: COLORS[ch],
    }));

    return { labels, datasets };
  }, [chart]);

  if (!chart.length) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Ventas por canal</h6></div>
        <div className="card-body d-flex align-items-center justify-content-center text-muted" style={{ minHeight: 280 }}>
          Sin ventas en este período
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Ventas por canal (Bs.)</h6>
      </div>
      <div className="card-body" style={{ height: 320 }}>
        <Bar
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom" },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.dataset.label}: Bs. ${Number(ctx.parsed.y).toLocaleString("es-VE")}`,
                },
              },
            },
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true },
            },
          }}
        />
      </div>
    </div>
  );
}
