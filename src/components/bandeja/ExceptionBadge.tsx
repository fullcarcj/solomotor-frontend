"use client";

import { Tooltip } from "antd";
import type { ExceptionCode } from "@/types/exceptions";
import { EXCEPTION_CODE_LABELS, EXCEPTION_CODE_COLORS } from "@/types/exceptions";

interface Props {
  code: ExceptionCode;
  reason: string;
  /** Si true: solo muestra ícono + código. Si false: código + razón truncada. */
  compact?: boolean;
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export default function ExceptionBadge({ code, reason, compact = false }: Props) {
  const label = EXCEPTION_CODE_LABELS[code] ?? code;
  const color = EXCEPTION_CODE_COLORS[code] ?? "#ef4444";

  const badge = compact ? (
    <span
      className="exc-badge exc-badge--compact"
      style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
    >
      <i className="ti ti-alert-triangle" style={{ fontSize: 11 }} />
      {code}
    </span>
  ) : (
    <span
      className="exc-badge"
      style={{ background: `${color}18`, border: `1px solid ${color}44`, color }}
    >
      <i className="ti ti-alert-triangle" style={{ fontSize: 12, flexShrink: 0 }} />
      <span className="exc-badge-code">{label}</span>
      <span className="exc-badge-reason">{truncate(reason, 40)}</span>
    </span>
  );

  return (
    <Tooltip title={reason} placement="top">
      {badge}
    </Tooltip>
  );
}
