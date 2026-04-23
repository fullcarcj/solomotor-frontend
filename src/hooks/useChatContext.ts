import { useEffect, useState } from "react";
import type { CustomerDetail } from "@/types/customers";
import type { Sale } from "@/types/sales";

interface UseChatContextResult {
  customer:        CustomerDetail | null;
  recentOrders:    Sale[];
  loadingCustomer: boolean;
  loadingOrders:   boolean;
}

/**
 * Bandeja: `GET /crm/chats/:id/context` ya devuelve la fila `customers` — no duplicar al directorio.
 * `contextHydrated`: true tras el primer intento de contexto en este chat (éxito o fallo), para no
 * adelantar GET /clientes/directorio mientras llega la misma fuente de verdad.
 */
export interface UseChatContextOptions {
  getBandejaContextCustomer?: () => CustomerDetail | null;
  contextHydrated?: boolean;
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

/**
 * Caché a nivel de módulo (sobrevive navegación entre rutas Next).
 *
 * Problema que resuelve: en /bandeja/[chatId] cada ruta crea una instancia
 * nueva del hook → el useRef interno se reinicia → siempre fetchea embora el
 * cliente ya haya sido cargado segundos antes.
 * En workspace el componente nunca se desmonta → el useRef persiste → datos
 * instantáneos. Esta caché replica ese comportamiento para bandeja.
 *
 * TTL 60 s: suficiente para que cambios de chat seguidos sean instantáneos;
 * corto para que datos editados (PATCH cliente) se reflejen pronto.
 */
const CUSTOMER_TTL_MS = 60_000;
const ORDERS_TTL_MS   = 60_000;

interface CacheEntry<T> { data: T; at: number }
const _customerCache = new Map<string, CacheEntry<CustomerDetail>>();
const _ordersCache   = new Map<string, CacheEntry<Sale[]>>();

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
  const e = map.get(key);
  if (!e) return null;
  if (Date.now() - e.at > ttl) { map.delete(key); return null; }
  return e.data;
}

/** Invalida la entrada de un cliente (llamar tras editar o desvincular cliente). */
export function invalidateChatContextClientCache(customerId: number | string) {
  const k = String(customerId);
  _customerCache.delete(k);
  _ordersCache.delete(k);
}

/**
 * Rellena la caché del cliente con el mismo payload que ya devolvió
 * `GET /api/crm/chats/:id/context` (evita un round-trip duplicado a `/api/clientes/directorio`).
 */
export function primeChatContextFromCrmContext(
  customerId: number | string,
  detail: CustomerDetail
) {
  const k = String(customerId);
  if (!k || !Number.isFinite(Number(k)) || Number(k) <= 0) return;
  _customerCache.set(k, { data: detail, at: Date.now() });
}

export function useChatContext(
  customerId: number | string | null,
  /** Bandeja: bump cuando `GET /context` entregue `customers` (misma fila que la ficha). */
  chatContextRevision = 0,
  options?: UseChatContextOptions
): UseChatContextResult {
  const key = customerId != null ? String(customerId) : null;

  const [customer,        setCustomer]        = useState<CustomerDetail | null>(
    () => (key ? getCached(_customerCache, key, CUSTOMER_TTL_MS) : null)
  );
  const [recentOrders,    setRecentOrders]    = useState<Sale[]>(
    () => (key ? getCached(_ordersCache, key, ORDERS_TTL_MS) ?? [] : [])
  );
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingOrders,   setLoadingOrders]   = useState(false);

  useEffect(() => {
    if (!key) {
      setCustomer(null);
      setRecentOrders([]);
      return;
    }

    const bandejaCtx = options?.getBandejaContextCustomer?.() ?? null;
    const fromBandejaContext =
      bandejaCtx != null && String(bandejaCtx.id) === key ? bandejaCtx : null;

    const cachedCustomer = fromBandejaContext
      ? fromBandejaContext
      : getCached(_customerCache, key, CUSTOMER_TTL_MS);
    const cachedOrders   = getCached(_ordersCache,   key, ORDERS_TTL_MS);

    if (fromBandejaContext) {
      _customerCache.set(key, { data: fromBandejaContext, at: Date.now() });
    }

    if (cachedCustomer !== null && cachedOrders !== null) {
      setCustomer(cachedCustomer);
      setRecentOrders(cachedOrders);
      setLoadingCustomer(false);
      return;
    }

    if (cachedCustomer === null && cachedOrders === null) {
      setCustomer(null);
      setRecentOrders([]);
    } else {
      if (cachedCustomer !== null) setCustomer(cachedCustomer);
      if (cachedOrders !== null) setRecentOrders(cachedOrders);
    }

    const bandejaMode = typeof options?.getBandejaContextCustomer === "function";
    const contextReady = options?.contextHydrated === true;
    const waitForBandejaContext =
      bandejaMode && !contextReady && !fromBandejaContext && cachedCustomer === null;

    if (waitForBandejaContext) {
      setLoadingCustomer(true);
    } else if (!cachedCustomer) {
      setLoadingCustomer(true);
      fetch(`/api/clientes/directorio/${encodeURIComponent(key)}`, { credentials: "include" })
        .then(async r => {
          const d = await r.json().catch(() => ({})) as Record<string, unknown>;
          const cd = (d.customer ?? d.data ?? d) as CustomerDetail;
          _customerCache.set(key, { data: cd, at: Date.now() });
          setCustomer(cd ?? null);
        })
        .catch(() => setCustomer(null))
        .finally(() => setLoadingCustomer(false));
    } else {
      setLoadingCustomer(false);
    }

    if (!cachedOrders) {
      setLoadingOrders(true);
      fetch(`/api/ventas/pedidos?customer_id=${encodeURIComponent(key)}&limit=5`, { credentials: "include" })
        .then(async r => {
          const d: unknown = await r.json().catch(() => ({}));
          const sales = parseSales(d);
          _ordersCache.set(key, { data: sales, at: Date.now() });
          setRecentOrders(sales);
        })
        .catch(() => setRecentOrders([]))
        .finally(() => setLoadingOrders(false));
    } else {
      setLoadingOrders(false);
    }
  }, [key, chatContextRevision, options?.getBandejaContextCustomer, options?.contextHydrated]);

  return { customer, recentOrders, loadingCustomer, loadingOrders };
}
