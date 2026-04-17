"use client";

import { useEffect, useState } from "react";
import type { FinanceSummary, IgtfDeclaration } from "@/types/finanzas";
import IgtfSummaryCards from "../components/IgtfSummaryCards";
import IgtfDeclarationsTable from "../components/IgtfDeclarationsTable";

export default function FinanzasIgtfPage() {
  const [summary, setSummary]         = useState<FinanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [declarations, setDeclarations]   = useState<IgtfDeclaration[]>([]);
  const [declLoading, setDeclLoading]     = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resumen del mes
    fetch("/api/finanzas/summary?period=month", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setSummary(json.data as FinanceSummary);
      })
      .catch(() => {})
      .finally(() => setSummaryLoading(false));

    // Declaraciones
    fetch("/api/finanzas/igtf/declarations", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data ?? json;
        if (Array.isArray(list)) setDeclarations(list as IgtfDeclaration[]);
      })
      .catch(() => setError("Error al cargar declaraciones IGTF"))
      .finally(() => setDeclLoading(false));

    // Métodos de pago con IGTF
    fetch("/api/finanzas/igtf/payment-methods")
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data ?? json;
        if (Array.isArray(list)) {
          const methods = list
            .filter((m: { applies_igtf?: boolean; name?: string }) => m.applies_igtf)
            .map((m: { name?: string }) => m.name ?? "");
          setPaymentMethods(methods.filter(Boolean));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">

        {/* Título */}
        <div className="mb-4">
          <h1 className="mb-1 custome-heading">IGTF</h1>
          <p className="text-muted small mb-0">
            Impuesto a las Grandes Transacciones Financieras
          </p>
        </div>

        {/* Nota informativa */}
        <div className="alert alert-info d-flex align-items-start gap-2 mb-4" role="alert">
          <i className="ti ti-info-circle fs-18 mt-1" />
          <span>
            El IGTF se calcula automáticamente en las ventas POS para los métodos:{" "}
            <strong>USD cash, Zelle, Binance, Panamá</strong>.
            Tasa actual: <strong>3%</strong>.
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
            <i className="ti ti-alert-circle fs-18" />
            <span>{error}</span>
          </div>
        )}

        {/* Cards de resumen */}
        <IgtfSummaryCards
          summary={summary}
          loading={summaryLoading}
          paymentMethods={paymentMethods}
        />

        {/* Tabla declaraciones */}
        <div className="card">
          <div className="card-header fw-semibold d-flex align-items-center gap-2">
            <i className="ti ti-file-percent text-primary" />
            Declaraciones por período
          </div>
          <div className="card-body p-0">
            <IgtfDeclarationsTable
              declarations={declarations}
              loading={declLoading}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
