"use client";

/**
 * Layout compartido de franjas colapsables en la ficha / bandeja.
 *
 * **Referencia canónica:** cabecera y contenedor de
 * `PaymentLinkPanel.tsx` («Comprobantes y conciliación»).
 * Cotización y demás bloques deben reutilizar estos mismos tokens.
 */

import type { CSSProperties } from "react";

/** Contenedor de la franja (equiv. `S.section` en PaymentLinkPanel). */
export const OP_FRANJA_SECTION: CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--mu-border, rgba(255,255,255,0.08))",
  overflow: "visible",
  marginBottom: 6,
  background: "var(--mu-panel-2, #1c222b)",
};

/** Cabecera clicable (equiv. `S.header(open)` en PaymentLinkPanel). */
export function opFranjaHeader(open: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    cursor: "pointer",
    userSelect: "none",
    background: open
      ? "linear-gradient(180deg, var(--mu-panel-3, #232a35), var(--mu-panel-2, #1c222b))"
      : "transparent",
    borderBottom: open ? "1px solid var(--mu-border, rgba(255,255,255,0.08))" : "none",
    transition: "background 0.15s",
    borderRadius: open ? "10px 10px 0 0" : 10,
  };
}

/** Cabecera no interactiva con el mismo aspecto que acordeón abierto. */
export function opFranjaHeaderStatic(): CSSProperties {
  return {
    ...opFranjaHeader(true),
    cursor: "default",
  };
}

export type OpFranjaIconTone = "blue" | "lime" | "orange" | "violet" | "slate" | "cyan";

/** Caja del icono 28×28 (equiv. `S.icon` en PaymentLinkPanel; `blue` = comprobantes). */
export function opFranjaIconBox(tone: OpFranjaIconTone): CSSProperties {
  const base: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
  if (tone === "blue") {
    return {
      ...base,
      background: "rgba(147,197,253,0.1)",
      border: "1px solid rgba(147,197,253,0.25)",
      color: "#93c5fd",
    };
  }
  if (tone === "lime") {
    return {
      ...base,
      background: "rgba(197,242,74,0.1)",
      border: "1px solid rgba(197,242,74,0.25)",
      color: "#c5f24a",
    };
  }
  if (tone === "orange") {
    return {
      ...base,
      background: "rgba(251,146,60,0.1)",
      border: "1px solid rgba(251,146,60,0.28)",
      color: "#fb923c",
    };
  }
  if (tone === "violet") {
    return {
      ...base,
      background: "rgba(196,181,253,0.1)",
      border: "1px solid rgba(196,181,253,0.28)",
      color: "#c4b5fd",
    };
  }
  if (tone === "cyan") {
    return {
      ...base,
      background: "rgba(56,189,248,0.1)",
      border: "1px solid rgba(56,189,248,0.28)",
      color: "#38bdf8",
    };
  }
  return {
    ...base,
    background: "rgba(148,163,184,0.1)",
    border: "1px solid rgba(148,163,184,0.28)",
    color: "#94a3b8",
  };
}

export const OP_FRANJA_TITLE: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--mu-text, #e6edf3)",
};

export const OP_FRANJA_SUBTITLE: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  color: "var(--mu-ink-mute, #6e7681)",
  letterSpacing: "0.06em",
  marginTop: 1,
};

/** Resumen con datos ya cargados (franja operativa): más legible que `OP_FRANJA_SUBTITLE`. */
export const OP_FRANJA_SUBTITLE_PROMINENT: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--mu-text, #d8e0ea)",
  letterSpacing: "0.04em",
  marginTop: 4,
  lineHeight: 1.42,
  wordBreak: "break-word",
};

/** Cuerpo con scroll (lista de comprobantes en PaymentLinkPanel). */
export const OP_FRANJA_BODY_SCROLL: CSSProperties = {
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxHeight: "min(55vh, 480px)",
  overflowY: "auto",
  borderBottomLeftRadius: 10,
  borderBottomRightRadius: 10,
};

/** Cuerpo solo relleno y radios (bloques genéricos bajo la cabecera). */
export const OP_FRANJA_BODY_PAD: CSSProperties = {
  padding: "12px 14px",
  borderBottomLeftRadius: 10,
  borderBottomRightRadius: 10,
};

export function OpFranjaChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      style={{
        width: 13,
        height: 13,
        transition: "transform 0.2s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
