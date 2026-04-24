"use client";

import { useCallback } from "react";
import { unlockBandejaAudio, playNewMessageSound, playUrgentSound } from "@/lib/realtime/sounds";

/**
 * Página mínima para validar pitido / MP3 (misma API que SSE en producción).
 * Ruta: /dev/bandeja-sonido
 */
export default function BandejaSonidoDevPage() {
  const playNormal = useCallback(() => {
    unlockBandejaAudio();
    playNewMessageSound();
  }, []);

  const playUrgente = useCallback(() => {
    unlockBandejaAudio();
    playUrgentSound();
  }, []);

  return (
    <div className="content container-fluid py-5" style={{ maxWidth: 560 }}>
      <h1 className="h4 mb-3">Prueba de sonido — bandeja</h1>
      <p className="text-muted small mb-4">
        El navegador exige un gesto (clic) antes de reproducir audio. Esto usa las mismas funciones
        que al llegar un mensaje por SSE (<code>unlockBandejaAudio</code> + <code>playNewMessageSound</code>).
      </p>
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={playNormal}>
          Reproducir sonido mensaje nuevo
        </button>
        <button type="button" className="btn btn-outline-warning" onClick={playUrgente}>
          Reproducir sonido urgente
        </button>
      </div>
    </div>
  );
}
