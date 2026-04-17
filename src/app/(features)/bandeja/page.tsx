"use client";
import ChatList from "./components/ChatList";

export default function BandejaPage() {
  return (
    <div className="page-wrapper">
      <div className="content p-0" style={{ height: "calc(100vh - 60px)", overflow: "hidden" }}>
        <div className="row g-0 h-100">
          {/* Lista de chats */}
          <div className="col-12 col-md-4 h-100">
            <ChatList />
          </div>

          {/* Panel vacío — desktop */}
          <div className="col-md-8 d-none d-md-flex align-items-center justify-content-center h-100"
               style={{ borderLeft: "1px solid var(--bs-border-color)", background: "#f8f9fa" }}>
            <div className="text-center text-muted">
              <i className="ti ti-message-2 d-block mb-3" style={{ fontSize: "3rem", opacity: 0.3 }} />
              <p className="mb-0">Seleccioná una conversación para ver los mensajes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
