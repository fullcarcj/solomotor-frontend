"use client";

import "./tablero.scss";

export default function VentasTableroPage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <header className="ventas-tablero-header">
          <h1 className="ventas-tablero-title">Tablero de ventas</h1>
          <p className="ventas-tablero-subtitle">
            Pipeline visual del ciclo de venta omnicanal
          </p>
        </header>

        <section className="ventas-tablero-empty">
          <div className="ventas-tablero-empty__icon">
            <i className="ti ti-layout-kanban" />
          </div>
          <h2 className="ventas-tablero-empty__title">Tablero en construcción</h2>
          <p className="ventas-tablero-empty__text">
            El Kanban de ventas (8 columnas alineadas con <code>chat_stage</code>)
            se habilita en el Sprint 3 del plan v2. Esta página queda como
            placeholder para que el swap posterior sea un cambio puntual.
          </p>
          <span className="ventas-tablero-empty__badge">Próximamente — Sprint 3</span>
        </section>
      </div>
    </div>
  );
}
