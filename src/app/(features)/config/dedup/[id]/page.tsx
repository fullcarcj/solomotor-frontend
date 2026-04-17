"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { all_routes } from "@/data/all_routes";
import type { DedupCandidateDetail } from "@/types/dedup";

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

function CustomerCard({
  title,
  c,
  selected,
  onSelect,
  selectable,
}: {
  title: string;
  c: DedupCandidateDetail["customer_a"];
  selected: boolean;
  onSelect: () => void;
  selectable: boolean;
}) {
  return (
    <div className={`card h-100 ${selected ? "border-primary border-2" : ""}`}>
      <div className="card-header d-flex align-items-center justify-content-between">
        <span className="fw-semibold">{title}</span>
        {selectable && (
          <div className="form-check mb-0">
            <input
              className="form-check-input"
              type="radio"
              name="keep_customer"
              id={`keep-${c.id}`}
              checked={selected}
              onChange={onSelect}
            />
            <label className="form-check-label small" htmlFor={`keep-${c.id}`}>
              Conservar este
            </label>
          </div>
        )}
      </div>
      <div className="card-body">
        <p className="mb-1 fw-medium">{c.full_name}</p>
        <p className="small text-muted mb-0">ID {c.id}</p>
        {c.phone && <p className="small mb-0">Tel. {c.phone}</p>}
        {(c.id_type || c.id_number) && (
          <p className="small mb-0">
            Doc. {c.id_type ?? ""} {c.id_number ?? ""}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConfigDedupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  const [detail, setDetail] = useState<DedupCandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keepId, setKeepId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!/^\d+$/.test(id)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dedup/candidates/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as Record<string, string>)?.error ?? "No encontrado");
        setDetail(null);
        return;
      }
      const d = json as DedupCandidateDetail;
      setDetail(d);
      setKeepId(d.customer_a.id);
    } catch {
      setError("Error de red.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const canAct = detail?.status === "pending";

  async function onApprove() {
    if (!detail || keepId == null) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/dedup/candidates/${detail.id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keep_customer_id: keepId }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(
          (json as Record<string, string>)?.message ??
            (json as Record<string, string>)?.error ??
            `Error HTTP ${res.status}`
        );
        return;
      }
      setMsg("Fusión aplicada correctamente.");
      router.push(all_routes.configDedup);
      router.refresh();
    } catch {
      setMsg("Error de red al aprobar.");
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (!detail) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/dedup/candidates/${detail.id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg((json as Record<string, string>)?.error ?? `Error HTTP ${res.status}`);
        return;
      }
      setMsg("Candidato rechazado.");
      router.push(all_routes.configDedup);
      router.refresh();
    } catch {
      setMsg("Error de red al rechazar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="mb-4">
          <Link href={all_routes.configDedup} className="btn btn-link btn-sm text-decoration-none ps-0">
            ← Volver al listado
          </Link>
        </div>

        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="mb-1 custome-heading">Candidato #{id}</h1>
            <p className="text-muted small mb-0">Revisión de duplicados CRM</p>
          </div>
          {detail && (
            <span className={`badge fs-6 ${statusBadgeClass(detail.status)}`}>{detail.status}</span>
          )}
        </div>

        {loading && <p className="text-muted">Cargando…</p>}
        {error && !loading && <div className="alert alert-danger">{error}</div>}
        {msg && <div className="alert alert-info">{msg}</div>}

        {detail && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <CustomerCard
                  title="Cliente A (menor ID)"
                  c={detail.customer_a}
                  selected={keepId === detail.customer_a.id}
                  onSelect={() => setKeepId(detail.customer_a.id)}
                  selectable={canAct}
                />
              </div>
              <div className="col-md-6">
                <CustomerCard
                  title="Cliente B (mayor ID)"
                  c={detail.customer_b}
                  selected={keepId === detail.customer_b.id}
                  onSelect={() => setKeepId(detail.customer_b.id)}
                  selectable={canAct}
                />
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">Score y reglas</div>
              <div className="card-body">
                <p className="mb-2">
                  <strong>Score total:</strong> {detail.score}
                </p>
                <pre className="bg-light p-3 rounded small mb-0 overflow-auto" style={{ maxHeight: "200px" }}>
                  {JSON.stringify(detail.score_breakdown ?? {}, null, 2)}
                </pre>
              </div>
            </div>

            {detail.merge_log && detail.merge_log.length > 0 && (
              <div className="card mb-4">
                <div className="card-header">Auditoría (fusiones previas del par)</div>
                <div className="card-body">
                  <p className="small text-muted mb-2">
                    Datos de <code>customer_merge_log</code> cuando ya hubo una fusión entre estos IDs.
                  </p>
                  <pre className="bg-light p-3 rounded small overflow-auto" style={{ maxHeight: "320px" }}>
                    {JSON.stringify(detail.merge_log, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {canAct && (
              <div className="d-flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={busy || keepId == null}
                  onClick={() => void onApprove()}
                >
                  {busy ? "Procesando…" : "Fusionar (conservar seleccionado)"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={busy}
                  onClick={() => void onReject()}
                >
                  Rechazar par
                </button>
              </div>
            )}

            {!canAct && (
              <p className="text-muted small">
                Este candidato ya no admite acciones (estado <code>{detail.status}</code>). Solo lectura.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
