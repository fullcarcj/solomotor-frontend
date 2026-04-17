"use client";
import { useCallback, useEffect, useState } from "react";
import type { Company } from "@/types/config";

function pickCompany(raw: unknown): Company | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const c = (r.company ?? r.data ?? r) as Record<string, unknown>;
  if (typeof c.name !== "string" && typeof (c as Company).id !== "number") return null;
  return {
    id:                Number(c.id ?? 1),
    name:              String(c.name ?? ""),
    rif:               c.rif != null ? String(c.rif) : null,
    address:           c.address != null ? String(c.address) : null,
    phone:             c.phone != null ? String(c.phone) : null,
    email:             c.email != null ? String(c.email) : null,
    logo_url:          c.logo_url != null ? String(c.logo_url) : null,
    city:              c.city != null ? String(c.city) : null,
    country:           c.country != null ? String(c.country) : null,
    fiscal_year_start: c.fiscal_year_start != null ? String(c.fiscal_year_start) : null,
  };
}

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error."; }

export default function CompanyForm({ canEdit }: { canEdit: boolean }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [toast, setToast]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config/empresa", { credentials: "include", cache: "no-store" });
      const d: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (d as Record<string, unknown>).error;
        throw new Error(typeof msg === "string" ? msg : `HTTP ${res.status}`);
      }
      const c = pickCompany(d);
      setCompany(c ?? {
        id: 1, name: "", rif: null, address: null, phone: null, email: null,
        logo_url: null, city: null, country: "Venezuela", fiscal_year_start: null,
      });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!company || !canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config/empresa", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: company.name,
          rif: company.rif,
          address: company.address,
          phone: company.phone,
          email: company.email,
          logo_url: company.logo_url,
          city: company.city,
          country: company.country,
          fiscal_year_start: company.fiscal_year_start,
        }),
      });
      const d: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (d as Record<string, unknown>).error ?? (d as Record<string, unknown>).message;
        throw new Error(typeof msg === "string" ? msg : `HTTP ${res.status}`);
      }
      setToast("Empresa actualizada");
      setTimeout(() => setToast(null), 3500);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body placeholder-glow">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="placeholder col-12 rounded mb-3" style={{ height: 38 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return <div className="alert alert-danger">No se pudo cargar la empresa.</div>;
  }

  const ro = !canEdit;

  return (
    <div className="card border-0 shadow-sm">
      {toast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className="toast show text-bg-success">{toast}</div>
        </div>
      )}
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {!canEdit && (
          <div className="alert alert-info py-2 small">Solo lectura — tu rol no puede editar la configuración de empresa.</div>
        )}

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Nombre de la empresa *</label>
            <input className="form-control" value={company.name} disabled={ro}
              onChange={e => setCompany({ ...company, name: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">RIF *</label>
            <input className="form-control" value={company.rif ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, rif: e.target.value || null })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Dirección</label>
            <input className="form-control" value={company.address ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, address: e.target.value || null })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Ciudad</label>
            <input className="form-control" value={company.city ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, city: e.target.value || null })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Teléfono</label>
            <input className="form-control" value={company.phone ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, phone: e.target.value || null })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={company.email ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, email: e.target.value || null })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">País</label>
            <input className="form-control" value={company.country ?? "Venezuela"} disabled={ro}
              onChange={e => setCompany({ ...company, country: e.target.value || null })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Inicio año fiscal</label>
            <input className="form-control" placeholder="MM-DD" value={company.fiscal_year_start ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, fiscal_year_start: e.target.value || null })} />
          </div>
          <div className="col-12">
            <label className="form-label">Logo — URL de imagen</label>
            <input className="form-control mb-2" value={company.logo_url ?? ""} disabled={ro}
              onChange={e => setCompany({ ...company, logo_url: e.target.value || null })} />
            <small className="text-muted d-block mb-2">URL de imagen (PNG/JPG recomendado)</small>
            {company.logo_url && (
              <img src={company.logo_url} alt="Logo" height={60} className="mb-2 border rounded p-1 bg-light" />
            )}
          </div>
        </div>

        {canEdit && (
          <button type="button" className="btn btn-primary mt-3" disabled={saving} onClick={() => void save()}>
            {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
            Guardar cambios
          </button>
        )}
      </div>
    </div>
  );
}
