/**
 * Íconos de canal (20×20) copiados del mockup bandeja-definitiva.html
 */
export type ChannelIconVariant =
  | "wa"
  | "ml-msg"
  | "ml-preg"
  | "ecom"
  | "mostrador"
  | "fuerza";

export function ChannelIcon({
  channel,
  className = "",
}: {
  channel: ChannelIconVariant;
  className?: string;
}) {
  const cn = ["origen", className].filter(Boolean).join(" ");
  switch (channel) {
    case "wa":
      return (
        <span className={cn} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="5" fill="#25D366" />
            <path
              d="M17 13.5c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1s-.5.7-.7.8c-.1.2-.2.2-.5.1s-1-.4-1.9-1.1c-.7-.6-1.1-1.3-1.3-1.6s0-.3.1-.4c.1-.1.2-.2.3-.4l.2-.3c0-.1 0-.2 0-.4s-.5-1.2-.7-1.6-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3s-.8.8-.8 1.9.8 2.2.9 2.3c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1s-.2-.1-.4-.2z"
              fill="#fff"
            />
          </svg>
        </span>
      );
    case "ml-msg":
      return (
        <span className={cn} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="5" fill="#FFE600" />
            <path
              d="M6 9c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-5l-3 2.5V15H8c-1.1 0-2-.9-2-2V9z"
              fill="#2D3277"
            />
          </svg>
        </span>
      );
    case "ml-preg":
      return (
        <span className={cn} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="5" fill="#FFE600" />
            <text
              x="12"
              y="17.5"
              textAnchor="middle"
              fontFamily="Inter,sans-serif"
              fontSize="15"
              fontWeight="800"
              fill="#2D3277"
            >
              ?
            </text>
          </svg>
        </span>
      );
    case "ecom":
      return (
        <span className={cn} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="5" fill="#FF6B35" />
            <path
              d="M6 8h1.5l1.5 7h7l1.5-5H9"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="17.5" r="1" fill="#fff" />
            <circle cx="15" cy="17.5" r="1" fill="#fff" />
          </svg>
        </span>
      );
    case "mostrador":
      return (
        <span className={cn} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="5" fill="#3b82f6" />
            <path
              d="M4 10h16M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M4 10l2-5a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 5"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    case "fuerza":
      return (
        <span className={cn} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="5" fill="#FF6B35" />
            <path
              d="M12 5v14M5 12h14"
              stroke="#fff"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );
    default:
      return null;
  }
}
