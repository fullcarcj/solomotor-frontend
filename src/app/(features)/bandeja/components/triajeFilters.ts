import type { InboxFilters } from "@/types/inbox";

/**
 * Selección inicial del triaje: vacía = sin `src`/`stage`/`result` en la API,
 * para que `/bandeja` muestre conversaciones por defecto. Los chips solo
 * acotan la lista cuando el usuario los activa.
 */
export const DEFAULT_TRIAJE_SELECTION = new Set<string>();

const CICLO_TO_STAGE: Record<string, string> = {
  "ciclo-contacto": "contact",
  "ciclo-cotizar": "quote",
  "ciclo-aprob": "approved",
  "ciclo-orden": "order",
  "ciclo-pago": "payment",
  "ciclo-desp": "dispatch",
  "ciclo-cerr": "closed",
  /** Antes "Resp. ML"; ahora mismo filtro que cotización (pregunta respondida → etapa quote). */
  "ciclo-respml": "quote",
};

/**
 * Traduce chips del panel triaje a parámetros de GET /api/bandeja (→ /api/inbox).
 * No modifica `filter` (badges InboxCountBadges) ni `search`.
 */
export function triajeSelectionToInboxFilters(sel: ReadonlySet<string>): Pick<
  InboxFilters,
  "src" | "stage" | "result"
> {
  const out: Pick<InboxFilters, "src" | "stage" | "result"> = {
    src: "",
    stage: "",
    result: "",
  };

  const canalParts: string[] = [];
  if (sel.has("canal-wa")) canalParts.push("wa");
  if (sel.has("canal-mlmsg")) canalParts.push("ml_message");
  if (sel.has("canal-mlpreg")) canalParts.push("ml_question");

  if (canalParts.length) {
    out.src = [...new Set(canalParts)].join(",");
  } else {
    const hasMl = sel.has("orig-ml");
    const hasWa = sel.has("orig-wa");
    if (hasMl && !hasWa) out.src = "ml";
    else if (hasWa && !hasMl) out.src = "wa";
    else out.src = "";
  }

  const stages: string[] = [];
  for (const id of sel) {
    const st = CICLO_TO_STAGE[id];
    if (st) stages.push(st);
  }
  if (stages.length) out.stage = [...new Set(stages)].join(",");

  if (sel.has("res-sinconv")) out.result = "no_conversion";
  else if (sel.has("res-conv")) out.result = "converted";
  else if (sel.has("res-proc")) out.result = "in_progress";

  return out;
}
