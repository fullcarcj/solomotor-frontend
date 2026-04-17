"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { all_routes } from "@/data/all_routes";
import type { DedupCandidateListItem, DedupCandidatesResponse } from "@/types/dedup";

const LIMIT = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente revisión" },
  { value: "auto_approved", label: "Auto (pendiente fusión)" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending":
      return "bg-warning text-dark";
    case "auto_approved":
      return "bg-info text-dark";
    case "approved":
      return "bg-success";
    case "rejected":
      return "bg-secondary";
    default:
      return "bg-light text-dark";
  }
}

export default function ConfigDedupListPage() {
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DedupCandidatesResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set("limit", String(LIMIT));
      sp.set("offset", String(offset));
      if (status) sp.set("status", status);
      const res = await fetch(`/api/dedup/candidates?${sp.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (json as Record<string, string>)?.error ??
            (json as Record<string, string>)?.message ??
            "Error al cargar candidatos"
        );
        setData(null);
        return;
      }
      setData(json as DedupCandidatesResponse);
    } catch {
      setError("Error de red.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [status, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.total ?? 0;
  const rows: DedupCandidateListItem[] = data?.candidates ?? [];
  const canPrev = offset > 0;
  const canNext = offset + LIMIT < total;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Duplicados CRM</h1>
            <p className="text-muted small mb-0">
              Candidatos detectados por el worker S3 — revisá y fusioná o rechazá pares (permiso configuración).
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => void load()}
            title="Recargar"
          >
            <i className="ti ti-refresh" />
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-body d-flex flex-wrap align-items-end gap-3">
            <div>
              <label className="form-label small text-muted mb-1">Estado</label>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: "220px" }}
                value={status}
                onChange={(e) => {
                  setOffset(0);
                  setStatus(e.target.value);
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ms-auto text-muted small">
              {loading ? "Cargando…" : `${total} registro(s)`}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-4">
            <i className="ti ti-alert-circle fs-18" />
            <span className="flex-fill">{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Cliente A</th>
                <th>Cliente B</th>
                <th>Score</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted text-center py-4">
                    No hay candidatos con los filtros actuales.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-nowrap">{r.id}</td>
                  <td>
                    <div className="fw-medium">{r.customer_a.full_name}</div>
                    <div className="small text-muted">
                      #{r.customer_a.id}
                      {r.customer_a.phone ? ` · ${r.customer_a.phone}` : ""}
                    </div>
                  </td>
                  <td>
                    <div className="fw-medium">{r.customer_b.full_name}</div>
                    <div className="small text-muted">
                      #{r.customer_b.id}
                      {r.customer_b.phone ? ` · ${r.customer_b.phone}` : ""}
                    </div>
                  </td>
                  <td>
                    <span className="fw-semibold">{r.score}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="text-end">
                    <Link href={`${all_routes.configDedup}/${r.id}`} className="btn btn-sm btn-primary">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canPrev || loading}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
          >
            Anterior
          </button>
          <span className="text-muted small">
            {total > 0 ? `Mostrando ${offset + 1}–${Math.min(offset + LIMIT, total)} de ${total}` : ""}
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canNext || loading}
            onClick={() => setOffset((o) => o + LIMIT)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
