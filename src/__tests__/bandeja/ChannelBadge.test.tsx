import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChannelBadge, {
  sourceTypeToChannel,
  channelIdToKey,
} from "@/app/(features)/bandeja/components/ChannelBadge";

/* ── Mapeo de source_type ──────────────────────────────────── */
describe("sourceTypeToChannel", () => {
  it("mapea wa_inbound → wa", () => {
    expect(sourceTypeToChannel("wa_inbound")).toBe("wa");
  });
  it("mapea ml_question → ml", () => {
    expect(sourceTypeToChannel("ml_question")).toBe("ml");
  });
  it("mapea ml_message → ml", () => {
    expect(sourceTypeToChannel("ml_message")).toBe("ml");
  });
  it("mapea eco_* → eco", () => {
    expect(sourceTypeToChannel("eco_web")).toBe("eco");
  });
  it("mapea fv_* → fv", () => {
    expect(sourceTypeToChannel("fv_mostrador")).toBe("fv");
  });
  it("mapea desconocido → direct", () => {
    expect(sourceTypeToChannel("unknown_channel")).toBe("direct");
  });
});

/* ── Mapeo de channel_id numérico ──────────────────────────── */
describe("channelIdToKey", () => {
  it("1 → wa", ()     => expect(channelIdToKey(1)).toBe("wa"));
  it("2 → ml", ()     => expect(channelIdToKey(2)).toBe("ml"));
  it("3 → eco", ()    => expect(channelIdToKey(3)).toBe("eco"));
  it("4 → fv", ()     => expect(channelIdToKey(4)).toBe("fv"));
  it("5 → direct", () => expect(channelIdToKey(5)).toBe("direct"));
  it("99 → direct (fallback)", () => expect(channelIdToKey(99)).toBe("direct"));
});

/* ── Renderizado del componente ────────────────────────────── */
describe("ChannelBadge render", () => {
  it("muestra la letra 'W' para WhatsApp (source_type)", () => {
    render(<ChannelBadge sourceType="wa_inbound" />);
    expect(screen.getByText("W")).toBeDefined();
  });

  it("muestra la letra 'M' para ML (source_type)", () => {
    render(<ChannelBadge sourceType="ml_question" />);
    expect(screen.getByText("M")).toBeDefined();
  });

  it("usa channel_id sobre source_type cuando ambos están", () => {
    // channel_id=3 (eco) pero source_type="wa_inbound"
    render(<ChannelBadge channelId={3} sourceType="wa_inbound" />);
    expect(screen.getByText("E")).toBeDefined();
  });

  it("tiene aria-label con el nombre del canal", () => {
    render(<ChannelBadge sourceType="wa_inbound" />);
    expect(screen.getByLabelText("Canal: WhatsApp")).toBeDefined();
  });

  it("aplica position:absolute cuando overlay=true", () => {
    const { container } = render(<ChannelBadge sourceType="wa_inbound" overlay />);
    const badge = container.querySelector(".ch-badge") as HTMLElement;
    expect(badge.style.position).toBe("absolute");
  });

  it("NO aplica position:absolute por defecto", () => {
    const { container } = render(<ChannelBadge sourceType="wa_inbound" />);
    const badge = container.querySelector(".ch-badge") as HTMLElement;
    expect(badge.style.position).not.toBe("absolute");
  });
});
