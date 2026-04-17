"use client";
import { useEffect, useState } from "react";

export interface CurrentUser {
  id:       number;
  username: string | null;
  role:     string | null;
}

export function useCurrentUser() {
  const [user, setUser]   = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async r => {
        const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        if (!alive) return;
        const u = (d.user as Record<string, unknown>) ?? d;
        const id = Number(u.id);
        setUser({
          id:       Number.isFinite(id) ? id : 0,
          username: typeof u.username === "string" ? u.username : null,
          role:     (typeof u.role === "string" ? u.role : (d.role as string)) ?? null,
        });
      })
      .catch(() => { if (alive) setUser(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { user, loading };
}
