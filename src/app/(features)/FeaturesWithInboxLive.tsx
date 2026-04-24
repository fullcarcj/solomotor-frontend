"use client";

import type { ReactNode } from "react";
import { InboxLiveProvider } from "@/components/inbox/InboxLiveProvider";

/**
 * Envuelve el chrome autenticado `(features)` para exponer conteo bandeja + SSE en header y resto de páginas.
 */
export default function FeaturesWithInboxLive({ children }: { children: ReactNode }) {
  return <InboxLiveProvider>{children}</InboxLiveProvider>;
}
