"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  myPendingChatId: string | null;
}

export default function TakeBlockedModal({ open, onClose, myPendingChatId }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal d-block"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 10500 }}
      role="dialog"
      aria-modal
      aria-labelledby="take-blocked-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ background: "var(--mu-panel)", color: "var(--mu-ink)", border: "1px solid var(--mu-line)" }}>
          <div className="modal-header border-secondary border-opacity-25">
            <h5 className="modal-title" id="take-blocked-title">
              No puedes tomar este chat
            </h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="mb-0">
              Debés responder o liberar tu conversación actual antes de tomar una nueva.
            </p>
          </div>
          <div className="modal-footer border-secondary border-opacity-25">
            {myPendingChatId ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  router.push(`/bandeja/${myPendingChatId}`);
                  onClose();
                }}
              >
                Ir a mi chat actual
              </button>
            ) : null}
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
