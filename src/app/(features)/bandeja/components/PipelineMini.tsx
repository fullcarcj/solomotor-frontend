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
import { CHAT_STAGE_ORDER, CHAT_STAGE_LABELS, normalizeChatStage } from "@/types/inbox";

interface Props {
  stage?: ChatStage | string;
}

/** Etiquetas ultra-cortas para la barra compacta (6 pasos) */
const SHORT_LABELS: Record<ChatStage, string> = {
  contact:   "CONTACTO",
  quote:     "COT.",
  order:     "ORDEN",
  payment:   "PAGO",
  dispatch:  "DESPACHO",
  closed:    "CERRADA",
};

export default function PipelineMini({ stage }: Props) {
  const st = normalizeChatStage(stage == null ? undefined : String(stage));
  const currentIdx = st ? CHAT_STAGE_ORDER.indexOf(st) : -1;

  return (
    <div className="mu-pipeline-mini" aria-label={`Etapa: ${st ? CHAT_STAGE_LABELS[st] : "Sin etapa"}`}>
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
