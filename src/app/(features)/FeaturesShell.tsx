"use client";

import SmDashboardBodyClass from "./dashboard/SmDashboardBodyClass";

/**
 * Activa `body.sm-dashboard-ref` en todo el árbol autenticado `(features)`:
 * sidebar + top bar al estilo dashboard en todas las rutas del menú.
 * (Solo se monta cuando `FeaturesAuthGate` ya dejó pasar a los hijos.)
 */
export default function FeaturesShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmDashboardBodyClass />
      {children}
    </>
  );
}
