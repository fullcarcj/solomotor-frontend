"use client";

interface Props {
  module: string;
}

/**
 * Placeholder para módulos en desarrollo.
 * Usa los colores del template Dreams POS.
 */
export default function ComingSoon({ module }: Props) {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255, 107, 44, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <i className="ti ti-tools" style={{ fontSize: 34, color: "#FF6B2C" }} />
          </div>

          <h3 style={{ fontWeight: 700, color: "#1B2559", marginBottom: 0 }}>
            {module}
          </h3>

          <span
            style={{
              display: "inline-block",
              background: "#FF6B2C",
              color: "#fff",
              borderRadius: 6,
              padding: "4px 16px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            En desarrollo
          </span>

          <p style={{ color: "#8C8C8C", marginTop: 8, textAlign: "center", maxWidth: 320 }}>
            Este módulo estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  );
}
