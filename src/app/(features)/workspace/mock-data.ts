/**
 * Mock data para /workspace · Fase A (UI pixel-perfect).
 * Todos los textos, nombres, montos y tags están copiados VERBATIM del
 * mockup `solomotorx-modulo-ventas (2).html`. No inventar ni "mejorar".
 *
 * DEV-ONLY. En Fase B se reemplaza por los hooks reales (ver sección 8
 * del prompt: /api/inbox, /api/crm/chats/:id/messages, etc.).
 */

// ── Pipeline maestro (7 pasos) ─────────────────────────────────
export interface PipelineStep {
  n: string;
  label: string;
  status: 'done' | 'active' | 'pending';
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { n: '01', label: 'Conversación',      status: 'done'    },
  { n: '02', label: 'Cotización',        status: 'done'    },
  { n: '03', label: 'Aprobación',        status: 'active'  },
  { n: '04', label: 'Conciliar pago',    status: 'pending' },
  { n: '05', label: 'Solicitar despacho', status: 'pending' },
  { n: '06', label: 'Calificar',         status: 'pending' },
  { n: '07', label: 'Cerrar venta',      status: 'pending' },
];

// ── Pipeline mini (header convo) ───────────────────────────────
export interface MiniStep {
  label: string;
  status: 'done' | 'current' | 'pending';
}

export const MINI_PIPELINE: MiniStep[] = [
  { label: '01 · CONVERSACIÓN', status: 'done'    },
  { label: '02 · COTIZACIÓN',   status: 'done'    },
  { label: '03 · APROBACIÓN',   status: 'current' },
  { label: '04 · PAGO',         status: 'pending' },
  { label: '05 · DESPACHO',     status: 'pending' },
  { label: '06 · CALIFICAR',    status: 'pending' },
  { label: '07 · CIERRE',       status: 'pending' },
];

// ── Lista de conversaciones ────────────────────────────────────
export type AvatarTone =
  | 'solomotor' | 'blue' | 'orange' | 'violet' | 'green' | 'yellow';
export type ChannelBadge = 'wa' | 'ml' | 'eco' | 'fv';
export type ConvTagKind = 'cot' | 'apr' | 'pag' | 'des' | 'cer' | 'new';

export interface ConvTag {
  kind: ConvTagKind;
  label: string;
}

export interface Conversation {
  id: string;
  avatarInitials: string;
  avatarTone: AvatarTone;
  channel: ChannelBadge;
  channelLetter: string; // W/M/E/F
  name: string;
  preview: string;
  time: string;
  tags: ConvTag[];
  unread?: number;
  active?: boolean;
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'cj-79416',
    avatarInitials: 'YC',
    avatarTone: 'blue',
    channel: 'wa',
    channelLetter: 'W',
    name: 'Yorman Cuadra',
    preview: 'Es que te iba a decir que pasarás solo una parte pero…',
    time: '18:04',
    tags: [
      { kind: 'apr', label: 'Aprobada'  },
      { kind: 'cot', label: '#CJ-79416' },
    ],
    unread: 3,
    active: true,
  },
  {
    id: 'fullcar-new',
    avatarInitials: 'A',
    avatarTone: 'orange',
    channel: 'fv',
    channelLetter: 'F',
    name: 'Autopartes y Carrocería FullCar',
    preview: '📍 FULLCAR CJ CA, Calle Coromoto, Quinta Cruz María E…',
    time: '17:20',
    tags: [
      { kind: 'cot', label: 'Cotización' },
      { kind: 'new', label: 'Nueva'      },
    ],
  },
  {
    id: 'fullcar-carreras',
    avatarInitials: 'FC',
    avatarTone: 'violet',
    channel: 'wa',
    channelLetter: 'W',
    name: 'Fullcar Carreras',
    preview: 'Daniel Moto FC: Motorizado José · Orden 79416 Sector L…',
    time: '16:29',
    tags: [
      { kind: 'des', label: 'En despacho' },
    ],
  },
  {
    id: 'alibaba-sulin',
    avatarInitials: 'AL',
    avatarTone: 'yellow',
    channel: 'eco',
    channelLetter: 'E',
    name: 'Alibaba · Su Lin',
    preview: 'Hello Javier, you have a new reply from Su. Please check…',
    time: '16:26',
    tags: [
      { kind: 'cot', label: 'Cotización' },
    ],
    unread: 3,
  },
  {
    id: 'jm-distribuidora',
    avatarInitials: 'JM',
    avatarTone: 'green',
    channel: 'ml',
    channelLetter: 'M',
    name: 'JM Distribuidora · MercadoLibre',
    preview: 'Pregunta: ¿Aplica para Tiida 2012? Sí ya…',
    time: '16:22',
    tags: [
      { kind: 'pag', label: 'Por pagar' },
    ],
  },
  {
    id: 'ventas-mostrador',
    avatarInitials: 'VS',
    avatarTone: 'orange',
    channel: 'fv',
    channelLetter: 'F',
    name: 'Ventas_Solomotor · Mostrador',
    preview: 'Autopartes y Carrocerías FullCars: 📷 Foto · pastillas…',
    time: '13:39',
    tags: [
      { kind: 'cer', label: 'Cerrada' },
      { kind: 'apr', label: '$ 240'   },
    ],
  },
  {
    id: 'moto-daniel',
    avatarInitials: 'MP',
    avatarTone: 'blue',
    channel: 'wa',
    channelLetter: 'W',
    name: 'Motorizado Primo Daniel',
    preview: '✓✓ sí',
    time: '11:02',
    tags: [
      { kind: 'des', label: 'Ruta Sector L' },
    ],
  },
];

// ── Mensajes del hilo activo ───────────────────────────────────
export type MsgKind = 'them' | 'me' | 'system' | 'card';

export interface SystemMsg { kind: 'system'; text: string }
export interface TextMsg   { kind: 'them' | 'me'; text: string; time: string }
export interface CardMsg {
  kind: 'card';
  code: string;
  badge: string;
  items: { label: string; amount: string }[];
  total: string;
  actions: { label: string; primary?: boolean }[];
}

export type Msg = SystemMsg | TextMsg | CardMsg;

export const MESSAGES: Msg[] = [
  {
    kind: 'system',
    text: 'Conversación iniciada · Canal: WhatsApp · 17·abr 09:12',
  },
  {
    kind: 'them',
    text: 'Buenas Javier, necesito pastillas de freno delanteras para mi Toyota Corolla 2018. ¿Tienen?',
    time: '09:14',
  },
  {
    kind: 'me',
    text: 'Buenas Yorman 👋 Sí tenemos. Te armo cotización formal con disponibilidad y te la paso. Un momento.',
    time: '09:18 · leído',
  },
  {
    kind: 'system',
    text: 'Cotización generada · #COT-2026-0412 · Precios no se comparten por fuera del documento',
  },
  {
    kind: 'card',
    code: 'COTIZACIÓN · #COT-2026-0412',
    badge: '●  VIGENTE 72H',
    items: [
      { label: 'Pastillas freno del. Corolla 18', amount: '$ 48.00' },
      { label: 'Disco freno del. × 2',            amount: '$ 96.00' },
      { label: 'Líquido DOT-4 500ml',             amount: '$ 12.00' },
      { label: 'Mano de obra (instalación)',      amount: '$ 35.00' },
    ],
    total: 'USD 191.00',
    actions: [
      { label: 'Editar'    },
      { label: 'Duplicar'  },
      { label: 'Enviar PDF', primary: true },
    ],
  },
  {
    kind: 'them',
    text: 'Perfecto, apruebo. ¿Paso solo una parte hoy y el resto mañana cuando cobre?',
    time: '17:58',
  },
  {
    kind: 'system',
    text: 'COTIZACIÓN APROBADA · Esperando conciliación de pago',
  },
  {
    kind: 'them',
    text: 'Es que te iba a decir que pasarás solo una parte pero se me pasó 🙋‍♂️🙋‍♂️🙋‍♂️🙋‍♂️',
    time: '18:04',
  },
];

// ── Ficha · Productos ──────────────────────────────────────────
export type StockLevel = 'ok' | 'low' | 'no';

export interface FichaItem {
  icon: string;
  name: string;
  sku: string;
  stockLevel: StockLevel;
  stockLabel: string;
  qty: number;
  price: string;
}

export const FICHA_ITEMS: FichaItem[] = [
  { icon: '🛞', name: 'Pastillas freno del.', sku: 'SKU · TOY-BRK-COR18', stockLevel: 'ok',  stockLabel: '12 en stock', qty: 1, price: '48.00' },
  { icon: '⚙',  name: 'Disco freno del.',    sku: 'SKU · TOY-DSC-COR18', stockLevel: 'low', stockLabel: '2 en stock',  qty: 2, price: '48.00' },
  { icon: '🧴', name: 'Líquido DOT-4 500ml', sku: 'SKU · FLU-DOT4-500',  stockLevel: 'ok',  stockLabel: '38 en stock', qty: 1, price: '12.00' },
  { icon: '🔧', name: 'Mano de obra · Taller', sku: 'SVC · INST-FREN · Carlos G.', stockLevel: 'ok', stockLabel: '',    qty: 1, price: '35.00' },
];

// ── Ficha · Banco ──────────────────────────────────────────────
export interface BancoRow {
  title: string;
  ref: string;
  status: 'ok' | 'pending';
  amount: string;
}

export const BANCO_ROWS: BancoRow[] = [
  { title: 'Banesco · Pago móvil',    ref: 'REF 048291 · 17·abr',       status: 'ok',      amount: '+ $ 100 ✓'   },
  { title: 'BDV · Transferencia',     ref: 'Por recibir · saldo $ 91', status: 'pending', amount: '○ pendiente' },
];

// ── Modales · Cotización (detalles) ────────────────────────────
export interface CotRow {
  producto: string;
  cant: string;
  precio: string;
  total: string;
}

export const COT_ROWS: CotRow[] = [
  { producto: 'Pastillas · TOY-BRK-COR18',     cant: '1', precio: '48.00', total: '48.00' },
  { producto: 'Disco freno · TOY-DSC-COR18',   cant: '2', precio: '48.00', total: '96.00' },
  { producto: 'DOT-4 500ml · FLU-DOT4-500',    cant: '1', precio: '12.00', total: '12.00' },
  { producto: 'Instalación · INST-FREN',       cant: '1', precio: '35.00', total: '35.00' },
];

// ── Modales · Despacho ─────────────────────────────────────────
export interface DespStep {
  status: 'done' | 'current' | 'pending';
  dot: string;
  title: string;
  sub: string;
  time: string;
}

export const DESP_STEPS: DespStep[] = [
  { status: 'done',    dot: '✓', title: 'Orden preparada en almacén', sub: 'Bodega 1 · Pasillo C · Estante 4',   time: '17·abr 08:40' },
  { status: 'current', dot: '→', title: 'Asignando motorizado',       sub: 'Zona Sector L · Distancia 6.2 km',    time: 'EN CURSO'     },
  { status: 'pending', dot: '3', title: 'En ruta',                    sub: 'Tiempo estimado 25 min',              time: '—'             },
  { status: 'pending', dot: '4', title: 'Entregado',                  sub: 'Firma + foto de evidencia',           time: '—'             },
];

// ── Modales · Canales ──────────────────────────────────────────
export interface CanalRow {
  icon: string;
  iconTone: 'wa' | 'ml' | 'eco' | 'fv';
  name: string;
  desc: string;
  count: number;
}

export const CANALES: CanalRow[] = [
  { icon: '🛒', iconTone: 'eco', name: 'E-commerce · Tienda web',         desc: 'Pedidos con carrito + pasarela',                 count: 9  },
  { icon: '★',  iconTone: 'ml',  name: 'MercadoLibre',                    desc: 'Preguntas + mensajería interna del comprador',  count: 11 },
  { icon: '💬', iconTone: 'wa',  name: 'WhatsApp y Redes · Mostrador',    desc: 'Instagram DM · Facebook · WhatsApp',            count: 18 },
  { icon: '🚶', iconTone: 'fv',  name: 'Fuerza de venta · Calle',         desc: 'Vendedores que cargan pedido por app',          count: 9  },
];

// ── Modales · Stock ────────────────────────────────────────────
export const STOCK_BOXES: Array<{ n: number; label: string; tone: StockLevel }> = [
  { n: 2,  label: 'Bodega CJ',  tone: 'low' },
  { n: 14, label: 'Bodega MCY', tone: 'ok'  },
  { n: 0,  label: 'Tránsito',   tone: 'no'  },
];

// ── Calificar · tags ───────────────────────────────────────────
export interface CalTag { label: string; highlighted?: boolean }

export const CAL_TAGS: CalTag[] = [
  { label: '#rápido',       highlighted: true },
  { label: '#buen-trato',   highlighted: true },
  { label: '#recompra',     highlighted: true },
  { label: '#precio'                           },
  { label: '#producto-ok'                      },
];
