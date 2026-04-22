"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useInbox } from "@/hooks/useInbox";

type InboxApi = ReturnType<typeof useInbox>;

const BandejaInboxContext = createContext<InboxApi | null>(null);

export function BandejaInboxProvider({ children }: { children: ReactNode }) {
  /** Sin filtros triaje al cargar: evita lista vacía por stage/result/src combinados. */
  const value = useInbox();
  return (
    <BandejaInboxContext.Provider value={value}>{children}</BandejaInboxContext.Provider>
  );
}

export function useBandejaInbox(): InboxApi {
  const ctx = useContext(BandejaInboxContext);
  if (!ctx) {
    throw new Error("useBandejaInbox debe usarse dentro de BandejaInboxProvider");
  }
  return ctx;
}
