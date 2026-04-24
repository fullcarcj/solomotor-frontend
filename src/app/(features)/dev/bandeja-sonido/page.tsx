"use client";

import { useCallback } from "react";
import {
  unlockBandejaAudio,
  playInboxInboundSound,
  playNewMessageSound,
  playNewSaleSound,
  playUrgentSound,
} from "@/lib/realtime/sounds";

/**
 * Página mínima para validar sonidos (misma API que SSE en producción).
 * Ruta: /dev/bandeja-sonido
 */
export default function BandejaSonidoDevPage() {
  const playDefault = useCallback(() => {
    unlockBandejaAudio();
    playNewMessageSound();
  }, []);

  const playWa = useCallback(() => {
    unlockBandejaAudio();
    playInboxInboundSound("wa");
  }, []);

  const playMlQuestion = useCallback(() => {
    unlockBandejaAudio();
    playInboxInboundSound("ml_question");
  }, []);

  const playMlMessage = useCallback(() => {
    unlockBandejaAudio();
    playInboxInboundSound("ml_message");
  }, []);

  const playVenta = useCallback(() => {
    unlockBandejaAudio();
    playNewSaleSound();
  }, []);

  const playUrgente = useCallback(() => {
    unlockBandejaAudio();
    playUrgentSound();
  }, []);

  const playFb = useCallback(() => {
    unlockBandejaAudio();
    playInboxInboundSound("fb_page");
  }, []);

  return (
    <div className="content container-fluid py-5" style={{ maxWidth: 640 }}>
      <h1 className="h4 mb-3">Prueba de sonido — bandeja</h1>
      <p className="text-muted small mb-4">
        El navegador exige un gesto (clic) antes de reproducir audio. WhatsApp usa voz del sistema
        (TTS): «Mensaje en WhatsApp.» Facebook usa doble pitido (700 Hz → 900 Hz).
      </p>
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={playDefault}>
          Default (sin tipo)
        </button>
        <button type="button" className="btn btn-success btn-sm" onClick={playWa}>
          WA (TTS)
        </button>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={playMlQuestion}>
          Pregunta ML
        </button>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={playMlMessage}>
          Mensaje ML
        </button>
        <button type="button" className="btn btn-outline-info btn-sm" onClick={playVenta}>
          Nueva venta
        </button>
        <button type="button" className="btn btn-outline-warning btn-sm" onClick={playUrgente}>
          Urgente
        </button>
        <button
          type="button"
          className="btn btn-sm"
          style={{ background: "#0866ff", color: "#fff", border: "none" }}
          onClick={playFb}
        >
          Facebook Messenger
        </button>
      </div>
    </div>
  );
}
