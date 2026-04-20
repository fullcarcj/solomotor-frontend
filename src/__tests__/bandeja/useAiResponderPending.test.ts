/**
 * useAiResponderPending — Tests unitarios (Sprint 6B)
 *
 * Criterios:
 * - Mock fetch → estado loading → rows parseadas correctamente
 * - Error state cuando fetch falla
 * - Manejo de payload vacío / malformado
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAiResponderPending } from "@/hooks/useAiResponderPending";
import type { AiPendingMessage } from "@/hooks/useAiResponderPending";

const MOCK_ROW: AiPendingMessage = {
  id: "5427",
  chat_id: "99",
  customer_id: "7",
  ai_reply_status: "needs_human_review",
  ai_reply_text: "Hola, confirmamos disponibilidad.",
  ai_reasoning: "tipo_m_plantilla",
  content: { text: "¿tienen el repuesto?", caption: null, mediaUrl: null, mimeType: null },
  created_at: "2026-04-20T13:22:25.344Z",
  chat_phone: "+58414555001",
  source_type: "wa_inbound",
  channel_id: null,
  customer_full_name: "Carlos Pérez",
  customer_segment: "retail",
  message_text_preview: "¿tienen el repuesto?",
};

const MOCK_PAYLOAD = { rows: [MOCK_ROW], total: 1 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAiResponderPending — estado de carga y datos", () => {
  it("inicia en loading=true con rows vacías antes de resolver", async () => {
    let resolvePromise!: (v: unknown) => void;
    const pending = new Promise((r) => { resolvePromise = r; });
    global.fetch = vi.fn().mockReturnValue(pending);

    const { result } = renderHook(() => useAiResponderPending());
    expect(result.current.loading).toBe(true);
    expect(result.current.rows).toHaveLength(0);

    // Resolver para no dejar promise colgada
    act(() => resolvePromise({ ok: true, json: async () => MOCK_PAYLOAD }));
  });

  it("parsea rows correctamente tras fetch exitoso", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_PAYLOAD,
    } as Response);

    const { result } = renderHook(() => useAiResponderPending());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].id).toBe("5427");
    expect(result.current.rows[0].ai_reply_text).toBe("Hola, confirmamos disponibilidad.");
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("pone error cuando fetch devuelve !ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    } as Response);

    const { result } = renderHook(() => useAiResponderPending());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.error).toBeTruthy();
    expect(result.current.rows).toHaveLength(0);
  });

  it("pone error cuando fetch lanza excepción", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useAiResponderPending());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.error).toBe("Network Error");
    expect(result.current.rows).toHaveLength(0);
  });

  it("filtra filas malformadas (sin id)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        rows: [{ id: "", ai_reply_status: "needs_human_review" }, MOCK_ROW],
        total: 2,
      }),
    } as Response);

    const { result } = renderHook(() => useAiResponderPending());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    // Solo la fila con id válido se incluye
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].id).toBe("5427");
  });

  it("normaliza media_url (snake_case) a mediaUrl (camelCase)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        rows: [{
          ...MOCK_ROW,
          content: { media_url: "https://cdn.example.com/img.jpg", mime_type: "image/jpeg" },
        }],
        total: 1,
      }),
    } as Response);

    const { result } = renderHook(() => useAiResponderPending());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.rows[0].content.mediaUrl).toBe("https://cdn.example.com/img.jpg");
    expect(result.current.rows[0].content.mimeType).toBe("image/jpeg");
  });
});
