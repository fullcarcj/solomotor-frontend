"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { restoreSession } from "@/store/authSlice";
import { all_routes } from "@/data/all_routes";

/**
 * Rutas (features): hidrata sesión con GET /api/auth/me (cookie HttpOnly)
 * antes de redirigir a /signin.
 */
export default function FeaturesAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const restoring = useAppSelector((s) => s.auth.restoring);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (token) {
        setChecked(true);
        return;
      }
      await dispatch(restoreSession());
      if (alive) setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [dispatch, token]);

  useEffect(() => {
    if (!checked) return;
    if (!token) {
      router.replace(all_routes.signin);
    }
  }, [checked, token, router]);

  if (!checked || restoring) {
    return (
      <div className="d-flex align-items-center justify-content-center p-5 min-vh-50 text-muted small">
        Cargando sesión…
      </div>
    );
  }
  if (!token) return null;
  return <>{children}</>;
}
