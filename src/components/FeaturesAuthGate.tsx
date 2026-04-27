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

  // Siempre validar contra /api/auth/me al entrar a (features). Antes, si Redux ya tenía
  // `token: "cookie"` (p. ej. tras login) se omitía restoreSession: sin cookie real o cookie
  // expirada, el gate dejaba montar la app y /api/bandeja/counts devolvía 401 en bucle.
  useEffect(() => {
    let alive = true;
    (async () => {
      await dispatch(restoreSession());
      if (alive) setChecked(true);
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

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
