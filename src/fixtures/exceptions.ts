import type { Exception } from '@/types/exceptions';

const now = new Date();
const ago = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();

export const FIXTURE_EXCEPTIONS: Exception[] = [
  {
    id: 301,
    chat_id: 4332,
    code: 'SKU_NOT_FOUND',
    reason: 'El cliente solicitó el SKU-9999 que no existe en el catálogo. El bot no pudo resolver la consulta.',
    status: 'OPEN',
    created_by: null,
    created_at: ago(130),
    resolved_by: null,
    resolved_at: null,
    resolution_notes: null,
  },
  {
    id: 302,
    chat_id: 4891,
    code: 'PAYMENT_AMBIGUOUS',
    reason: 'El comprobante enviado no coincide con ninguna orden abierta del cliente. Monto: $45.00, esperado: $52.30.',
    status: 'OPEN',
    created_by: null,
    created_at: ago(95),
    resolved_by: null,
    resolved_at: null,
    resolution_notes: null,
  },
  {
    id: 303,
    chat_id: 5012,
    code: 'AI_LOW_CONFIDENCE',
    reason: 'Confianza del bot por debajo del umbral mínimo (0.38) para la acción handoff_decision en 3 intentos consecutivos.',
    status: 'OPEN',
    created_by: null,
    created_at: ago(70),
    resolved_by: null,
    resolved_at: null,
    resolution_notes: null,
  },
  {
    id: 304,
    chat_id: 5234,
    code: 'STOCK_INSUFFICIENT',
    reason: 'Stock disponible: 0 unidades para SKU-8821. Cliente solicitó 3 unidades. Sin proveedor alternativo registrado.',
    status: 'RESOLVED',
    created_by: null,
    created_at: ago(200),
    resolved_by: 7,
    resolved_at: ago(50),
    resolution_notes: 'Se ofreció alternativa SKU-8820 con compatibilidad verificada. Cliente aceptó.',
  },
];
