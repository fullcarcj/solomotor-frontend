"use client";

const MAP: Record<string, { bg: string; label: string }> = {
  a: { bg: "primary",                 label: "Post-venta"    },
  b: { bg: "info text-dark",          label: "Retiro"        },
  c: { bg: "success",                 label: "Calificación"  },
  d: { bg: "purple",                  label: "Pregunta IA"   },
  e: { bg: "warning text-dark",       label: "WA imagen"     },
  f: { bg: "warning text-dark",       label: "WA pregunta"   },
  h: { bg: "info text-dark",          label: "WA bienvenida" },
  m: { bg: "secondary",               label: "AI responder"  },
};

export default function AutomationKindBadge({ kind }: { kind: string }) {
  const key = (kind ?? "").toLowerCase();
  const cfg = MAP[key] ?? { bg: "secondary", label: kind ?? "—" };
  return (
    <span className={`badge bg-${cfg.bg}${cfg.bg.startsWith("purple") ? "" : ""}`}
      style={cfg.bg === "purple" ? { backgroundColor: "#6f42c1" } : undefined}>
      {cfg.label}
    </span>
  );
}
