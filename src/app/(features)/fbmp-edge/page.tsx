"use client";

import React, { useCallback, useEffect, useState } from "react";
import "./fbmp-edge-theme.scss";
import FbmpThreadList, { type FbmpThread } from "./components/FbmpThreadList";
import FbmpChatWindow from "./components/FbmpChatWindow";

export default function FbmpEdgePage() {
  const [threads, setThreads]           = useState<FbmpThread[]>([]);
  const [selected, setSelected]         = useState<FbmpThread | null>(null);
  const [loading, setLoading]           = useState(true);
  const [extensionActive, setExtActive] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const r = await fetch("/api/fbmp-edge/threads?limit=80", { credentials: "include" });
      const d = await r.json();
      if (d.items) setThreads(d.items);
    } catch (_) {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/fbmp-edge/status", { credentials: "include" });
      const d = await r.json();
      setExtActive(Boolean(d.enabled));
    } catch (_) {
      setExtActive(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    checkStatus();
    const interval = setInterval(() => {
      loadThreads();
      checkStatus();
    }, 15_000);
    return () => clearInterval(interval);
  }, [loadThreads, checkStatus]);

  return (
    <div className="fbmp-edge-shell">
      <FbmpThreadList
        threads={threads}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        loading={loading}
        extensionActive={extensionActive}
      />
      <div className="fbmp-chat-area">
        <FbmpChatWindow thread={selected} />
      </div>
    </div>
  );
}
