"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useBandejaInbox } from "../BandejaInboxContext";
import { BandejaTriajeUiContext } from "../BandejaTriajeUiContext";
import {
  DEFAULT_TRIAJE_SELECTION,
  triajeSelectionToInboxFilters,
} from "./triajeFilters";
import {
  ChannelIcon,
  type ChannelIconVariant,
} from "@/components/inbox/ChannelIcon";
import "../bandeja-definitiva-theme.scss";

function BroomIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M19.36 2.72 20.78 4.14 15.06 9.85 19.78 14.56a5 5 0 01-7.07 7.07l-2.12-2.12-3.54 3.54-1.42-1.42 3.54-3.54L7.05 16l-1.41 1.42a3 3 0 01-4.25-4.24L5.64 9.34l5.72-5.72a5 5 0 017.07 0l.93.1z" />
    </svg>
  );
}

/** Íconos para chips de filtro "Canal" (14px vía CSS en .bd-f-chip .origen) */
function FilterCanalIcon({ kind }: { kind: ChannelIconVariant }) {
  return (
    <span className="ico">
      <ChannelIcon channel={kind} />
    </span>
  );
}

interface Props {
  /** Lista real de conversaciones (mismo componente que en /bandeja/[chatId]). */
  children: ReactNode;
}

/**
 * Chrome visual “bandeja definitiva”: pestañas y filtros colapsables (disparador en lista).
 * La lista de chats vive en `children` para mantener la misma UI que el detalle.
 */
export default function BandejaTriajeMock({ children }: Props) {
  const { setFilters } = useBandejaInbox();
  const [tab, setTab] = useState<
    "pend" | "arch" | "asig" | "audit" | "prod"
  >("pend");
  /** Por defecto colapsado (no expandido). */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSel, setFilterSel] = useState<Set<string>>(
    () => new Set(DEFAULT_TRIAJE_SELECTION)
  );

  const activeFilterCount = filterSel.size;

  const applySelection = useCallback(
    (next: Set<string>) => {
      setFilters(triajeSelectionToInboxFilters(next));
    },
    [setFilters]
  );

  const toggleFilter = useCallback(
    (id: string) => {
      setFilterSel((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        queueMicrotask(() => {
          applySelection(next);
        });
        return next;
      });
    },
    [applySelection]
  );

  const clearFilters = useCallback(() => {
    setFilterSel(new Set());
    applySelection(new Set());
  }, [applySelection]);

  const triajeUiValue = useMemo(
    () => ({
      filtersOpen,
      setFiltersOpen,
      activeTriajeFilterCount: activeFilterCount,
    }),
    [filtersOpen, activeFilterCount]
  );

  return (
    <BandejaTriajeUiContext.Provider value={triajeUiValue}>
      <div className="bd-triaje">
      <div className="bd-tabs-wrap">
        <div className="bd-tabs" role="tablist" aria-label="Vistas de bandeja">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "pend"}
            className={`bd-tab${tab === "pend" ? " active" : ""}`}
            onClick={() => setTab("pend")}
          >
            Pendientes <span className="bd-badge">12</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "arch"}
            className={`bd-tab${tab === "arch" ? " active" : ""}`}
            onClick={() => setTab("arch")}
          >
            Archivados
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "asig"}
            className={`bd-tab${tab === "asig" ? " active" : ""}`}
            onClick={() => setTab("asig")}
          >
            Asignados
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "audit"}
            className={`bd-tab bd-tab--icon${tab === "audit" ? " active" : ""}`}
            onClick={() => setTab("audit")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9M13 17V5M8 17v-3" />
            </svg>
            Auditoría
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "prod"}
            className={`bd-tab bd-tab--icon${tab === "prod" ? " active" : ""}`}
            onClick={() => setTab("prod")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            Productos
          </button>
        </div>
        <div className="bd-scroll-hint" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>

      {filtersOpen && (
        <div className="bd-filters-block" id="bd-triaje-filters-panel">
          <div className="bd-filters-body">
            <div className="bd-filters-toolbar-row">
              <button
                type="button"
                className="bd-filters-clear-all"
                title="Limpiar filtros de triaje"
                onClick={() => clearFilters()}
              >
                <BroomIcon />
                <span>Limpiar</span>
              </button>
            </div>
            <div className="bd-fg">
              <div className="bd-fg-title">Origen de venta</div>
              <div className="bd-f-opts">
                {(
                  [
                    ["orig-wa", "var(--bar-wa)", "WhatsApp", 14],
                    ["orig-ml", "var(--bar-ml)", "Mercado Libre", 14],
                    ["orig-ecom", "var(--bar-ecom)", "E-com", 3],
                    ["orig-most", "var(--bar-mostrador)", "Mostrador", 7],
                    ["orig-fza", "var(--bar-fuerza)", "Fuerza Vtas", 2],
                  ] as const
                ).map(([id, bg, label, cnt]) => (
                  <button
                    key={id}
                    type="button"
                    className={`bd-f-chip${filterSel.has(String(id)) ? " on" : ""}`}
                    onClick={() => toggleFilter(String(id))}
                  >
                    <span className="bar-mini" style={{ background: bg }} />
                    {label}
                    <span className="cnt">{cnt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bd-fg">
              <div className="bd-fg-title">Canal del chat</div>
              <div className="bd-f-opts">
                {(
                  [
                    ["canal-wa", "wa", "WhatsApp", 14],
                    ["canal-mlmsg", "ml-msg", "ML Msg", 6],
                    ["canal-mlpreg", "ml-preg", "ML Preg", 8],
                    ["canal-ecom", "ecom", "E-com", 3],
                  ] as const
                ).map(([id, ch, label, cnt]) => (
                  <button
                    key={id}
                    type="button"
                    className={`bd-f-chip${filterSel.has(id) ? " on" : ""}`}
                    onClick={() => toggleFilter(id)}
                  >
                    <FilterCanalIcon kind={ch} />
                    {label}
                    <span className="cnt">{cnt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bd-fg">
              <div className="bd-fg-title">Estado del ciclo</div>
              <div className="bd-f-opts">
                {(
                  [
                    ["ciclo-contacto", "s01", "Contacto", 5],
                    ["ciclo-cotizar", "s02", "Cotizar", 4],
                    ["ciclo-aprob", "s03", "Aprobada", 2],
                    ["ciclo-orden", "s04", "Orden", 3],
                    ["ciclo-pago", "s05", "Pago", 7],
                    ["ciclo-desp", "s06", "Despacho", 1],
                    ["ciclo-cerr", "s07", "Cerrada", 6],
                    ["ciclo-respml", "s-respml", "Resp. ML", 2],
                  ] as const
                ).map(([id, colorKey, label, cnt]) => (
                  <button
                    key={id}
                    type="button"
                    className={`bd-f-chip${filterSel.has(id) ? " on" : ""}`}
                    onClick={() => toggleFilter(id)}
                  >
                    <span
                      className="mini"
                      style={{ background: `var(--${colorKey})` }}
                    />
                    {label}
                    <span className="cnt">{cnt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bd-fg">
              <div className="bd-fg-title">Resultado</div>
              <div className="bd-f-opts">
                <button
                  type="button"
                  className={`bd-f-chip${filterSel.has("res-sinconv") ? " on-danger" : ""}`}
                  onClick={() => toggleFilter("res-sinconv")}
                >
                  Sin conversión<span className="cnt">11</span>
                </button>
                <button
                  type="button"
                  className={`bd-f-chip${filterSel.has("res-conv") ? " on" : ""}`}
                  onClick={() => toggleFilter("res-conv")}
                >
                  Convertidas<span className="cnt">8</span>
                </button>
                <button
                  type="button"
                  className={`bd-f-chip${filterSel.has("res-proc") ? " on" : ""}`}
                  onClick={() => toggleFilter("res-proc")}
                >
                  En proceso<span className="cnt">4</span>
                </button>
              </div>
            </div>

            <div className="bd-fg">
              <div className="bd-fg-title">Fechas</div>
              <div className="bd-date-pair">
                <div className="bd-date-box" role="button" tabIndex={0}>
                  <div>
                    <span className="lbl-d">Desde</span>
                    <span>12 / 04</span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="bd-date-box" role="button" tabIndex={0}>
                  <div>
                    <span className="lbl-d">Hasta</span>
                    <span>19 / 04</span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bd-fg">
              <div className="bd-fg-title">Rápidos</div>
              <div className="bd-f-opts">
                <button type="button" className="bd-f-chip">
                  Preg ML sin conv<span className="cnt">4</span>
                </button>
                <button type="button" className="bd-f-chip">
                  Cotiz. frías<span className="cnt">3</span>
                </button>
                <button type="button" className="bd-f-chip">
                  Fin. sin venta<span className="cnt">11</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bd-triaje-list-slot flex-grow-1 min-h-0 d-flex flex-column overflow-hidden">
        {children}
      </div>
      </div>
    </BandejaTriajeUiContext.Provider>
  );
}
