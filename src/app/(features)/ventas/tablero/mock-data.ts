import type {
  SupervisorKPIs,
  WaitingItem,
  SupervisorException,
} from '@/types/supervisor';

/**
 * Mock data basado en el mockup oficial solomotorx-v3-automatizado.html.
 * Se reemplaza por fetch real en Paso 5 de la secuencia cuando backend
 * entregue GET /api/sales/supervisor/kpis, /waiting, /exceptions.
 */

export const MOCK_KPIS: SupervisorKPIs = {
  bot_resolved: { percentage: 89, count_today: 42, count_total_today: 47 },
  waiting_buyer: {
    count: 23,
    by_stage: { approval: 12, payment: 7, delivery: 4, rating: 0 },
  },
  exceptions: { count: 5 },
  closed_today: { count: 12, amount_usd: 3120 },
};

export const MOCK_WAITING: WaitingItem[] = [
  {
    id: 1,
    customer_name: 'Yorman Cuadra',
    customer_initials: 'YC',
    stage_reason: 'approval',
    stage_description: 'Cotización enviada',
    bot_log: 'Bot le recordó hace 2h · próximo recordatorio en 4h',
    amount_usd: 191,
    since_iso: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    customer_name: 'Ana Villegas',
    customer_initials: 'AV',
    stage_reason: 'approval',
    stage_description: 'Cotización kit servicio',
    bot_log: 'Bot mandó 3 recordatorios · sin respuesta',
    amount_usd: 615,
    since_iso: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    customer_name: 'Fullcar Carreras',
    customer_initials: 'FC',
    stage_reason: 'payment',
    stage_description: 'Aprobada · esperando transfer',
    bot_log: 'Bot envió datos bancarios · comprador vio',
    amount_usd: 420,
    since_iso: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    customer_name: 'Pedro Gómez',
    customer_initials: 'PG',
    stage_reason: 'delivery',
    stage_description: 'En ruta con motorizado',
    bot_log: 'ETA 18 min · comprador notificado',
    amount_usd: 148,
    since_iso: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    customer_name: 'Mariana Torres',
    customer_initials: 'MT',
    stage_reason: 'rating',
    stage_description: 'Entregado · pendiente reseña',
    bot_log: 'Bot pidió calificación · esperará 48h',
    amount_usd: 92,
    since_iso: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
  },
];

export const MOCK_EXCEPTIONS: SupervisorException[] = [
  {
    id: 1,
    kind: 'payment_no_match',
    title: 'Luisa García · $ 78',
    detail:
      'Comprobante BDV enviado, sin match en extracto bancario. Bot pidió referencia 3×, cliente dice que "ya pasó el pago". Requiere revisión manual.',
    primary_action: { label: 'REVISAR', kind: 'primary' },
    secondary_action: { label: 'CHAT', kind: 'secondary' },
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    kind: 'stock_zero_no_supplier',
    title: 'José Rivero · Balatas Chevrolet Aveo',
    detail:
      'Comprador aprobó cotización pero el SKU quedó en 0 por una venta previa. Bot no encuentra proveedor con stock. Requiere decidir: sustituir, reembolsar o importar.',
    primary_action: { label: 'RESOLVER', kind: 'primary' },
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    kind: 'unhappy_customer',
    title: 'Carlos Medina · ⭐⭐ 2 estrellas',
    detail:
      '"El motorizado tardó 3 horas y el empaque venía abierto." Bot ofreció descuento 10% próxima compra, cliente dice que quiere hablar con alguien. Intervención humana requerida.',
    primary_action: { label: 'LLAMAR', kind: 'primary' },
    secondary_action: { label: 'CHAT', kind: 'secondary' },
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    kind: 'ambiguity_unresolved',
    title: 'JM Distribuidora · Pregunta ML',
    detail:
      'Bot preguntó "¿Tiida 2012 sedán o hatchback?" 2 veces, el comprador responde con foto borrosa. IA no puede identificar el modelo. Humano debe leer la foto.',
    primary_action: { label: 'VER FOTO', kind: 'secondary' },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    kind: 'high_amount_policy',
    title: 'Autopartes FullCar · $ 4.200',
    detail:
      'Cotización automática superó el umbral de $ 2.000 y requiere aprobación humana antes de enviar (política configurada). Solo falta tu OK.',
    primary_action: { label: 'APROBAR', kind: 'secondary' },
    secondary_action: { label: 'EDITAR', kind: 'secondary' },
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];
