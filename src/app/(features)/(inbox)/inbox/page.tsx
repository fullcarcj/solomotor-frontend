import { redirect } from "next/navigation";

/**
 * Ruta legacy `/inbox` — la bandeja canónica vive en `/bandeja`.
 * `next.config.ts` también emite 308 permanente hacia `/bandeja`.
 * Esta página evita compilar el monolito eliminado (`src/components/inbox/`).
 */
export default function LegacyInboxRedirectPage() {
  redirect("/bandeja");
}
