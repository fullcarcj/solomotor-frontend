import { redirect } from "next/navigation";

/**
 * Ruta legacy `/inbox` — la bandeja canónica vive en `/bandeja`.
 * `next.config.ts` también emite 308 permanente hacia `/bandeja`.
 * Paso 3.5: el monolito legacy fue eliminado; no reintroducir tipos duplicados (`ChatStage` canónico en `@/types/inbox`).
 */
export default function LegacyInboxRedirectPage() {
  redirect("/bandeja");
}
