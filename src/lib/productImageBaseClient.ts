/**
 * Resuelve la base de URLs de imágenes en el cliente.
 * Si el build no inlined `NEXT_PUBLIC_*` (p. ej. Render), una sola petición al API sirve para toda la app.
 *
 * Importante: **no** guardar `""` en caché. Si la primera petición falla o viene vacía, `"" !== undefined`
 * haría que **todas** las miniaturas quedaran sin base para siempre (solo placeholders).
 */

let resolvedFromServer: string | undefined;
let inflight: Promise<string> | null = null;

export function resolveProductImageBase(staticBase: string): Promise<string> {
  const s = staticBase.trim();
  if (s) return Promise.resolve(s);
  if (resolvedFromServer) return Promise.resolve(resolvedFromServer);
  if (!inflight) {
    inflight = (async () => {
      try {
        const r = await fetch("/api/config/product-image-base", {
          cache: "no-store",
        });
        if (!r.ok) return "";
        const j = (await r.json()) as { baseUrl?: string };
        const b = String(j?.baseUrl ?? "").trim();
        if (b) resolvedFromServer = b;
        return b;
      } catch {
        return "";
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}
