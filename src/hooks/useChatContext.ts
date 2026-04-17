import { useEffect, useRef, useState } from "react";
import type { CustomerDetail } from "@/types/customers";
import type { Sale } from "@/types/sales";

interface UseChatContextResult {
  customer:        CustomerDetail | null;
  recentOrders:    Sale[];
  loadingCustomer: boolean;
  loadingOrders:   boolean;
}

function parseSales(raw: unknown): Sale[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const inner = (r.data as Record<string, unknown>) ?? r;
  return Array.isArray(inner.sales) ? (inner.sales as Sale[])
    : Array.isArray(inner.rows)  ? (inner.rows as Sale[])
    : Array.isArray(raw)         ? (raw as Sale[])
    : [];
}

export function useChatContext(customerId: number | string | null): UseChatContextResult {
  const [customer,        setCustomer]        = useState<CustomerDetail | null>(null);
  const [recentOrders,    setRecentOrders]    = useState<Sale[]>([]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingOrders,   setLoadingOrders]   = useState(false);

  /* Cache: avoid re-fetching for the same customerId */
  const lastId = useRef<number | string | null>(null);

  useEffect(() => {
    if (customerId === null || customerId === undefined) {
      setCustomer(null);
      setRecentOrders([]);
      lastId.current = null;
      return;
    }
    if (lastId.current === customerId) return;
    lastId.current = customerId;

    setLoadingCustomer(true);
    setLoadingOrders(true);

    /* Fetch customer detail */
    fetch(`/api/clientes/directorio/${encodeURIComponent(customerId)}`, { credentials: "include" })
      .then(async r => {
        const d = await r.json().catch(() => ({})) as Record<string, unknown>;
        const cd = (d.customer ?? d.data ?? d) as CustomerDetail;
        setCustomer(cd ?? null);
      })
      .catch(() => setCustomer(null))
      .finally(() => setLoadingCustomer(false));

    /* Fetch recent orders */
    fetch(`/api/ventas/pedidos?customer_id=${encodeURIComponent(customerId)}&limit=5`, { credentials: "include" })
      .then(async r => {
        const d: unknown = await r.json().catch(() => ({}));
        setRecentOrders(parseSales(d));
      })
      .catch(() => setRecentOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [customerId]);

  return { customer, recentOrders, loadingCustomer, loadingOrders };
}
