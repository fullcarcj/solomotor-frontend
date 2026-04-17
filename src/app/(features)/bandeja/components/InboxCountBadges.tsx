"use client";
import { useEffect, useRef, useState } from "react";
import type { InboxCounts } from "@/types/inbox";

interface Props {
  activeFilter: string;
  onFilter:     (f: string) => void;
}

const BADGES = [
  { key: "",                label: "Todos",        icon: "ti-messages" },
  { key: "unread",          label: "Sin leer",     icon: "ti-bell" },
  { key: "payment_pending", label: "Pago pend.",   icon: "ti-clock-hour-3" },
  { key: "quote",           label: "Cotizar",      icon: "ti-file-invoice" },
  { key: "dispatch",        label: "Despachar",    icon: "ti-truck" },
] as const;

type BadgeKey = typeof BADGES[number]["key"];

export default function InboxCountBadges({ activeFilter, onFilter }: Props) {
  const [counts, setCounts] = useState<InboxCounts | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCounts() {
    try {
      const r = await fetch("/api/bandeja/counts", { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json().catch(() => null) as InboxCounts | null;
      if (d) setCounts(d);
    } catch { /* silent */ }
  }

  useEffect(() => {
    void fetchCounts();
    intervalRef.current = setInterval(() => void fetchCounts(), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function getCount(key: BadgeKey): number | null {
    if (!counts) return null;
    if (key === "")                return counts.total;
    if (key === "unread")          return counts.unread;
    if (key === "payment_pending") return counts.payment_pending;
    if (key === "quote")           return counts.quote;
    if (key === "dispatch")        return counts.dispatch;
    return null;
  }

  return (
    <div className="d-flex flex-wrap gap-1 px-2 pt-2 pb-1">
      {BADGES.map(b => {
        const count = getCount(b.key);
        const isActive = activeFilter === b.key;
        return (
          <button
            key={b.key}
            className={`btn btn-sm d-flex align-items-center gap-1 ${isActive ? "btn-primary" : "btn-light"}`}
            style={{ fontSize: "0.75rem" }}
            onClick={() => onFilter(b.key)}
          >
            <i className={`ti ${b.icon}`} />
            {b.label}
            {count !== null && (
              <span className={`badge rounded-pill ms-1 ${isActive ? "bg-white text-primary" : "bg-secondary text-white"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
