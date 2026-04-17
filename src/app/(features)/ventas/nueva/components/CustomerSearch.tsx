"use client";

import { useEffect, useState } from "react";
import { pickClienteRows } from "@/types/quotations";

type Opt = { id: number; label: string };

function parseClientes(json: unknown): Opt[] {
  return pickClienteRows(json)
    .map((r) => {
      const id = Number(r.id);
      const label = String(
        r.nombre ?? r.name ?? r.razon_social ?? r.razonSocial ?? ""
      ).trim();
      return { id, label: label || `Cliente #${id}` };
    })
    .filter((c) => Number.isFinite(c.id) && c.id > 0);
}

export default function CustomerSearch({
  onSelect,
}: {
  onSelect: (id: number | null, name: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [hits, setHits] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Opt | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (selected) return;
    if (debounced.trim().length < 2) {
      setHits([]);
      return;
    }
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const params = new URLSearchParams({
          search: debounced.trim(),
          limit: "10",
        });
        const res = await fetch(`/api/clientes/directorio?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (!alive) return;
        setHits(parseClientes(json));
      } catch {
        if (alive) setHits([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debounced, selected]);

  const clear = () => {
    setSelected(null);
    setQ("");
    setHits([]);
    onSelect(null, null);
  };

  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <label className="form-label small text-muted mb-1">Cliente (opcional)</label>
        {selected ? (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-primary">Cliente seleccionado</span>
            <span>{selected.label}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              aria-label="Quitar cliente"
              onClick={clear}
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Buscar cliente…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            {loading && (
              <div className="small text-muted mt-1">Buscando…</div>
            )}
            {hits.length > 0 && (
              <ul className="list-group list-group-flush border rounded mt-2 small">
                {hits.map((h) => (
                  <li key={h.id} className="list-group-item list-group-item-action py-2">
                    <button
                      type="button"
                      className="btn btn-link text-start text-decoration-none p-0 w-100"
                      onClick={() => {
                        setSelected(h);
                        setHits([]);
                        setQ("");
                        onSelect(h.id, h.label);
                      }}
                    >
                      {h.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
