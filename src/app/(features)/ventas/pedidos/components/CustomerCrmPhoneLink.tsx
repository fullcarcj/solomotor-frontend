"use client";

import Link from "next/link";

export type CustomerCrmPhoneLinkProps = {
  /** Teléfono o línea concatenada (`phone / phone_2`). Se usa para `wa.me` y como texto por defecto. */
  phone?: string | null;
  /** Si existe, en modo `auto` o `bandeja` el enlace abre la conversación en Bandeja. */
  chatId?: string | number | null;
  className?: string;
  /** Si se pasa, sustituye el texto mostrado (el `href` sigue según `variant` y `chatId` / `phone`). */
  children?: React.ReactNode;
  /**
   * `auto`: con `chatId` → Bandeja; si no, `wa.me` con el primer número de `phone`.
   * `whatsapp`: siempre `wa.me` (primer segmento si hay ` / `).
   * `bandeja`: solo enlace a Bandeja; sin `chatId` muestra texto sin enlace.
   */
  variant?: "auto" | "whatsapp" | "bandeja";
};

function firstPhoneSegment(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const sep = " / ";
  const i = t.indexOf(sep);
  return i >= 0 ? t.slice(0, i).trim() : t;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export default function CustomerCrmPhoneLink({
  phone,
  chatId,
  className,
  children,
  variant = "auto",
}: CustomerCrmPhoneLinkProps) {
  const raw = phone != null && String(phone).trim() !== "" ? String(phone).trim() : "";
  const label = children != null ? children : raw || "—";
  const hasChat = chatId != null && String(chatId).trim() !== "";

  if (children == null && !raw) {
    return <span className={className ?? "text-muted"}>—</span>;
  }

  const openBandeja =
    variant !== "whatsapp" &&
    hasChat &&
    (variant === "bandeja" || variant === "auto");

  if (openBandeja) {
    return (
      <Link
        href={`/bandeja/${encodeURIComponent(String(chatId).trim())}`}
        className={className}
        title="Abrir conversación en Bandeja"
      >
        {label}
      </Link>
    );
  }

  if (variant === "bandeja" && !hasChat) {
    return <span className={className}>{label}</span>;
  }

  const seg = firstPhoneSegment(raw);
  const d = digitsOnly(seg);
  if (!d) {
    return <span className={className}>{label}</span>;
  }

  return (
    <a
      href={`https://wa.me/${d}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={`WhatsApp: ${seg}`}
    >
      {label}
    </a>
  );
}
