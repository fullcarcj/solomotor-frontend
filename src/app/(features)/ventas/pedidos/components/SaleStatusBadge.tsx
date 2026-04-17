"use client";

export default function SaleStatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  if (s === "pending") {
    return <span className="badge bg-warning text-dark">Pendiente</span>;
  }
  if (s === "pending_payment") {
    return <span className="badge bg-warning text-dark">Pago pendiente</span>;
  }
  if (s === "paid") {
    return <span className="badge bg-success">Pagado</span>;
  }
  if (s === "cancelled") {
    return <span className="badge bg-danger">Cancelado</span>;
  }
  if (s === "shipped") {
    return <span className="badge bg-info">Enviado</span>;
  }
  if (s === "completed") {
    return <span className="badge bg-secondary">Completado</span>;
  }
  return (
    <span className="badge bg-light text-dark text-wrap">{status}</span>
  );
}
