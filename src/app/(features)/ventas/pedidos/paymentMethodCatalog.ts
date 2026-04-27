/**
 * Catálogo de medios de cobro (ventas omnicanal · `sales_orders.payment_method`).
 * Default en UI para órdenes VES sin valor guardado: VES Banesco.
 * Opciones VES extendidas según rol del usuario conectado.
 */

export const DEFAULT_VES_PAYMENT = "ves_banesco";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ves_banesco: "VES Banesco",
  ves_bdv: "VES BDV",
  transfer: "Transferencia Bs (otro banco)",
  pago_movil: "Pago móvil",
  efectivo_bs: "Efectivo Bs",
  mercadopago: "Mercado Pago",
  credito: "Crédito",
  other: "Otro",
  unknown: "Sin clasificar",
  cash: "Efectivo USD",
  card: "Tarjeta",
  zelle: "Zelle",
  binance: "Binance / P2P",
  usd: "USD (transferencia)",
  panama: "Wire / Panamá",
  efectivo: "Efectivo (gen.)",
};

const VES_CODES_OPERATIONS = [
  "ves_banesco",
  "ves_bdv",
  "transfer",
  "pago_movil",
  "efectivo_bs",
] as const;

const VES_CODES_EXTENDED = [
  "mercadopago",
  "credito",
  "other",
  "unknown",
] as const;

const USD_OPTIONS: { value: string; label: string }[] = [
  { value: "zelle", label: PAYMENT_METHOD_LABELS.zelle },
  { value: "binance", label: PAYMENT_METHOD_LABELS.binance },
  { value: "usd", label: PAYMENT_METHOD_LABELS.usd },
  { value: "panama", label: PAYMENT_METHOD_LABELS.panama },
  { value: "cash", label: PAYMENT_METHOD_LABELS.cash },
  { value: "efectivo", label: PAYMENT_METHOD_LABELS.efectivo },
  { value: "card", label: PAYMENT_METHOD_LABELS.card },
  { value: "mercadopago", label: PAYMENT_METHOD_LABELS.mercadopago },
  { value: "credito", label: PAYMENT_METHOD_LABELS.credito },
  { value: "other", label: PAYMENT_METHOD_LABELS.other },
  { value: "unknown", label: PAYMENT_METHOD_LABELS.unknown },
];

export const PAYMENT_EMPTY = { value: "", label: "Sin definir" };

export function paymentMethodLabel(code: string | null | undefined): string {
  const c = code?.trim().toLowerCase() ?? "";
  if (!c) return "—";
  return PAYMENT_METHOD_LABELS[c] ?? c;
}

/** Roles que ven el catálogo VES completo (crédito, sin clasificar, etc.). */
export function hasExtendedVesPaymentCatalog(
  role: string | null | undefined,
): boolean {
  const r = (role || "").trim().toUpperCase();
  return (
    r === "SUPERUSER" ||
    r === "ADMIN" ||
    r === "SUPERVISOR" ||
    r === "CONTADOR"
  );
}

export function vesPaymentOptionsForRole(
  role: string | null | undefined,
): { value: string; label: string }[] {
  const codes: readonly string[] = hasExtendedVesPaymentCatalog(role)
    ? [...VES_CODES_OPERATIONS, ...VES_CODES_EXTENDED]
    : [...VES_CODES_OPERATIONS];
  return codes.map((value) => ({
    value,
    label: PAYMENT_METHOD_LABELS[value] ?? value,
  }));
}

export function paymentOptionsForSale(
  sale: { rate_type?: string | null; payment_method?: string | null },
  viewerRole: string | null | undefined,
): { value: string; label: string }[] {
  const isNativeVes = sale.rate_type === "NATIVE_VES";
  const base = isNativeVes
    ? vesPaymentOptionsForRole(viewerRole)
    : [...USD_OPTIONS];
  const allowed = new Set(base.map((o) => o.value));
  const cur = sale.payment_method?.trim().toLowerCase() ?? "";
  if (cur && !allowed.has(cur)) {
    base.unshift({
      value: cur,
      label: `${paymentMethodLabel(cur)} (actual)`,
    });
  }
  return [PAYMENT_EMPTY, ...base];
}

/** Valor del `<select>`: VES sin BD → default VES Banesco en pantalla. */
export function effectivePaymentSelectValue(
  sale: { rate_type?: string | null; payment_method?: string | null },
): string {
  const raw = sale.payment_method?.trim().toLowerCase() ?? "";
  if (raw) return raw;
  if (sale.rate_type === "NATIVE_VES") return DEFAULT_VES_PAYMENT;
  return "";
}
