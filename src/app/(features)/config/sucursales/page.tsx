"use client";
import { useCallback, useEffect, useState } from "react";
import type { Branch } from "@/types/config";
import BranchTable from "../components/BranchTable";
import BranchModal from "../components/BranchModal";

function parseBranches(raw: unknown): Branch[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.branches)) return r.branches as Branch[];
  if (Array.isArray(r.data)) return r.data as Branch[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.rows)) return d.rows as Branch[];
  return [];
}

export default function ConfigSucursalesPage() {
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Branch | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/sucursales", { credentials: "include", cache: "no-store" });
      const d: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(((d as Record<string, unknown>).error as string) ?? `HTTP ${res.status}`);
      setBranches(parseBranches(d));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function askDelete(b: Branch) {
    if (!window.confirm(`¿Eliminar la sucursal "${b.name}"? Esta acción no se puede deshacer.`)) return;
    void (async () => {
      try {
        const res = await fetch(`/api/config/sucursales/${b.id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as Record<string, unknown>;
          throw new Error((err.error as string) ?? `HTTP ${res.status}`);
        }
        void load();
      } catch (e) {
        alert(e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    })();
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="page-title mb-0">Sucursales</h4>
            <p className="text-muted small mb-0">Administrá las ubicaciones operativas</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <i className="ti ti-plus me-1" />Nueva Sucursal
          </button>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <BranchTable
              branches={branches}
              loading={loading}
              error={error}
              onEdit={b => { setEditing(b); setModalOpen(true); }}
              onDelete={askDelete}
            />
          </div>
        </div>
        <BranchModal
          branch={editing}
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSuccess={() => void load()}
        />
      </div>
    </div>
  );
}
