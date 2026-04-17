"use client";

export default function QuotationStatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  if (s === "draft") {
    return <span className="badge bg-secondary">Borrador</span>;
  }
  if (s === "sent") {
    return <span className="badge bg-primary">Enviada</span>;
  }
  return (
    <span className="badge bg-light text-dark text-wrap text-start">
      {status}
    </span>
  );
}
