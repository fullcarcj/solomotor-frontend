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
import type { ProductReport } from "@/types/reportes";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TEAL = "#1D9E75";

function trunc(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export default function TopProductsChart({ data }: { data: ProductReport | null }) {
  const { labels, values } = useMemo(() => {
    const list = data?.top_products ?? [];
    return {
      labels: list.map((p) => trunc(p.part_name, 30)),
      values: list.map((p) => p.units_sold),
    };
  }, [data]);

  if (!data) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Unidades vendidas</h6></div>
        <div className="card-body placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 320 }} /></div>
      </div>
    );
  }

  if (!labels.length) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Unidades vendidas</h6></div>
        <div className="card-body text-muted small">
          Sin datos para el gráfico. Las líneas de detalle pueden no estar importadas aún.
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Unidades vendidas</h6>
      </div>
      <div className="card-body" style={{ height: Math.max(280, labels.length * 28) }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Unidades",
                data: values,
                backgroundColor: TEAL,
                borderRadius: 4,
              },
            ],
          }}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true },
            },
          }}
        />
      </div>
    </div>
  );
}
