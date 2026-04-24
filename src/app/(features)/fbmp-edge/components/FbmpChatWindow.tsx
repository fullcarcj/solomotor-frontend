"use client";

import React, { useEffect, useRef, useState } from "react";
import type { FbmpThread } from "./FbmpThreadList";

interface Message {
  id: number;
  direction: "inbound" | "outbound";
  content: { text?: string };
  created_at: string;
}

interface Props {
  thread: FbmpThread | null;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
}

export default function FbmpChatWindow({ thread }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!thread) { setMessages([]); return; }
    setLoadingMsgs(true);
    fetch(`/api/bandeja/${thread.chat_id}?limit=60`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setMessages(Array.isArray(d.messages) ? d.messages : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [thread?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!thread || !text.trim() || sending) return;
    const body = text.trim();
    setText("");
    setSending(true);
    try {
      await fetch(`/api/fbmp-edge/threads/${thread.id}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          direction: "outbound",
          content: { text: body },
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (!thread) {
    return (
      <div className="fbmp-chat-area fbmp-empty-state">
        <p>Seleccioná una conversación</p>
      </div>
    );
  }

  return (
    <div className="fbmp-chat-window">
      <div className="fbmp-chat-header">
        <div>
          <div className="fbmp-chat-name">{thread.participant_name ?? thread.external_thread_id}</div>
          <div className="fbmp-chat-subtitle">FB Marketplace · {thread.external_thread_id}</div>
        </div>
      </div>

      <div className="fbmp-messages-scroll" ref={scrollRef}>
        {loadingMsgs && <p style={{ color: "#4a5568", fontSize: 12, textAlign: "center" }}>Cargando mensajes…</p>}
        {!loadingMsgs && messages.length === 0 && (
          <p style={{ color: "#4a5568", fontSize: 12, textAlign: "center" }}>Sin mensajes</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`fbmp-message-bubble ${m.direction}`}>
            {m.content?.text ?? ""}
            <div className="fbmp-bubble-time">{fmtTime(m.created_at)}</div>
          </div>
        ))}
      </div>

      <div className="fbmp-input-area">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribí un mensaje… (la extensión lo enviará a Facebook)"
          rows={1}
        />
        <button className="fbmp-send-btn" onClick={handleSend} disabled={!text.trim() || sending}>
          {sending ? "…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
