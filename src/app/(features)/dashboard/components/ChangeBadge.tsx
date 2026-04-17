"use client";

export default function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const val = Math.abs(pct).toFixed(1);
  if (pct > 0) {
    return <span className="badge bg-success ms-1">▲ {val}%</span>;
  }
  if (pct < 0) {
    return <span className="badge bg-danger ms-1">▼ {val}%</span>;
  }
  return <span className="badge bg-secondary ms-1">= 0%</span>;
}
