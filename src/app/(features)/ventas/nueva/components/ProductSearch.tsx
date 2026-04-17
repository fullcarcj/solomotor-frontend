"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/hooks/useProducts";
import type { CartLine } from "@/types/pos";

function parseProducts(json: unknown): Product[] {
  const o = json as Record<string, unknown>;
  const data = (o.data as Record<string, unknown>) ?? o;
  const raw = data.products;
  if (!Array.isArray(raw)) return [];
  return raw as Product[];
}

function toCartLine(p: Product): CartLine {
  const price = Number(p.unit_price_usd);
  const unit = Number.isFinite(price) ? price : 0;
  return {
    product_sku: p.sku,
    product_name: p.name,
    quantity: 1,
    unit_price_usd: unit,
    subtotal_usd: unit,
  };
}

export default function ProductSearch({
  onAdd,
}: {
  onAdd: (line: CartLine) => void;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [hits, setHits] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
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
          limit: "20",
        });
        const res = await fetch(`/api/inventario/productos?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (!alive) return;
        setHits(parseProducts(json));
      } catch {
        if (alive) setHits([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debounced]);

  return (
    <div className="card mb-3">
      <div className="card-body py-2">
        <label className="form-label small text-muted mb-1">Buscar producto</label>
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="SKU o nombre (mín. 2 caracteres)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        {loading && <div className="small text-muted mt-1">Buscando…</div>}
        {hits.length > 0 && (
          <div className="table-responsive mt-2">
            <table className="table table-sm table-hover mb-0 small">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Stock</th>
                  <th>Precio USD</th>
                </tr>
              </thead>
              <tbody>
                {hits.map((p) => (
                  <tr
                    key={p.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onAdd(toCartLine(p))}
                  >
                    <td className="font-monospace">{p.sku}</td>
                    <td>{p.name}</td>
                    <td className={p.stock_alert ? "text-danger" : undefined}>
                      {p.stock_qty}
                    </td>
                    <td>
                      {p.unit_price_usd != null
                        ? `$${Number(p.unit_price_usd).toFixed(2)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
