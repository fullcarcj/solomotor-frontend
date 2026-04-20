/**
 * Node fetch() falla con "TypeError: fetch failed" sin detalle; la causa real
 * suele estar en error.cause (p. ej. ECONNREFUSED, ENOTFOUND).
 */
export function formatUpstreamFetchError(
  error: unknown,
  targetUrl: string
): {
  message: string;
  detail?: string;
  code?: string;
  hint?: string;
  upstream: string;
} {
  const baseMsg = error instanceof Error ? error.message : String(error);

  let detail: string | undefined;
  let code: string | undefined;

  if (error instanceof Error && error.cause !== undefined) {
    const c = error.cause;
    if (c instanceof Error) {
      detail = c.message;
      const errno = c as NodeJS.ErrnoException;
      if (typeof errno.code === "string") code = errno.code;
    } else {
      detail = String(c);
    }
  }

  const hint = hintForUpstream(code, detail);

  return {
    message: baseMsg,
    ...(detail ? { detail } : {}),
    ...(code ? { code } : {}),
    ...(hint ? { hint } : {}),
    upstream: targetUrl,
  };
}

function hintForUpstream(code?: string, detail?: string): string | undefined {
  if (code === "ECONNREFUSED") {
    return "Nada escucha en esa URL. Levantá el backend, revisá el puerto y BACKEND_URL. En local probá http://127.0.0.1:PUERTO si localhost falla (IPv6).";
  }
  if (code === "ECONNRESET") {
    return "El backend cerró la conexión inesperadamente (ECONNRESET). Verificá que el servidor esté corriendo y sin errores internos.";
  }
  if (code === "ENOTFOUND") {
    return "No se resolvió el host: revisá BACKEND_URL (typo o DNS).";
  }
  if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || code === "ABORT_ERR" || code === "TimeoutError") {
    return "Timeout al conectar: el backend no respondió en 12 s. Verificá que esté corriendo.";
  }
  if (
    detail?.includes("certificate") ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  ) {
    return "Problema de certificado TLS hacia el backend.";
  }
  return undefined;
}
