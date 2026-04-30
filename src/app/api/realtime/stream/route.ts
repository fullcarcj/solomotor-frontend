import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Agent, request as undiciRequest } from "undici";
import { receiverBase, receiverSseHeaders } from "@/lib/bandejaReceiverProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Agente undici para SSE:
 * - headersTimeout: 30 s para recibir la primera cabecera
 * - bodyTimeout: 0 → sin límite (SSE es un stream infinito)
 * - keepAlive para reutilizar el socket TCP
 */
const sseAgent = new Agent({
  /** Arranque lento del receiver local; evita cortar justo antes de la primera cabecera SSE */
  headersTimeout: 120_000,
  bodyTimeout: 0,
  connectTimeout: 45_000,
});

export async function GET(req: NextRequest) {
  // Reenviar search params del cliente (?lastEventId=...) al receptor.
  const clientUrl = new URL(req.url);
  const targetUrl = `${receiverBase()}/api/realtime/stream${clientUrl.search}`;

  try {
    const { statusCode, body } = await undiciRequest(targetUrl, {
      method: "GET",
      headers: receiverSseHeaders(req),
      dispatcher: sseAgent,
      // Pasamos la señal de abort del cliente para limpiar el upstream cuando el navegador cierra
      signal: req.signal ?? undefined,
    });

    if (statusCode !== 200) {
      const text = await body.text().catch(() => String(statusCode));
      return new NextResponse(text, { status: statusCode });
    }

    /**
     * `body` es un Node.js Readable (undici).
     * Lo envolvemos en un Web ReadableStream que Next.js puede transmitir.
     */
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        const safeClose = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            /* ya cerrado */
          }
        };
        body.on("data", (chunk: Buffer) => {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            /* stream cerrado */
          }
        });
        body.on("end", () => {
          safeClose();
        });
        body.on("close", () => {
          safeClose();
        });
        body.on("error", (err: Error) => {
          console.warn("[BFF realtime/stream] upstream cerrado o error:", err?.message || err);
          safeClose();
        });

        // Si el cliente (navegador) desconecta → destruir el upstream
        req.signal?.addEventListener("abort", () => {
          body.destroy();
          safeClose();
        }, { once: true });
      },
      cancel() {
        body.destroy();
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    // AbortError = cliente desconectó antes de que llegara la respuesta
    if (e instanceof Error && (e.name === "AbortError" || ("code" in e && e.code === "ERR_ABORTED"))) {
      return new NextResponse(null, { status: 499 });
    }
    console.error("[BFF realtime/stream GET]", e);
    return NextResponse.json({ error: "Error de red hacia el receiver." }, { status: 502 });
  }
}
