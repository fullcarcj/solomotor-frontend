/** Monedas admitidas por el backend de delivery (deliveryService.DELIVERY_CURRENCIES). */
export const DELIVERY_CURRENCIES = [
  "BS",
  "USD",
  "EFECTIVO",
  "EFECTIVO_BS",
  "ZELLE",
  "BINANCE",
] as const;

export type DeliveryCurrency = (typeof DELIVERY_CURRENCIES)[number];

export const DELIVERY_SERVICE_STATUS_LABELS: Record<string, string> = {
  pending_assignment: "Pendiente asignación",
  assigned: "Asignado",
  delivered: "Entregado",
  pending_payment: "Pendiente pago motorizado",
  paid: "Pagado",
  cancelled: "Cancelado",
};

export const LIQUIDATE_PAID_BY = ["Javier", "Jesus", "Sebastian"] as const;
