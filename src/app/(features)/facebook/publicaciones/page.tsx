"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FbPost {
  id: string;
  message: string | null;
  created_time: string;
  permalink_url: string | null;
  picture: string | null;
  likes: number;
  comments: number;
  shares: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Hace menos de 1 h";
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d > 1 ? "s" : ""}`;
}

export default function FacebookPublicacionesPage() {
  const [posts, setPosts]     = useState<FbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetch("/api/facebook/posts?limit=15", { credentials: "include" })
      .then(async r => {
        const d = await r.json().catch(() => ({})) as { posts?: FbPost[]; connected?: boolean; error?: string };
        setConnected(d.connected !== false);
        if (!d.connected) { setError(d.error ?? "Sin conexión con Facebook."); return; }
        setPosts(d.posts ?? []);
      })
      .catch(() => setError("Error de red."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex align-items-center gap-2 mb-4">
          <Link href="/facebook" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left" />
          </Link>
          <div>
            <h4 className="mb-0">Publicaciones de la página</h4>
            <p className="text-muted small mb-0">Últimas publicaciones desde la Fan Page de Facebook</p>
          </div>
        </div>

        {loading && (
          <div className="placeholder-glow">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="placeholder col-12 rounded mb-3" style={{ height: 72 }} />
            ))}
          </div>
        )}

        {!loading && !connected && (
          <div className="alert alert-warning">
            <i className="ti ti-plug-x me-2" />
            {error ?? "Facebook no está conectado. Configura el token en la sección Configuración."}
          </div>
        )}

        {!loading && connected && posts.length === 0 && (
          <div className="alert alert-info">No se encontraron publicaciones recientes.</div>
        )}

        {!loading && connected && posts.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Publicación</th>
                      <th className="text-center" style={{ width: 80 }}>👍</th>
                      <th className="text-center" style={{ width: 80 }}>💬</th>
                      <th className="text-center" style={{ width: 80 }}>↗</th>
                      <th style={{ width: 130 }}>Fecha</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="d-flex align-items-start gap-2">
                            {p.picture && (
                              <img src={p.picture} alt="" className="rounded flex-shrink-0"
                                style={{ width: 44, height: 44, objectFit: "cover" }} />
                            )}
                            <span className="small text-truncate d-block" style={{ maxWidth: 380 }}>
                              {p.message ?? <span className="text-muted fst-italic">Sin texto</span>}
                            </span>
                          </div>
                        </td>
                        <td className="text-center small">{p.likes.toLocaleString()}</td>
                        <td className="text-center small">{p.comments.toLocaleString()}</td>
                        <td className="text-center small">{p.shares.toLocaleString()}</td>
                        <td className="text-muted small">{timeAgo(p.created_time)}</td>
                        <td>
                          {p.permalink_url && (
                            <a href={p.permalink_url} target="_blank" rel="noopener noreferrer"
                              className="btn btn-xs btn-outline-secondary">
                              <i className="ti ti-external-link" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
