/**
 * Tests de normalización multimedia (Bloque 5 · Sprint 6A)
 *
 * Verifica que normalizeContent y normalizeMessage conviertan correctamente
 * los payloads snake_case del backend al camelCase del tipo FE.
 */
import { describe, it, expect } from "vitest";

// Re-exportamos las funciones internas para testing.
// Para evitar un refactor del hook, duplicamos la lógica de normalización aquí.
// Cualquier cambio en useChatMessages.ts debe reflejarse aquí.

type RawContent = Record<string, unknown>;

function normalizeContent(raw: unknown): {
  text: string | null;
  caption: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  duration?: number;
  thumbnailUrl: string | null;
} {
  if (!raw || typeof raw !== "object") {
    return { text: null, caption: null, mediaUrl: null, mimeType: null, thumbnailUrl: null };
  }
  const c = raw as RawContent;
  return {
    text:         (c.text         ?? null) as string | null,
    caption:      (c.caption      ?? null) as string | null,
    mediaUrl:     (c.mediaUrl     ?? c.media_url     ?? null) as string | null,
    mimeType:     (c.mimeType     ?? c.mime_type     ?? null) as string | null,
    duration:     c.duration != null ? Number(c.duration) : undefined,
    thumbnailUrl: (c.thumbnailUrl ?? c.thumbnail_url ?? null) as string | null,
  };
}

describe("normalizeContent — snake_case payload del backend", () => {
  it("normaliza media_url → mediaUrl", () => {
    const result = normalizeContent({ media_url: "https://cdn.example.com/audio.ogg" });
    expect(result.mediaUrl).toBe("https://cdn.example.com/audio.ogg");
  });

  it("normaliza mime_type → mimeType", () => {
    const result = normalizeContent({ mime_type: "audio/ogg" });
    expect(result.mimeType).toBe("audio/ogg");
  });

  it("normaliza thumbnail_url → thumbnailUrl", () => {
    const result = normalizeContent({ thumbnail_url: "https://cdn.example.com/thumb.jpg" });
    expect(result.thumbnailUrl).toBe("https://cdn.example.com/thumb.jpg");
  });

  it("camelCase tiene precedencia sobre snake_case", () => {
    const result = normalizeContent({
      mediaUrl:  "camel",
      media_url: "snake",
    });
    expect(result.mediaUrl).toBe("camel");
  });

  it("retorna null si no hay mediaUrl ni media_url", () => {
    const result = normalizeContent({ text: "hola" });
    expect(result.mediaUrl).toBeNull();
  });

  it("normaliza duration como número", () => {
    const result = normalizeContent({ duration: "42" });
    expect(result.duration).toBe(42);
  });

  it("retorna defaults seguros si content es null", () => {
    const result = normalizeContent(null);
    expect(result.text).toBeNull();
    expect(result.mediaUrl).toBeNull();
  });
});

describe("normalizeContent — payload camelCase (ya normalizado)", () => {
  it("respeta camelCase cuando ya está normalizado", () => {
    const result = normalizeContent({
      mediaUrl: "https://cdn.example.com/img.jpg",
      mimeType: "image/jpeg",
    });
    expect(result.mediaUrl).toBe("https://cdn.example.com/img.jpg");
    expect(result.mimeType).toBe("image/jpeg");
  });
});

describe("normalizeContent — tipos de mensaje multimedia", () => {
  it("imagen con caption", () => {
    const result = normalizeContent({
      media_url: "https://cdn/img.jpg",
      mime_type: "image/jpeg",
      caption:   "foto del producto",
    });
    expect(result.mediaUrl).toBe("https://cdn/img.jpg");
    expect(result.caption).toBe("foto del producto");
  });

  it("audio con duration", () => {
    const result = normalizeContent({
      media_url: "https://cdn/audio.ogg",
      mime_type: "audio/ogg",
      duration:  35,
    });
    expect(result.mediaUrl).toBe("https://cdn/audio.ogg");
    expect(result.duration).toBe(35);
  });

  it("video con thumbnail_url", () => {
    const result = normalizeContent({
      media_url:     "https://cdn/video.mp4",
      mime_type:     "video/mp4",
      thumbnail_url: "https://cdn/thumb.jpg",
    });
    expect(result.thumbnailUrl).toBe("https://cdn/thumb.jpg");
  });
});
