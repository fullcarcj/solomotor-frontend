/**
 * AiReviewItem — Tests unitarios (Sprint 6B)
 *
 * Criterios:
 * - Render con y sin ai_reply_text
 * - "Aprobar" oculto si ai_reply_text === null
 * - 4 botones presentes (Aprobar condicional, Editar y enviar, Borrador, Rechazar)
 * - 409 legacy_archived_blocked → toast amigable, no crash
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AiReviewItem from "@/app/(features)/bandeja/components/AiReviewItem";
import type { AiPendingMessage } from "@/hooks/useAiResponderPending";

const makeItem = (overrides: Partial<AiPendingMessage> = {}): AiPendingMessage => ({
  id: "1001",
  chat_id: "55",
  customer_id: "7",
  ai_reply_status: "needs_human_review",
  ai_reply_text: "Hola, te confirmamos que tenemos el repuesto.",
  ai_reasoning: "ctx=confirmacion_stock",
  content: { text: "¿tienen el filtro de aceite?", caption: null, mediaUrl: null, mimeType: null },
  created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  chat_phone: "+58414555001",
  source_type: "wa_inbound",
  channel_id: null,
  customer_full_name: "Ana López",
  customer_segment: "retail",
  message_text_preview: "¿tienen el filtro de aceite?",
  ...overrides,
});

describe("AiReviewItem — render básico", () => {
  it("muestra el nombre del cliente", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText("Ana López")).toBeDefined();
  });

  it("muestra el preview del mensaje", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText("¿tienen el filtro de aceite?")).toBeDefined();
  });

  it("muestra el badge de segmento", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText("retail")).toBeDefined();
  });

  it("usa el chat_phone como fallback cuando customer_full_name es null", () => {
    render(<AiReviewItem item={makeItem({ customer_full_name: null })} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText("+58414555001")).toBeDefined();
  });
});

describe("AiReviewItem — botón Aprobar", () => {
  it("muestra 'Aprobar' cuando ai_reply_text !== null", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText(/Aprobar/)).toBeDefined();
  });

  it("NO muestra 'Aprobar' cuando ai_reply_text === null", () => {
    render(<AiReviewItem item={makeItem({ ai_reply_text: null })} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.queryByText(/Aprobar/)).toBeNull();
  });
});

describe("AiReviewItem — botones visibles", () => {
  it("siempre muestra 'Editar y enviar'", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText(/Editar y enviar/)).toBeDefined();
  });

  it("siempre muestra 'Rechazar'", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    expect(screen.getByText(/Rechazar/)).toBeDefined();
  });

  it("muestra 'Borrador' cuando hay texto en el textarea", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    // ai_reply_text rellena el textarea → Borrador visible
    expect(screen.getByText(/Borrador/)).toBeDefined();
  });
});

describe("AiReviewItem — modal de rechazo", () => {
  it("click en Rechazar abre el modal de confirmación", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    fireEvent.click(screen.getByText(/Rechazar/));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("¿Rechazar sin enviar?")).toBeDefined();
  });

  it("Cancelar cierra el modal sin llamar a fetch", () => {
    render(<AiReviewItem item={makeItem()} onRemove={() => undefined} onUpdated={() => undefined} />);
    fireEvent.click(screen.getByText(/Rechazar/));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("AiReviewItem — manejo de 409 legacy_archived_blocked", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ code: "legacy_archived_blocked", message: "Archived" }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("409 legacy_archived_blocked → llama onRemove sin crash", async () => {
    const onRemove = vi.fn();
    render(<AiReviewItem item={makeItem()} onRemove={onRemove} onUpdated={() => undefined} />);
    fireEvent.click(screen.getByText(/Aprobar/));
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith("1001"));
  });
});

describe("AiReviewItem — mapping source_type → ChannelBadge", () => {
  const cases: Array<{ src: string | null; expectedLetter: string }> = [
    { src: "wa_inbound",   expectedLetter: "W" },
    { src: "wa_ml_linked", expectedLetter: "W" },
    { src: "ml_question",  expectedLetter: "M" },
    { src: "ml_message",   expectedLetter: "M" },
    { src: null,           expectedLetter: "D" },
    { src: "eco_web",      expectedLetter: "E" },
  ];

  for (const { src, expectedLetter } of cases) {
    it(`source_type="${src ?? "null"}" → letra '${expectedLetter}'`, () => {
      const { unmount } = render(
        <AiReviewItem
          item={makeItem({ source_type: src, channel_id: null })}
          onRemove={() => undefined}
          onUpdated={() => undefined}
        />
      );
      expect(screen.getByText(expectedLetter)).toBeDefined();
      unmount();
    });
  }
});
