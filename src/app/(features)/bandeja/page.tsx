/**
 * /bandeja — columna derecha vacía.
 * Lista INBOX + triaje vive en BandejaShell (layout) y no se remonta al abrir un chat.
 */
export default function BandejaPage() {
  return (
    <div
      className="bandeja-panel-right--empty d-none d-md-flex flex-column text-center px-4"
      aria-label="Sin conversación seleccionada"
    >
      <i className="ti ti-message-2" style={{ fontSize: "2.5rem" }} />
      <p className="mb-0" style={{ fontSize: 13 }}>
        Seleccioná una conversación para ver los mensajes
      </p>
      <p style={{ fontSize: 11, color: "var(--mu-ink-mute)", marginTop: 4 }}>
        o usa los filtros de la izquierda
      </p>
    </div>
  );
}
