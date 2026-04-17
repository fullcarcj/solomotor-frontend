"use client";

import { useEffect, useState } from "react";
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
import type { FinancePeriod } from "@/types/finanzas";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DayData {
  label: string;
  ingresos: number;
  egresos: number;
}

interface Props {
  period: FinancePeriod;
}

export default function CashflowChart({ period }: Props) {
  const [rows, setRows] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/stats/cashflow?period=${period}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data ?? json;
        if (Array.isArray(data)) {
          setRows(
            data.map((d: Record<string, unknown>) => ({
              label: String(d.label ?? d.date ?? d.day ?? ""),
              ingresos: Number(d.ingresos_bs ?? d.ingresos ?? 0),
              egresos: Number(d.egresos_bs ?? d.egresos ?? 0),
            }))
          );
        } else {
          setRows([]);
        }
      })
      .catch(() => setError("Error al cargar datos de cashflow"))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="card h-100">
        <div className="card-header fw-semibold">
          <i className="ti ti-chart-bar me-2" />
          Cashflow del período
        </div>
        <div className="card-body d-flex align-items-center justify-content-center" style={{ minHeight: 260 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card h-100">
        <div className="card-header fw-semibold">
          <i className="ti ti-chart-bar me-2" />
          Cashflow del período
        </div>
        <div className="card-body text-center text-muted py-5">
          <i className="ti ti-alert-circle fs-24 d-block mb-2" />
          {error}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card h-100">
        <div className="card-header fw-semibold">
          <i className="ti ti-chart-bar me-2" />
          Cashflow del período
        </div>
        <div className="card-body text-center text-muted py-5">
          Sin movimientos en este período
        </div>
      </div>
    );
  }

  const chartData = {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        label: "Ingresos Bs",
        data: rows.map((r) => r.ingresos),
        backgroundColor: "rgba(25, 135, 84, 0.7)",
        borderColor: "rgba(25, 135, 84, 1)",
        borderWidth: 1,
      },
      {
        label: "Egresos Bs",
        data: rows.map((r) => r.egresos),
        backgroundColor: "rgba(220, 53, 69, 0.7)",
        borderColor: "rgba(220, 53, 69, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: false },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: number | string) =>
            `Bs. ${Number(v).toLocaleString("es-VE", { maximumFractionDigits: 0 })}`,
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-header fw-semibold">
        <i className="ti ti-chart-bar me-2" />
        Cashflow del período
      </div>
      <div className="card-body" style={{ minHeight: 260 }}>
        <Bar data={chartData} options={options} style={{ height: 240 }} />
      </div>
    </div>
  );
}
