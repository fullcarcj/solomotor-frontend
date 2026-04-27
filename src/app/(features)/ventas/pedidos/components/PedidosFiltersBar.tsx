/**
 * Tipos compartidos del toolbar de Pedidos (filtros + SLA).
 * La UI vive en `PedidosTopbar.tsx` (una sola fila).
 */

export type ActiveFilter = "all" | "pending" | "in_progress" | "closed";

export interface PedidosFilterCounts {
  all: number;
  pending: number;
  inProgress: number;
  closed: number;
}
