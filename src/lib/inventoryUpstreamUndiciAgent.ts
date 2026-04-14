import { Agent } from "node:undici";

/**
 * El `fetch` global de Node (undici) corta por defecto a ~300s esperando cabeceras.
 * El listado de inventario puede superarlo si el PG / Render está frío o la query es pesada.
 */
export const inventoryUpstreamAgent = new Agent({
  headersTimeout: 15 * 60 * 1000,
  bodyTimeout: 15 * 60 * 1000,
  connectTimeout: 60 * 1000,
});
