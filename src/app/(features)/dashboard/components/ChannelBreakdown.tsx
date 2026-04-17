"use client";

export default function ChannelBreakdown({
  totalOrders,
}: {
  totalOrders: number | undefined;
}) {
  if (totalOrders == null) {
    return (
      <div className="card h-100">
        <div className="card-header py-2 fw-semibold">Canales</div>
        <div className="card-body">
          <p className="placeholder-glow mb-0">
            <span className="placeholder col-12 rounded" />
          </p>
        </div>
      </div>
    );
  }

  if (totalOrders === 0) {
    return (
      <div className="card h-100">
        <div className="card-header py-2 fw-semibold">Canales</div>
        <div className="card-body text-muted small">Sin ventas hoy</div>
      </div>
    );
  }

  return (
    <div className="card h-100">
      <div className="card-header py-2 fw-semibold">Canales</div>
      <div className="card-body p-0">
        <p className="text-muted small p-3 mb-0">
          Desglose por canal disponible en{" "}
          <a href="/reports/sales-by-channel" className="text-decoration-none">
            Reportes
          </a>
          .
        </p>
        <table className="table table-sm mb-0">
          <thead className="table-light">
            <tr>
              <th>Canal</th>
              <th className="text-end">Órdenes</th>
              <th className="text-end">%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="badge rounded-pill bg-primary me-1">●</span>
                Mostrador + Otros
              </td>
              <td className="text-end">{totalOrders}</td>
              <td className="text-end">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
