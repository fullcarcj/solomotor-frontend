"use client";
import { useState } from "react";
import type { CompatResult, Equivalence } from "@/types/wms";
import EquivalenceTable from "../components/EquivalenceTable";
import CompatSearchForm from "../components/CompatSearchForm";
import CompatResultsTable from "../components/CompatResultsTable";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function parseEquivalences(raw: unknown): Equivalence[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.items)) return r.items as Equivalence[];
  if (Array.isArray(r.data))  return r.data  as Equivalence[];
  if (Array.isArray(raw))     return raw      as Equivalence[];
  return [];
}

function parseCompat(raw: unknown): CompatResult[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.items)) return r.items as CompatResult[];
  if (Array.isArray(r.data))  return r.data  as CompatResult[];
  if (Array.isArray(raw))     return raw      as CompatResult[];
  return [];
}

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Error inesperado."; }

/* ── page ─────────────────────────────────────────────────────────────────── */
export default function SkusPage() {
  const [activeTab, setActiveTab] = useState<"equiv" | "compat">("equiv");

  /* ── Equivalencias ──────────────────────────────────────────────────────── */
  const [equivSku, setEquivSku]     = useState("");
  const [equivItems, setEquivItems] = useState<Equivalence[]>([]);
  const [equivLoading, setEquivLoading] = useState(false);
  const [equivError, setEquivError]   = useState<string | null>(null);
  const [searchedSku, setSearchedSku] = useState("");

  async function handleEquivSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!equivSku.trim()) return;
    setEquivLoading(true);
    setEquivError(null);
    try {
      const r = await fetch(`/api/inventario/equivalencias?sku=${encodeURIComponent(equivSku.trim())}`, { credentials: "include" });
      const d = await r.json().catch(() => ({})) as Record<string, unknown>;
      if (!r.ok && r.status !== 404) throw new Error((d.error as string) ?? `HTTP ${r.status}`);
      setEquivItems(parseEquivalences(d));
      setSearchedSku(equivSku.trim());
    } catch (err) {
      setEquivError(errMsg(err));
    } finally {
      setEquivLoading(false);
    }
  }

  /* ── Compatibilidad ─────────────────────────────────────────────────────── */
  const [compatItems, setCompatItems]   = useState<CompatResult[]>([]);
  const [compatLoading, setCompatLoading] = useState(false);
  const [compatError, setCompatError]   = useState<string | null>(null);
  const [searched, setSearched]         = useState(false);

  async function handleCompatSearch(q: { make: string; model: string; year: string; displacement_l: string }) {
    setCompatLoading(true);
    setCompatError(null);
    setSearched(true);
    try {
      const p = new URLSearchParams({ make: q.make, model: q.model, year: q.year });
      if (q.displacement_l) p.set("displacement_l", q.displacement_l);
      p.set("limit", "50");
      const r = await fetch(`/api/inventario/compat?${p}`, { credentials: "include" });
      const d = await r.json().catch(() => ({})) as Record<string, unknown>;
      if (!r.ok && r.status !== 404) throw new Error((d.error as string) ?? `HTTP ${r.status}`);
      setCompatItems(parseCompat(d));
    } catch (err) {
      setCompatError(errMsg(err));
    } finally {
      setCompatLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div>
            <h4 className="page-title">Equivalencias y Compatibilidades</h4>
            <p className="text-muted mb-0">Busca SKUs equivalentes y productos compatibles por vehículo</p>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "equiv" ? "active" : ""}`}
              onClick={() => setActiveTab("equiv")}
            >
              <i className="ti ti-arrows-exchange me-2" />
              Equivalencias por SKU
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "compat" ? "active" : ""}`}
              onClick={() => setActiveTab("compat")}
            >
              <i className="ti ti-car me-2" />
              Compatibilidad por vehículo
            </button>
          </li>
        </ul>

        {/* Tab: Equivalencias */}
        {activeTab === "equiv" && (
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleEquivSearch} className="d-flex gap-2 align-items-end">
                <div className="flex-grow-1" style={{ maxWidth: 320 }}>
                  <label className="form-label fw-semibold">SKU a buscar</label>
                  <input
                    className="form-control"
                    placeholder="Ej. ALT-0041-VZ"
                    value={equivSku}
                    onChange={e => setEquivSku(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={equivLoading}>
                  {equivLoading
                    ? <span className="spinner-border spinner-border-sm me-2" />
                    : <i className="ti ti-search me-2" />}
                  Buscar Equivalencias
                </button>
              </form>

              <EquivalenceTable
                items={equivItems}
                loading={equivLoading}
                error={equivError}
                skuQuery={searchedSku}
              />
            </div>
          </div>
        )}

        {/* Tab: Compatibilidad */}
        {activeTab === "compat" && (
          <div className="card">
            <div className="card-body">
              <CompatSearchForm onSearch={handleCompatSearch} loading={compatLoading} />
              <CompatResultsTable
                items={compatItems}
                loading={compatLoading}
                error={compatError}
                searched={searched}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
