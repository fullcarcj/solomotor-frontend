"use client";
import type { ReactNode } from "react";

export interface ColDef<T> {
  header:  string;
  align?:  "start" | "end" | "center";
  render:  (row: T, i: number) => ReactNode;
}

interface Props<T> {
  columns:      ColDef<T>[];
  rows:         T[];
  loading:      boolean;
  keyExtractor: (row: T, i: number) => string | number;
  pagination?:  { total: number; limit: number; offset: number };
  onPageChange: (offset: number) => void;
}

export default function AutomationLogTable<T>({
  columns,
  rows,
  loading,
  keyExtractor,
  pagination,
  onPageChange,
}: Props<T>) {
  const limit  = pagination?.limit  ?? 50;
  const offset = pagination?.offset ?? 0;
  const total  = pagination?.total  ?? rows.length;
  const page   = Math.floor(offset / limit);
  const pages  = Math.max(1, Math.ceil(total / limit));

  const textAlign = (a?: Props<T>["columns"][number]["align"]) =>
    a === "end" ? "text-end" : a === "center" ? "text-center" : "";

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead className="table-light">
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={textAlign(c.align)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.header}>
                        <div className="placeholder-glow">
                          <span className="placeholder col-10 rounded" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center text-muted py-4">
                      Sin registros para los filtros seleccionados
                    </td>
                  </tr>
                )
              : rows.map((row, i) => (
                  <tr key={keyExtractor(row, i)}>
                    {columns.map((c) => (
                      <td key={c.header} className={textAlign(c.align)}>
                        {c.render(row, i)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="d-flex justify-content-between align-items-center px-2 py-2 border-top">
          <small className="text-muted">
            {offset + 1}–{Math.min(offset + limit, total)} de {total} registros
          </small>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange((page - 1) * limit)}>‹</button>
            </li>
            {Array.from({ length: Math.min(7, pages) }, (_, idx) => {
              const start = Math.max(0, Math.min(page - 3, pages - 7));
              const p = start + idx;
              return (
                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                  <button className="page-link" onClick={() => onPageChange(p * limit)}>
                    {p + 1}
                  </button>
                </li>
              );
            })}
            <li className={`page-item ${page >= pages - 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => onPageChange((page + 1) * limit)}>›</button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
