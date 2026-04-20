/**
 * PipelineMini · Sprint 6A
 *
 * Barra horizontal compacta que muestra el estado actual del chat
 * en el pipeline de ventas. Diseño según .pipeline-mini / .pm del mockup
 * solomotorx-modulo-ventas.html.
 *
 * Muestra todos los stages; el actual se resalta en --mu-accent (#d4ff3a).
 * Los stages pasados se muestran en "done" (verde suave).
 * Los stages futuros están inactivos (dim).
 */

import type { ChatStage } from "@/types/inbox";
import { CHAT_STAGE_ORDER, CHAT_STAGE_LABELS } from "@/types/inbox";

interface Props {
  stage?: ChatStage;
}

/** Etiquetas ultra-cortas para la barra compacta */
const SHORT_LABELS: Record<ChatStage, string> = {
  contact:   "01 · CONTACTO",
  ml_answer: "02 · ML",
  quote:     "03 · COT.",
  approved:  "04 · APROBADA",
  order:     "05 · ORDEN",
  payment:   "06 · PAGO",
  dispatch:  "07 · DESPACHO",
  closed:    "08 · CERRADA",
};

export default function PipelineMini({ stage }: Props) {
  const currentIdx = stage ? CHAT_STAGE_ORDER.indexOf(stage) : -1;

  return (
    <div className="mu-pipeline-mini" aria-label={`Etapa: ${stage ? CHAT_STAGE_LABELS[stage] : "Sin etapa"}`}>
      {CHAT_STAGE_ORDER.map((s, idx) => {
        const isDone    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        let cls = "mu-pm";
        if (isDone)    cls += " mu-pm--done";
        if (isCurrent) cls += " mu-pm--current";
        return (
          <div key={s} className={cls} title={CHAT_STAGE_LABELS[s]}>
            {SHORT_LABELS[s]}
          </div>
        );
      })}
    </div>
  );
}
