"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { all_routes } from "@/data/all_routes";
import type { DedupMergeLogResponse, MergeLogEntry } from "@/types/dedup";

const LIMIT = 20;

const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "auto_worker", label: "Automático" },
  { value: "api_approved", label: "Aprobado" },
  { value: "manual", label: "Manual" },
];

const SNAPSHOT_FIELDS: { key: string; label: string }[] = [
  { key: "full_name", label: "Nombre completo" },
  { key: "id_type", label: "Tipo ID" },
  { key: "id_number", label: "Nº documento" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Correo" },
  { key: "company_id", label: "Empresa (ID)" },
  { key: "created_at", label: "Creado" },
];

function formatMergedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSnapshotCell(fieldKey: string, raw: unknown): string {
  if (raw == null || raw === "") return "—";
  if (fieldKey === "created_at" && typeof raw === "string") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return String(raw);
}

function asRecord(u: unknown): Record<string, unknown> | null {
  if (u && typeof u === "object" && !Array.isArray(u)) return u as Record<string, unknown>;
  return null;
}

function snapshotTable(title: string, snap: Record<string, unknown> | null) {
  return (
    <div>
      <h6 className="small fw-semibold text-muted mb-2">{title}</h6>
      <table className="table table-sm table-bordered mb-0 bg-white">
        <thead className="table-light">
          <tr>
            <th className="small">Campo</th>
            <th className="small">Valor</th>
          </tr>
        </thead>
        <tbody>
          {SNAPSHOT_FIELDS.map(({ key, label }) => {
            const raw = snap && typeof snap === "object" && key in snap ? (snap as Record<string, unknown>)[key] : undefined;
            return (
              <tr key={key}>
                <td className="small text-muted">{label}</td>
                <td className="small">{formatSnapshotCell(key, raw)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function triggerBadge(triggeredBy: string): { className: string; label: string } {
  switch (triggeredBy) {
    case "auto_worker":
      return { className: "bg-info text-dark", label: "Automático" };
    case "api_approved":
      return { className: "bg-success", label: "Aprobado" };
    case "manual":
      return { className: "bg-secondary", label: "Manual" };
    default:
      return { className: "bg-light text-dark", label: triggeredBy || "—" };
  }
}

function rowKey(row: MergeLogEntry, index: number): string {
  return `${row.merged_at}-${row.kept_id}-${row.dropped_id}-${index}`;
}

function rowsAffectedList(rowsAffected: Record<string, number> | null): ReactNode {
  if (!rowsAffected || typeof rowsAffected !== "object") {
    return <span className="text-muted">Sin filas reasignadas</span>;
  }
  const entries = Object.entries(rowsAffected).filter(([, n]) => typeof n === "number" && n > 0);
  if (entries.length === 0) {
    return <span className="text-muted">Sin filas reasignadas</span>;
  }
  return (
    <ul className="mb-0 ps-3 small">
      {entries.map(([k, v]) => (
        <li key={k}>
          {k}: {v} filas
        </li>
      ))}
    </ul>
  );
}

export default function ConfigDedupHistorialPage() {
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DedupMergeLogResponse | null>(null);

  const [draftTrigger, setDraftTrigger] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const [appliedTrigger, setAppliedTrigger] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set("limit", String(LIMIT));
      sp.set("offset", String(offset));
      if (appliedFrom) sp.set("from", appliedFrom);
      if (appliedTo) sp.set("to", appliedTo);
      if (appliedTrigger) sp.set("triggered_by", appliedTrigger);

      const res = await fetch(`/api/dedup/merge-log?${sp.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (json as Record<string, string>)?.error ??
            (json as Record<string, string>)?.message ??
            "Error al cargar historial"
        );
        setData(null);
        return;
      }
      setData(json as DedupMergeLogResponse);
    } catch {
      setError("Error de red.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [offset, appliedTrigger, appliedFrom, appliedTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.total ?? 0;
  const rows: MergeLogEntry[] = data?.log ?? [];
  const canPrev = offset > 0;
  const canNext = offset + LIMIT < total;

  const applyFilters = () => {
    setAppliedTrigger(draftTrigger);
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setOffset(0);
    setExpandedKey(null);
  };

  const clearFilters = () => {
    setDraftTrigger("");
    setDraftFrom("");
    setDraftTo("");
    setAppliedTrigger("");
    setAppliedFrom("");
    setAppliedTo("");
    setOffset(0);
    setExpandedKey(null);
  };

  const start = total === 0 ? 0 : offset + 1;
  const end = total === 0 ? 0 : Math.min(offset + LIMIT, total);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Historial de fusiones</h1>
            <p className="text-muted small mb-0">
              Auditoría de fusiones CRM: trigger, score y snapshots antes del merge (worker S3 y aprobaciones).
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Link href={all_routes.configDedup} className="btn btn-sm btn-outline-primary">
              ← Volver a duplicados
            </Link>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void load()} title="Recargar">
              <i className="ti ti-refresh" />
            </button>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body d-flex flex-wrap align-items-end gap-3">
            <div>
              <label className="form-label small text-muted mb-1">Trigger</label>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: "200px" }}
                value={draftTrigger}
                onChange={(e) => setDraftTrigger(e.target.value)}
              >
                {TRIGGER_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label small text-muted mb-1">Desde</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label small text-muted mb-1">Hasta</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters} disabled={loading}>
                Aplicar filtros
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters} disabled={loading}>
                Limpiar
              </button>
            </div>
            <div className="ms-auto text-muted small">{loading ? "Cargando…" : `${total} fusión(es)`}</div>
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
                <th>Fecha</th>
                <th>Cliente conservado</th>
                <th>Cliente eliminado</th>
                <th>Trigger</th>
                <th>Score</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {!loading && total === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted text-center py-4">
                    Sin fusiones registradas en este período
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => {
                const k = rowKey(row, idx);
                const open = expandedKey === k;
                const badge = triggerBadge(row.triggered_by);
                const keptDisplay =
                  row.kept_name != null && String(row.kept_name).trim() !== "" ? (
                    <span className="fw-medium">{row.kept_name}</span>
                  ) : (
                    <span className="text-muted">ID {row.kept_id}</span>
                  );

                return (
                  <Fragment key={k}>
                    <tr>
                      <td className="text-nowrap small">{formatMergedAt(row.merged_at)}</td>
                      <td>{keptDisplay}</td>
                      <td>
                        <span className="text-muted">ID {row.dropped_id}</span>
                      </td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td>{row.score != null ? <span className="fw-semibold">{row.score}</span> : "—"}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setExpandedKey(open ? null : k)}
                        >
                          Ver log
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="table-light">
                        <td colSpan={6} className="p-4">
                          <div className="row g-4">
                            <div className="col-md-6">{snapshotTable("Antes (conservado)", asRecord(row.snapshot_kept))}</div>
                            <div className="col-md-6">{snapshotTable("Antes (eliminado)", asRecord(row.snapshot_dropped))}</div>
                          </div>
                          <div className="mt-4">
                            <h6 className="small fw-semibold text-muted mb-2">Registros reasignados</h6>
                            {rowsAffectedList(row.rows_affected)}
                          </div>
                          <div className="mt-3">
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setExpandedKey(null)}>
                              Cerrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canPrev || loading}
            onClick={() => {
              setExpandedKey(null);
              setOffset((o) => Math.max(0, o - LIMIT));
            }}
          >
            Anterior
          </button>
          <span className="text-muted small">
            {total > 0 ? `Mostrando ${start}–${end} de ${total} fusiones` : ""}
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={!canNext || loading}
            onClick={() => {
              setExpandedKey(null);
              setOffset((o) => o + LIMIT);
            }}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
