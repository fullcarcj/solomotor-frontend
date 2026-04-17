"use client";
import Link from "next/link";

interface Props {
  name:       string;
  icon:       string;
  status:     "connected" | "not_configured";
  details:    React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?:   () => void;
}

export default function IntegrationStatusCard({
  name, icon, status, details, actionLabel, actionHref, onAction,
}: Props) {
  const ok = status === "connected";
  return (
    <div className={`card h-100 border ${ok ? "border-success" : "border-secondary"}`}>
      <div className="card-body">
        <div className="d-flex align-items-start gap-2 mb-2">
          <i className={`ti ${icon} fs-3 ${ok ? "text-success" : "text-muted"}`} />
          <div>
            <h6 className="card-title mb-1">{name}</h6>
            <div className="small">
              <span className={ok ? "text-success" : "text-muted"}>
                {ok ? "● Conectado" : "○ No configurado"}
              </span>
            </div>
          </div>
        </div>
        <div className="small text-muted mb-3">{details}</div>
        {actionHref && (
          <Link href={actionHref} className="btn btn-sm btn-outline-primary">
            {actionLabel ?? "Abrir"}
          </Link>
        )}
        {onAction && !actionHref && (
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onAction}>
            {actionLabel ?? "Acción"}
          </button>
        )}
      </div>
    </div>
  );
}
