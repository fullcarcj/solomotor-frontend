"use client";
import { useEffect, useRef, useState } from "react";
import type { NewSupplierPayload, Supplier } from "@/types/compras";

interface Props {
  supplier:  Supplier | null;
  onClose:   () => void;
  onSuccess: () => void;
}

const CURRENCY_OPTIONS = ["USD", "BS", "ZELLE", "BINANCE", "PANAMA"];

function extractContact(info: Record<string, unknown> | null): { phone: string; email: string; address: string } {
  if (!info) return { phone: "", email: "", address: "" };
  return {
    phone:   typeof info.phone   === "string" ? info.phone   : typeof info.telefono === "string" ? info.telefono : "",
    email:   typeof info.email   === "string" ? info.email   : "",
    address: typeof info.address === "string" ? info.address : typeof info.direccion === "string" ? info.direccion : "",
  };
}

export default function SupplierModal({ supplier, onClose, onSuccess }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEdit = supplier !== null;

  const [name, setName]           = useState("");
  const [country, setCountry]     = useState("Venezuela");
  const [currency, setCurrency]   = useState("USD");
  const [leadTime, setLeadTime]   = useState(0);
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [address, setAddress]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setCountry(supplier.country || "Venezuela");
      setCurrency(supplier.currency ?? "USD");
      setLeadTime(supplier.lead_time_days ?? 0);
      const c = extractContact(supplier.contact_info as Record<string, unknown> | null);
      setPhone(c.phone);
      setEmail(c.email);
      setAddress(c.address);
    } else {
      setName(""); setCountry("Venezuela"); setCurrency("USD");
      setLeadTime(0); setPhone(""); setEmail(""); setAddress("");
    }
    setFormError(null);
  }, [supplier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("El nombre es requerido."); return; }
    setSaving(true);
    setFormError(null);
    const contact_info: Record<string, string> = {};
    if (phone)   contact_info.phone   = phone;
    if (email)   contact_info.email   = email;
    if (address) contact_info.address = address;
    const payload: NewSupplierPayload = {
      name: name.trim(),
      country: country || "Venezuela",
      currency,
      lead_time_days: leadTime,
      ...(Object.keys(contact_info).length > 0 ? { contact_info } : {}),
    };
    try {
      const url = isEdit ? `/api/compras/proveedores/${supplier!.id}` : "/api/compras/proveedores";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        if (res.status === 409) { setFormError("Ya existe un proveedor con ese nombre."); return; }
        throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      }
      onSuccess();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }} onClick={(e) => { if (e.target === modalRef.current) onClose(); }}>
      <div className="modal-dialog modal-lg" ref={modalRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</h5>
            <button className="btn-close" onClick={onClose} disabled={saving} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {formError && <div className="alert alert-danger py-2">{formError}</div>}
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Nombre <span className="text-danger">*</span></label>
                  <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Distribuidora ABC" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">País</label>
                  <input className="form-control" value={country} onChange={e => setCountry(e.target.value)} placeholder="Venezuela" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Moneda de pago</label>
                  <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                    {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Plazo de entrega (días)</label>
                  <input type="number" min={0} className="form-control" value={leadTime} onChange={e => setLeadTime(Number(e.target.value))} />
                </div>
                <div className="col-12"><hr className="my-1" /><p className="text-muted small mb-2">Datos de contacto</p></div>
                <div className="col-md-4">
                  <label className="form-label">Teléfono</label>
                  <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+58 212 000 0000" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="proveedor@email.com" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Dirección</label>
                  <input className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? "Guardar cambios" : "Crear proveedor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
