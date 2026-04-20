"use client";

/**
 * Bloque introductorio alineado al mockup HTML: tag, título con gradiente,
 * descripción y cinta de anchos de columnas (spec ribbon).
 */

export default function PedidosPageIntro() {
  return (
    <>
      <header className="pd-page-header">
        <span className="pd-tag-header">Desktop 3A · redistribución final</span>
        <h1>Bandeja de órdenes · anchos profesionales</h1>
        <p>
          Tabla con columnas semánticas balanceadas: origen como chip en la orden,
          productos apilados con cantidad/SKU/precio, logística consolidada y total en
          columna propia (VES destacado). Sin duplicar el sidebar del POS: solo el
          contenido principal.
        </p>
      </header>

      <div className="pd-spec-ribbon" aria-label="Distribución de columnas de la tabla">
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Orden</span>
          <span className="pd-spec-pct">13%</span>
          <span className="pd-spec-ct">ID · ext · fecha · chip origen</span>
        </div>
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Productos</span>
          <span className="pd-spec-pct">25%</span>
          <span className="pd-spec-ct">Thumb + lista apilada qty/SKU/precio</span>
        </div>
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Cliente</span>
          <span className="pd-spec-pct">15%</span>
          <span className="pd-spec-ct">Avatar + nombre + cédula + contacto</span>
        </div>
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Logística</span>
          <span className="pd-spec-pct">11%</span>
          <span className="pd-spec-ct">Almacén + stock + vendedor</span>
        </div>
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Estado</span>
          <span className="pd-spec-pct">11%</span>
          <span className="pd-spec-ct">Status + próx. paso + elapsed + chat</span>
        </div>
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Total</span>
          <span className="pd-spec-pct">15%</span>
          <span className="pd-spec-ct">Dual USD/VES XL + subtotal + margen</span>
        </div>
        <div className="pd-spec-col">
          <span className="pd-spec-nm">Acciones</span>
          <span className="pd-spec-pct">10%</span>
          <span className="pd-spec-ct">Botón chat + kebab</span>
        </div>
      </div>
    </>
  );
}
