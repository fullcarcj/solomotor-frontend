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
import type { InventoryReport } from "@/types/reportes";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TEAL = "#1D9E75";

export default function InventoryCategoryChart({ data }: { data: InventoryReport | null }) {
  const { labels, values } = useMemo(() => {
    if (!data?.by_category?.length) return { labels: [] as string[], values: [] as number[] };
    const sorted = [...data.by_category].sort((a, b) => b.total_units - a.total_units).slice(0, 10);
    return {
      labels: sorted.map((c) => c.category),
      values: sorted.map((c) => c.total_units),
    };
  }, [data]);

  if (!data) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Unidades por categoría (top 10)</h6></div>
        <div className="card-body placeholder-glow"><div className="placeholder col-12 rounded" style={{ height: 280 }} /></div>
      </div>
    );
  }

  if (!labels.length) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white border-0"><h6 className="mb-0">Unidades por categoría (top 10)</h6></div>
        <div className="card-body text-muted small">Sin categorías con datos</div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white border-0">
        <h6 className="mb-0">Unidades por categoría (top 10)</h6>
      </div>
      <div className="card-body" style={{ height: 360 }}>
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
