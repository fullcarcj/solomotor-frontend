"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  OP_FRANJA_SECTION,
  opFranjaHeader,
  opFranjaHeaderStatic,
  opFranjaIconBox,
  OP_FRANJA_TITLE,
  OP_FRANJA_SUBTITLE,
  OP_FRANJA_SUBTITLE_PROMINENT,
  OpFranjaChevron,
  OP_FRANJA_BODY_PAD,
  type OpFranjaIconTone,
} from "@/app/(features)/bandeja/components/operativeFranjaShared";

export type OperativeFranjaAccent = OpFranjaIconTone;

type Props = {
  accent: OperativeFranjaAccent;
  iconClass: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Si hay información útil ya resumida en cabecera, resalta el subtítulo; si no, estilo apagado. */
  subtitleHighlight?: boolean;
  titleAside?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
  children?: ReactNode;
  resetKey?: string | number;
};

/**
 * Bloque colapsable de la ficha 360° / franja operativa.
 * Mismo layout que `PaymentLinkPanel` (comprobantes y conciliación).
 */
export default function OperativeFranjaSection({
  accent,
  iconClass,
  title,
  subtitle,
  subtitleHighlight = false,
  titleAside,
  defaultOpen = true,
  collapsible = true,
  className,
  children,
  resetKey,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [resetKey, defaultOpen]);

  const showBody = !collapsible || open;

  const subtitleWrapStyle = subtitleHighlight ? OP_FRANJA_SUBTITLE_PROMINENT : OP_FRANJA_SUBTITLE;

  const headInner = (
    <>
      <div style={opFranjaIconBox(accent)}>
        <i className={iconClass} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={OP_FRANJA_TITLE}>{title}</span>
          {titleAside != null && titleAside !== false ? titleAside : null}
        </div>
        {subtitle != null && subtitle !== false ? (
          <div style={subtitleWrapStyle}>{subtitle}</div>
        ) : null}
      </div>
      {collapsible ? (
        <div style={{ color: "var(--mu-ink-mute, #6e7681)" }}>
          <OpFranjaChevron open={open} />
        </div>
      ) : null}
    </>
  );

  if (collapsible) {
    return (
      <div style={OP_FRANJA_SECTION} className={className}>
        <div
          style={opFranjaHeader(open)}
          onClick={() => setOpen((v) => !v)}
          role="button"
          aria-expanded={open}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
          }}
        >
          {headInner}
        </div>
        {showBody && children != null ? <div style={OP_FRANJA_BODY_PAD}>{children}</div> : null}
      </div>
    );
  }

  return (
    <div style={OP_FRANJA_SECTION} className={className}>
      <div style={opFranjaHeaderStatic()}>{headInner}</div>
      {children != null ? <div style={OP_FRANJA_BODY_PAD}>{children}</div> : null}
    </div>
  );
}
