"use client";

export default function StockBadge({
  qty,
  min,
  alert,
}: {
  qty: number;
  min: number;
  alert: boolean;
}) {
  if (alert) {
    return (
      <span className="badge bg-danger">
        ⚠ {qty}
      </span>
    );
  }
  if (qty === 0) {
    return <span className="badge bg-danger">Sin stock</span>;
  }
  if (qty <= min * 1.2) {
    return (
      <span className="badge bg-warning text-dark">{qty}</span>
    );
  }
  return <span className="badge bg-success">{qty}</span>;
}
