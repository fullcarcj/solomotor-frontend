"use client";
import { useState } from "react";

interface CompatQuery {
  make:          string;
  model:         string;
  year:          string;
  displacement_l: string;
}

interface Props {
  onSearch: (q: CompatQuery) => void;
  loading:  boolean;
}

export default function CompatSearchForm({ onSearch, loading }: Props) {
  const [form, setForm] = useState<CompatQuery>({ make: "", model: "", year: "", displacement_l: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(form);
  }

  function set(field: keyof CompatQuery, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3 align-items-end">
        <div className="col-md-3">
          <label className="form-label fw-semibold">Marca <span className="text-danger">*</span></label>
          <input
            className="form-control"
            placeholder="Ej. Toyota"
            value={form.make}
            onChange={e => set("make", e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold">Modelo <span className="text-danger">*</span></label>
          <input
            className="form-control"
            placeholder="Ej. Corolla"
            value={form.model}
            onChange={e => set("model", e.target.value)}
            required
          />
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold">Año <span className="text-danger">*</span></label>
          <input
            type="number"
            min={1900}
            max={2100}
            className="form-control"
            placeholder="Ej. 2019"
            value={form.year}
            onChange={e => set("year", e.target.value)}
            required
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Cilindrada (L)</label>
          <input
            type="number"
            min={0}
            step="0.1"
            className="form-control"
            placeholder="Ej. 1.6"
            value={form.displacement_l}
            onChange={e => set("displacement_l", e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading
              ? <span className="spinner-border spinner-border-sm me-2" />
              : <i className="ti ti-search me-2" />}
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
