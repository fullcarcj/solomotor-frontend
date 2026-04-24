/**
 * ChannelBadge · ADR-007
 *
 * Renderiza un badge visual del canal de origen de la conversación.
 * Diseño según mockup solomotorx-modulo-ventas.html (ch-badge sobre el avatar).
 *
 * Prioridad de resolución:
 *   1. channel_id (cuando el backend lo exponga en la raíz de InboxChat)
 *   2. source_type (proxy actual mientras no haya channel_id en raíz)
 *
 * Los 5 canales de ADR-007:
 *   1 = WhatsApp        (wa_inbound)
 *   2 = MercadoLibre    (ml_question, ml_message)
 *   3 = E-commerce      (eco_*)
 *   4 = Fuerza de venta (fv_*)
 *   5 = Mostrador/Directo
 */

export type ChannelKey = "wa" | "ml" | "eco" | "fv" | "direct" | "fb" | "fbmp";

interface ChannelDef {
  label: string;
  short: string;
  /** Color de fondo del badge */
  bg: string;
  /** Color del texto */
  fg: string;
}

const CHANNEL_DEFS: Record<ChannelKey, ChannelDef> = {
  wa:     { label: "WhatsApp",         short: "W",  bg: "#25d366", fg: "#0a0b08" },
  ml:     { label: "MercadoLibre",     short: "M",  bg: "#fff159", fg: "#0a0b08" },
  eco:    { label: "E-commerce",       short: "E",  bg: "#6ab6ff", fg: "#0a0b08" },
  fv:     { label: "Fuerza de venta",  short: "F",  bg: "#ff6a3d", fg: "#0a0b08" },
  direct: { label: "Mostrador",        short: "D",  bg: "#8a8a8a", fg: "#0a0b08" },
  fb:     { label: "Facebook Messenger",  short: "FB", bg: "#0866ff", fg: "#ffffff" },
  fbmp:   { label: "FB Marketplace",      short: "MP", bg: "#1877f2", fg: "#ffffff" },
};

/**
 * Deriva el canal a partir del source_type (proxy mientras channel_id
 * no esté en la raíz del payload de inbox).
 * - wa_ml_linked → "wa" visual (el título indica el origen compuesto)
 * - null / "" → "direct" (fallback neutral)
 */
export function sourceTypeToChannel(sourceType: string | null | undefined): ChannelKey {
  if (!sourceType) return "direct";
  if (sourceType === "wa_inbound" || sourceType === "wa_ml_linked") return "wa";
  if (sourceType === "ml_question" || sourceType === "ml_message") return "ml";
  if (sourceType === "fb_page")    return "fb";
  if (sourceType === "fbmp_edge")  return "fbmp";
  if (sourceType.startsWith("eco")) return "eco";
  if (sourceType.startsWith("fv") || sourceType === "mostrador") return "fv";
  return "direct";
}

/** Etiqueta larga para title/aria del canal (incluye sufijo para wa_ml_linked). */
function channelLabel(channelKey: ChannelKey, sourceType?: string | null): string {
  const base = CHANNEL_DEFS[channelKey].label;
  if (sourceType === "wa_ml_linked") return `${base} ↔ MercadoLibre`;
  return base;
}

/**
 * Mapea channel_id numérico (ADR-007) al ChannelKey.
 * Actualizar cuando backend confirme los IDs canónicos.
 */
export function channelIdToKey(channelId: number): ChannelKey {
  switch (channelId) {
    case 1: return "wa";
    case 2: return "ml";
    case 3: return "eco";
    case 4: return "fv";
    case 5: return "direct";
    default: return "direct";
  }
}

interface Props {
  /** channel_id numérico (ADR-007) — preferido cuando esté disponible */
  channelId?: number | null;
  /** source_type string — fallback cuando no hay channel_id */
  sourceType?: string | null;
  /** Tamaño del badge (default: "sm") */
  size?: "sm" | "md";
  /** Si true, renderiza como badge superpuesto sobre avatar (position:absolute) */
  overlay?: boolean;
}

/**
 * Badge visual del canal de origen.
 *
 * @example overlay en avatar:
 *   <div style={{ position: "relative" }}>
 *     <Avatar />
 *     <ChannelBadge channelId={chat.channel_id} sourceType={chat.source_type} overlay />
 *   </div>
 *
 * @example inline (en header):
 *   <ChannelBadge channelId={chat.channel_id} sourceType={chat.source_type} />
 */
export default function ChannelBadge({
  channelId,
  sourceType = "",
  size = "sm",
  overlay = false,
}: Props) {
  const channelKey: ChannelKey =
    channelId != null
      ? channelIdToKey(channelId)
      : sourceTypeToChannel(sourceType);

  const def = CHANNEL_DEFS[channelKey];
  const label = channelLabel(channelKey, channelId == null ? sourceType : undefined);

  const dim = size === "sm" ? 16 : 20;
  const fontSize = size === "sm" ? 8 : 10;

  const style: React.CSSProperties = {
    width: dim,
    height: dim,
    borderRadius: "50%",
    background: def.bg,
    color: def.fg,
    display: "grid",
    placeItems: "center",
    fontSize,
    fontWeight: 800,
    border: "2px solid var(--mu-bg, #151611)",
    lineHeight: 1,
    flexShrink: 0,
    ...(overlay ? {
      position: "absolute",
      bottom: -2,
      right: -2,
    } : {}),
  };

  return (
    <span
      className="ch-badge"
      style={style}
      title={label}
      aria-label={`Canal: ${label}`}
    >
      {def.short}
    </span>
  );
}
