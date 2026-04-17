"use client";

export default function MlSyncStatusBadge({ status }: { status: string }) {
  if (status === "active")  return <span className="badge bg-success">Activo</span>;
  if (status === "paused")  return <span className="badge bg-warning text-dark">Pausado</span>;
  if (status === "pending") return <span className="badge bg-secondary">Pendiente</span>;
  return <span className="badge bg-light text-dark border">{status}</span>;
}
