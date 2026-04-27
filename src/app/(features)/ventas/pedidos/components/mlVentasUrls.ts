const ML_SITE_ORIGIN: Record<string, string> = {
  MLV: "https://www.mercadolibre.com.ve",
  MLA: "https://www.mercadolibre.com.ar",
  MLB: "https://www.mercadolibre.com.br",
  MCO: "https://www.mercadolibre.com.co",
  MLC: "https://www.mercadolibre.cl",
  MGT: "https://www.mercadolibre.com.gt",
  MEC: "https://www.mercadolibre.com.ec",
  MLM: "https://www.mercadolibre.com.mx",
  MLU: "https://www.mercadolibre.com.uy",
  MPA: "https://www.mercadolibre.com.pa",
  MPE: "https://www.mercadolibre.com.pe",
  MBO: "https://www.mercadolibre.com.bo",
  MCR: "https://www.mercadolibre.co.cr",
  MRD: "https://www.mercadolibre.com.do",
  MHN: "https://www.mercadolibre.com.hn",
  MNI: "https://www.mercadolibre.com.ni",
  MPY: "https://www.mercadolibre.com.py",
  MSV: "https://www.mercadolibre.com.sv",
};

/** URL pública de la venta en el sitio ML (por `site_id` de la orden). */
export function mlVentasOrderUrl(
  siteId: string | null | undefined,
  orderId: number | null | undefined
): string | null {
  if (orderId == null || !Number.isFinite(orderId) || orderId <= 0) return null;
  const s = (siteId || "").trim().toUpperCase();
  const origin = ML_SITE_ORIGIN[s] || "https://www.mercadolibre.com";
  return `${origin}/ventas/${orderId}`;
}
