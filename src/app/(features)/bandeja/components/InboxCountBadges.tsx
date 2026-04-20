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
  { key: "payment_pending", label: "Pago pendiente", icon: "ti-clock-hour-3" },
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
    <div className="bandeja-inbox-tabs" role="tablist">
      {BADGES.map(b => {
        const count = getCount(b.key);
        const isActive = activeFilter === b.key;
        const ariaLabel =
          count !== null ? `${b.label}, ${count}` : b.label;
        return (
          <button
            key={b.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={b.label}
            aria-label={ariaLabel}
            className={`btn btn-sm bandeja-inbox-tab d-flex align-items-center justify-content-center gap-1 ${isActive ? "active" : ""}`}
            onClick={() => onFilter(b.key)}
          >
            <i className={`ti ${b.icon}`} aria-hidden />
            {count !== null && (
              <span className="badge rounded-pill bandeja-inbox-tab__n">
                {count > 999 ? "999+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
