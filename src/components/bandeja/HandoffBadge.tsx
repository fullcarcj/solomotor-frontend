"use client";

import type { ChatStatus } from "@/types/inbox";

interface Props {
  status: ChatStatus | undefined | null;
  assignedUserName?: string | null;
  /** Si el bot está respondiendo activamente (UNASSIGNED + acciones recientes). */
  botActive?: boolean;
}

const BADGE_CONFIG: Record<
  string,
  { label: (name?: string | null) => string; cls: string }
> = {
  UNASSIGNED: {
    label: () => "Sin asignar",
    cls: "hb-badge hb-badge--gray",
  },
  PENDING_RESPONSE: {
    label: (name) => name ?? "Asignado",
    cls: "hb-badge hb-badge--blue",
  },
  ATTENDED: {
    label: () => "Atendido",
    cls: "hb-badge hb-badge--green",
  },
  RE_OPENED: {
    label: () => "Reabierto",
    cls: "hb-badge hb-badge--orange",
  },
};

export default function HandoffBadge({ status, assignedUserName, botActive = false }: Props) {
  if (!status) return null;

  if (botActive && status === "UNASSIGNED") {
    return (
      <span className="hb-badge hb-badge--purple" title="Bot respondiendo automáticamente">
        <i className="ti ti-robot" style={{ fontSize: 11 }} />
        BOT ACTIVO
      </span>
    );
  }

  const cfg = BADGE_CONFIG[status];
  if (!cfg) return null;

  const iconMap: Record<string, string> = {
    UNASSIGNED: "ti-user-off",
    PENDING_RESPONSE: "ti-user-check",
    ATTENDED: "ti-circle-check",
    RE_OPENED: "ti-refresh-alert",
  };

  return (
    <span className={cfg.cls} title={`Estado: ${status}`}>
      <i className={`ti ${iconMap[status] ?? "ti-user"}`} style={{ fontSize: 11 }} />
      {cfg.label(assignedUserName)}
    </span>
  );
}
