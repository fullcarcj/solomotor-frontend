"use client";

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function fmtMonth(ym: string): string {
  const parts = ym.split("-");
  if (parts.length < 2) return ym;
  const [year, month] = parts;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-VE", { month: "short", year: "numeric" });
}

function fmtBsShort(v: number): string {
  if (v >= 1_000_000) return `Bs. ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `Bs. ${(v / 1_000).toFixed(1)}K`;
  return `Bs. ${v.toFixed(0)}`;
}

interface Props {
  data: { month: string; revenue_bs: number | string }[];
}

export default function MonthlyChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card h-100">
        <div className="card-header">
          <h6 className="card-title mb-0">Evolución Mensual de Ingresos</h6>
        </div>
        <div className="card-body d-flex align-items-center justify-content-center text-muted">
          Sin datos para el período seleccionado
        </div>
      </div>
    );
  }

  const labels  = data.map((d) => fmtMonth(d.month));
  const values  = data.map((d) => Number(d.revenue_bs) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label:           "Ingresos Bs",
        data:            values,
        backgroundColor: "rgba(249, 115, 22, 0.7)",
        borderColor:     "rgba(249, 115, 22, 1)",
        borderWidth:     1,
        borderRadius:    4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) =>
            `Ingresos: Bs. ${ctx.parsed.y.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
            })}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val: number | string) => fmtBsShort(Number(val)),
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <h6 className="card-title mb-0">Evolución Mensual de Ingresos</h6>
      </div>
      <div className="card-body" style={{ minHeight: 260 }}>
        <Bar data={chartData} options={options as Parameters<typeof Bar>[0]["options"]} />
      </div>
    </div>
  );
}
