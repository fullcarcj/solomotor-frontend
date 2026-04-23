"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Clase en `body` para aplicar el shell oscuro (sidebar + header). */
const SM_DASHBOARD_BODY_CLASS = "sm-dashboard-ref";

type Props = {
  /**
   * Si se omite o está vacío: la clase se aplica mientras el layout esté montado
   * (caso `src/app/(features)/dashboard/layout.tsx` → solo `/dashboard`).
   * Si se define: solo en esas rutas (p. ej. `/sales-dashboard`).
   */
  paths?: readonly string[];
};

function pathMatches(list: readonly string[], pathname: string | null): boolean {
  if (!pathname) return false;
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Theme Customizer aplica fondo en línea al ul / sidebar; debe quitarse al activar shell oscuro. */
function clearCustomizerInlineOverlays(): void {
  document.querySelector<HTMLElement>(".nav.user-menu")?.style.removeProperty("background-color");
  document.querySelector<HTMLElement>(".nav.user-menu")?.style.removeProperty("background");
  document.querySelector<HTMLElement>(".sidebar")?.style.removeProperty("background-color");
  document.querySelector<HTMLElement>(".sidebar")?.style.removeProperty("background");
}

export default function SmDashboardBodyClass({ paths }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const activate = () => {
      document.body.classList.add(SM_DASHBOARD_BODY_CLASS);
      /* ThemeSettings suele montar antes que este layout y pintar el ul en blanco. */
      queueMicrotask(() => clearCustomizerInlineOverlays());
    };

    if (!paths?.length) {
      activate();
      return () => {
        document.body.classList.remove(SM_DASHBOARD_BODY_CLASS);
      };
    }

    if (pathMatches(paths, pathname)) {
      activate();
    } else {
      document.body.classList.remove(SM_DASHBOARD_BODY_CLASS);
    }
    return () => {
      document.body.classList.remove(SM_DASHBOARD_BODY_CLASS);
    };
  }, [pathname, paths]);

  return null;
}
