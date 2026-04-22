'use client';

import type { ChatStage } from '@/types/inbox';
import { CHAT_STAGE_ORDER, CHAT_STAGE_LABELS, normalizeChatStage } from '@/types/inbox';

interface Props {
  currentStage?: ChatStage | string;
}

export function ChatStageSection({ currentStage }: Props) {
  const st = normalizeChatStage(
    currentStage == null ? undefined : String(currentStage)
  );
  const currentIndex = st ? CHAT_STAGE_ORDER.indexOf(st) : -1;

  return (
    <div className="p-3 border-bottom bg-white mt-0">
      <div
        className="small fw-semibold text-muted text-uppercase mb-2"
        style={{ letterSpacing: '.05em', fontSize: '0.7rem' }}
      >
        Etapa del chat
      </div>

      {!st ? (
        <p className="text-muted small mb-0">Sin etapa asignada</p>
      ) : (
        <div className="chat-stage-pipeline">
          {CHAT_STAGE_ORDER.map((stage, idx) => {
            const isPast    = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const stageClass = isPast ? 'past' : isCurrent ? 'current' : 'future';

            return (
              <div key={stage} className={`chat-stage-step ${stageClass}`}>
                <div className="chat-stage-dot" />
                <div className="chat-stage-label">{CHAT_STAGE_LABELS[stage]}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
