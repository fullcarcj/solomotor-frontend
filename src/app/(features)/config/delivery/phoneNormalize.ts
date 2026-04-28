/**
 * Normaliza un teléfono móvil VE al formato exigido por la API: 584XXXXXXXXX (12 dígitos).
 */
export function normalizeVePhoneTo584(raw: string): string | undefined {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return undefined;
  if (d.startsWith("58") && d.length === 12) return d;
  if (d.length === 11 && d.startsWith("0") && d[1] === "4") return `58${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("4")) return `58${d}`;
  return undefined;
}
