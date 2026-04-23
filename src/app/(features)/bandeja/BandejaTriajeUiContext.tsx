"use client";

import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

export type BandejaTriajeUi = {
  filtersOpen: boolean;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  activeTriajeFilterCount: number;
};

export const BandejaTriajeUiContext = createContext<BandejaTriajeUi | null>(null);

export function useBandejaTriajeUi(): BandejaTriajeUi | null {
  return useContext(BandejaTriajeUiContext);
}
