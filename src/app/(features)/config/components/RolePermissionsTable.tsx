"use client";
import { Fragment, useCallback, useEffect, useState } from "react";
import type { RolePermissionRow } from "@/types/config";

function parseRows(raw: unknown): RolePermissionRow[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.roles)) return r.roles as RolePermissionRow[];
  if (Array.isArray(r.data)) return r.data as RolePermissionRow[];
  if (Array.isArray(r.permissions)) return r.permissions as RolePermissionRow[];
  if (Array.isArray(raw)) return raw as RolePermissionRow[];
  return [];
}

export default function RolePermissionsTable() {
  const [rows, setRows]       = useState<RolePermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [openId, setOpenId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/role-permissions", { credentials: "include", cache: "no-store" });
      const d: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(((d as Record<string, unknown>).error as string) ?? `HTTP ${res.status}`);
      setRows(parseRows(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="placeholder-glow">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="placeholder col-12 rounded mb-2" style={{ height: 40 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span>{error}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: 36 }} />
            <th>Rol</th>
            <th>Resumen</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={3} className="text-muted text-center py-4">Sin datos de permisos</td></tr>
          ) : rows.map((row, idx) => {
            const key = String(row.role ?? idx);
            const expanded = openId === key;
            const mods = row.modules ?? (Array.isArray(row.module) ? row.module : []);
            const perms = row.permissions;
            const summary = Array.isArray(mods) ? mods.join(", ") : typeof mods === "string" ? mods : "—";
            return (
              <Fragment key={key}>
                <tr className="cursor-pointer" onClick={() => setOpenId(expanded ? null : key)}>
                  <td><i className={`ti ${expanded ? "ti-chevron-down" : "ti-chevron-right"}`} /></td>
                  <td><strong>{String(row.role ?? key)}</strong></td>
                  <td className="small text-muted text-truncate" style={{ maxWidth: 400 }}>{summary}</td>
                </tr>
                {expanded && (
                  <tr>
                    <td />
                    <td colSpan={2}>
                      <pre className="small bg-light border rounded p-2 mb-0" style={{ whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }}>
                        {JSON.stringify(perms ?? row, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
