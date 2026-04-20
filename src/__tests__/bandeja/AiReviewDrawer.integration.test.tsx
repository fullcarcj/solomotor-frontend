/**
 * AiReviewDrawer — Tests de integración (Sprint 6B)
 *
 * Criterios:
 * - Drawer renderiza la lista de items cuando hay pending
 * - Aprobar → item removido del drawer + badge decrementado
 * - Rechazar → modal + item removido
 * - 409 legacy_archived_blocked → toast amigable + item removido
 * - Estado vacío cuando rows = []
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AiReviewDrawer from "@/app/(features)/bandeja/components/AiReviewDrawer";

/* ── Datos de prueba ──────────────────────────────────────────── */
const MOCK_PENDING_PAYLOAD = {
  rows: [
    {
      id: "5427",
      chat_id: "99",
      customer_id: "7",
      ai_reply_status: "needs_human_review",
      ai_reply_text: "Hola, confirmamos disponibilidad.",
      ai_reasoning: "tipo_m_plantilla",
      content: { text: "¿tienen el repuesto?", caption: null, mediaUrl: null, mimeType: null },
      created_at: new Date(Date.now() - 3 * 60_000).toISOString(),
      chat_phone: "+58414555001",
      source_type: "wa_inbound",
      channel_id: null,
      customer_full_name: "Ana López",
      customer_segment: null,
      message_text_preview: "¿tienen el repuesto?",
    },
    {
      id: "5408",
      chat_id: "88",
      customer_id: null,
      ai_reply_status: "needs_human_review",
      ai_reply_text: null,
      ai_reasoning: null,
      content: { text: "¿precio del filtro?", caption: null, mediaUrl: null, mimeType: null },
      created_at: new Date(Date.now() - 10 * 60_000).toISOString(),
      chat_phone: "+58424777002",
      source_type: "ml_question",
      channel_id: null,
      customer_full_name: null,
      customer_segment: null,
      message_text_preview: "¿precio del filtro?",
    },
  ],
  total: 2,
};

/* ── Helper: fetch que responde con pending list ──────────────── */
function mockFetchPending(overrides: Partial<typeof MOCK_PENDING_PAYLOAD> = {}) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (String(url).includes("pending")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ...MOCK_PENDING_PAYLOAD, ...overrides }),
      } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
  });
}

describe("AiReviewDrawer — estado vacío", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows: [], total: 0 }),
    } as Response);
  });
  afterEach(() => vi.restoreAllMocks());

  it("muestra mensaje 'Todo al día' cuando rows está vacío", async () => {
    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() =>
      expect(screen.getByText(/Todo al día/)).toBeDefined()
    );
  });
});

describe("AiReviewDrawer — renderiza lista de items", () => {
  beforeEach(() => mockFetchPending());
  afterEach(() => vi.restoreAllMocks());

  it("muestra el nombre del primer cliente", async () => {
    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => expect(screen.getByText("Ana López")).toBeDefined());
  });

  it("muestra el phone del segundo cliente (fallback sin nombre)", async () => {
    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => expect(screen.getByText("+58424777002")).toBeDefined());
  });

  it("header muestra el count correcto", async () => {
    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => expect(screen.getByText("2")).toBeDefined());
  });
});

describe("AiReviewDrawer — flujo Aprobar", () => {
  beforeEach(() => mockFetchPending());
  afterEach(() => vi.restoreAllMocks());

  it("aprobar el item 5427 lo remueve de la lista", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("pending")) {
        return Promise.resolve({ ok: true, json: async () => MOCK_PENDING_PAYLOAD } as Response);
      }
      if (String(url).includes("approve")) {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => screen.getByText("Ana López"));

    // Click Aprobar en el primer item
    const approveButtons = screen.getAllByText(/Aprobar/);
    fireEvent.click(approveButtons[0]);

    await waitFor(() => expect(screen.queryByText("Ana López")).toBeNull());
  });
});

describe("AiReviewDrawer — flujo Rechazar", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("pending")) {
        return Promise.resolve({ ok: true, json: async () => MOCK_PENDING_PAYLOAD } as Response);
      }
      if (String(url).includes("reject")) {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("click Rechazar abre el modal de confirmación", async () => {
    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => screen.getByText("Ana López"));

    const rejectButtons = screen.getAllByText(/Rechazar/);
    fireEvent.click(rejectButtons[0]);

    expect(screen.getByText("¿Rechazar sin enviar?")).toBeDefined();
  });

  it("confirmar rechazo remueve el item de la lista", async () => {
    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => screen.getByText("Ana López"));

    const rejectButtons = screen.getAllByText(/Rechazar/);
    fireEvent.click(rejectButtons[0]);

    // Confirmar: el modal de confirmación tiene aria-label="Confirmar rechazo"
    await waitFor(() => screen.getByRole("dialog", { name: "Confirmar rechazo" }));
    const modal = screen.getByRole("dialog", { name: "Confirmar rechazo" });
    const confirmBtn = modal.querySelector("button[style*='background: rgb(239, 68, 68)']") as HTMLElement;
    if (confirmBtn) fireEvent.click(confirmBtn);

    await waitFor(() => expect(screen.queryByText("Ana López")).toBeNull());
  });
});

describe("AiReviewDrawer — 409 legacy_archived_blocked", () => {
  afterEach(() => vi.restoreAllMocks());

  it("409 legacy_archived_blocked → item removido sin crash", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("pending")) {
        return Promise.resolve({ ok: true, json: async () => MOCK_PENDING_PAYLOAD } as Response);
      }
      if (String(url).includes("approve")) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ code: "legacy_archived_blocked" }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    render(<AiReviewDrawer open onClose={() => undefined} />);
    await waitFor(() => screen.getByText("Ana López"));

    const approveButtons = screen.getAllByText(/Aprobar/);
    fireEvent.click(approveButtons[0]);

    // El item debe removerse aunque el servidor rechazó con 409
    await waitFor(() => expect(screen.queryByText("Ana López")).toBeNull());
  });
});

describe("AiReviewDrawer — backdrop cierra el panel", () => {
  afterEach(() => vi.restoreAllMocks());

  it("click en backdrop llama a onClose", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows: [], total: 0 }),
    } as Response);

    const onClose = vi.fn();
    const { container } = render(<AiReviewDrawer open onClose={onClose} />);

    // El backdrop es el primer div fijo con onClick
    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    if (backdrop) fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
