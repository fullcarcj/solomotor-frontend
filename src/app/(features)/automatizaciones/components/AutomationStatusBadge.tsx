"use client";

const MAP: Record<string, { bg: string; label: string }> = {
  sent:     { bg: "success",   label: "Enviado"   },
  success:  { bg: "success",   label: "Enviado"   },
  ok:       { bg: "success",   label: "Enviado"   },
  failed:   { bg: "danger",    label: "Fallido"   },
  error:    { bg: "danger",    label: "Fallido"   },
  skipped:  { bg: "secondary", label: "Omitido"   },
  skip:     { bg: "secondary", label: "Omitido"   },
  pending:  { bg: "warning",   label: "Pendiente" },
};

export default function AutomationStatusBadge({ outcome }: { outcome: string }) {
  const key = (outcome ?? "").toLowerCase();
  const cfg = MAP[key] ?? { bg: "light", label: outcome ?? "—" };
  return (
    <span className={`badge bg-${cfg.bg}${cfg.bg === "light" ? " text-dark border" : ""}`}>
      {cfg.label}
    </span>
  );
}
