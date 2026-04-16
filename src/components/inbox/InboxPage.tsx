"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import LifecyclePanel from "./LifecyclePanel";
import type {
  InboxChat,
  InboxCounts,
  InboxMessage,
  InboxSrcFilter,
  InboxViewFilter,
  InboxSourceType,
  LifecycleStage,
} from "./inboxTypes";

const COL1_BG = "#1a1a2e";
const COL1_TEXT = "rgba(255,255,255,0.7)";
const COL1_ACTIVE = "#FF6B2C";
const CHAT_BG = "#f0f0f4";
const SEND_GREEN = "#25D366";

const SOURCE_BADGE: Record<
  InboxSourceType,
  { label: string; bg: string; color: string }
> = {
  wa_inbound: { label: "WA", bg: "#e6f9ee", color: "#1a7a3a" },
  ml_question: { label: "ML Púb", bg: "#fff3cd", color: "#7a5000" },
  ml_message: { label: "ML Priv", bg: "#fff0e0", color: "#b05a00" },
  wa_ml_linked: { label: "WA+ML", bg: "#f0e6ff", color: "#6a1ab0" },
};

function getOperatorUserId(): number {
  const raw = process.env.NEXT_PUBLIC_INBOX_OPERATOR_ID;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function mapUrlFilterToView(f: string | null): InboxViewFilter {
  if (!f) return null;
  const filterMap: Record<string, InboxViewFilter> = {
    pending: "payment_pending",
    ship: "dispatch",
  };
  const mapped = filterMap[f];
  if (mapped) return mapped;
  if (f === "unread" || f === "quote" || f === "dispatch") return f as InboxViewFilter;
  return null;
}

function mapUrlSrcToFilter(s: string | null): InboxSrcFilter {
  if (s === "wa" || s === "ml") return s;
  if (s === "ml_question" || s === "ml_message" || s === "wa_ml_linked") return s;
  return null;
}

function isLifecycleStage(s: string): s is LifecycleStage {
  return (
    [
      "contact",
      "quote",
      "order",
      "payment",
      "dispatch",
      "closed",
      "ml_answer",
    ] as string[]
  ).includes(s);
}

function deriveLifecycleStage(
  chat: Pick<InboxChat, "source_type" | "order" | "lifecycle_stage">,
  hasActiveQuotation: boolean
): LifecycleStage {
  if (chat.source_type === "ml_question") return "ml_answer";
  if (chat.source_type === "ml_message") return "dispatch";
  const order = chat.order;
  const ps = order?.payment_status != null ? String(order.payment_status).toLowerCase() : "";
  if (order && ps === "pending") return "payment";
  if (order && (ps === "paid" || ps === "approved")) return "dispatch";
  if (!order && hasActiveQuotation) return "order";
  if (!order && !hasActiveQuotation) return "quote";
  return chat.lifecycle_stage ?? "contact";
}

function mapApiChat(raw: Record<string, unknown>): InboxChat {
  const orderRaw = raw.order as Record<string, unknown> | null | undefined;
  const order =
    orderRaw && typeof orderRaw === "object"
      ? {
          id: orderRaw.id != null ? Number(orderRaw.id) : undefined,
          payment_status:
            orderRaw.payment_status != null ? String(orderRaw.payment_status) : null,
        }
      : null;

  const paymentRaw = order?.payment_status ?? raw.payment_status;
  const payment_status =
    paymentRaw === "pending"
      ? "pending"
      : paymentRaw === "paid" || paymentRaw === "approved"
        ? "approved"
        : null;

  const source_type = (raw.source_type as InboxSourceType) ?? "wa_inbound";
  const identity_status = (raw.identity_status as InboxChat["identity_status"]) ?? "unknown";
  const lastAt = raw.last_message_at ?? raw.updated_at ?? raw.created_at;
  const lastMessageAt = lastAt ? new Date(String(lastAt)) : new Date();
  const customer_name = String(raw.customer_name ?? raw.full_name ?? "Sin nombre");
  const rawStage = raw.lifecycle_stage != null ? String(raw.lifecycle_stage) : "";
  const hasQ = false;
  const lifecycle_stage = isLifecycleStage(rawStage)
    ? rawStage
    : deriveLifecycleStage(
        { source_type, order, lifecycle_stage: "contact" },
        hasQ
      );

  return {
    id: Number(raw.id),
    source_type,
    customer_name,
    phone: raw.phone != null ? String(raw.phone) : null,
    last_message_text: String(raw.last_message_text ?? raw.preview ?? ""),
    last_message_at: lastMessageAt,
    unread_count: Number(raw.unread_count ?? 0),
    identity_status,
    lifecycle_stage,
    payment_status,
    channel_id: Number(raw.channel_id ?? 0),
    customer_id: raw.customer_id != null ? Number(raw.customer_id) : null,
    order,
    identity_candidates: raw.identity_candidates,
    ml_order_number:
      raw.ml_order_number != null
        ? String(raw.ml_order_number)
        : raw.ml_order_id != null
          ? String(raw.ml_order_id)
          : null,
  };
}

function withDerivedLifecycle(chat: InboxChat, hasActiveQuotation: boolean): InboxChat {
  return {
    ...chat,
    lifecycle_stage: deriveLifecycleStage(chat, hasActiveQuotation),
  };
}

function mapApiMessage(m: Record<string, unknown>): InboxMessage {
  const id = Number(m.id ?? m.message_id ?? 0);
  const direction: InboxMessage["direction"] =
    m.direction === "outbound" ? "outbound" : "inbound";
  let text = "";
  const content = m.content;
  if (content && typeof content === "object" && "text" in content) {
    text = String((content as { text?: string }).text ?? "");
  } else {
    text = String(m.body ?? m.text ?? "");
  }
  const typeRaw = m.type != null ? String(m.type) : "text";
  const type: InboxMessage["type"] =
    typeRaw === "system" ? "system" : typeRaw === "text" ? "text" : typeRaw;
  const created_at = m.created_at ? new Date(String(m.created_at)) : new Date();
  const media_url = m.media_url != null ? String(m.media_url) : undefined;
  return { id, direction, type, content: { text }, created_at, media_url };
}

function extractListPayload(body: unknown): { chats: InboxChat[]; nextCursor: string | null } {
  const b = body as Record<string, unknown>;
  const data = b.data as Record<string, unknown> | undefined;
  const rawList =
    (Array.isArray(data?.chats) ? data?.chats : null) ??
    (Array.isArray(b.chats) ? b.chats : null) ??
    (Array.isArray(data) ? data : null) ??
    [];
  const chats = (rawList as unknown[]).map((row) =>
    mapApiChat(row as Record<string, unknown>)
  );
  const nextCursor =
    (data?.nextCursor != null ? String(data.nextCursor) : null) ??
    (b.nextCursor != null ? String(b.nextCursor) : null) ??
    null;
  return { chats, nextCursor };
}

function extractCounts(body: unknown): Partial<InboxCounts> | null {
  const b = body as Record<string, unknown>;
  const d = (b.data as Record<string, unknown>) ?? b;
  if (!d || typeof d !== "object") return null;
  const num = (k: string) => Number(d[k] ?? 0);
  return {
    total: num("total"),
    unread: num("unread"),
    payment_pending: num("payment_pending"),
    quote: num("quote"),
    dispatch: num("dispatch"),
    wa: num("wa"),
    ml: num("ml"),
    ml_question: num("ml_question"),
    ml_message: num("ml_message"),
    wa_ml_linked: num("wa_ml_linked"),
  };
}

function defaultCounts(): InboxCounts {
  return {
    total: 0,
    unread: 0,
    payment_pending: 0,
    quote: 0,
    dispatch: 0,
    wa: 0,
    ml: 0,
    ml_question: 0,
    ml_message: 0,
    wa_ml_linked: 0,
  };
}

function mergeCounts(prev: InboxCounts | null, patch: Partial<InboxCounts> | null): InboxCounts {
  const base = prev ?? defaultCounts();
  if (!patch) return base;
  return { ...base, ...patch };
}

async function readJson(res: Response): Promise<unknown> {
  const t = await res.text();
  if (!t) return {};
  try {
    return JSON.parse(t);
  } catch {
    return { error: { message: t } };
  }
}

function handleAuthRedirect(res: Response): void {
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/signin";
  }
}

function lifecyclePills(chat: InboxChat) {
  const order: InboxChat["lifecycle_stage"][] = [
    "contact",
    "ml_answer",
    "quote",
    "order",
    "payment",
    "dispatch",
    "closed",
  ];
  const idx = order.indexOf(chat.lifecycle_stage);
  const labels: Record<string, string> = {
    contact: "Contacto",
    ml_answer: "ML",
    quote: "Cotiz.",
    order: "Orden",
    payment: "Pago",
    dispatch: "Desp.",
    closed: "Cerrado",
  };
  return order.map((stage, i) => {
    let st: CSSProperties = {
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 11,
      marginRight: 4,
      display: "inline-block",
    };
    if (i < idx) st = { ...st, background: "#d4edda", color: "#155724" };
    else if (i === idx) st = { ...st, background: COL1_ACTIVE, color: "#fff" };
    else st = { ...st, background: "#e9ecef", color: "#6c757d" };
    return (
      <span key={stage} style={st}>
        {labels[stage] ?? stage}
      </span>
    );
  });
}

export default function InboxPage() {
  const searchParams = useSearchParams();
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [filter, setFilter] = useState<InboxViewFilter>(null);
  const [src, setSrc] = useState<InboxSrcFilter>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [chats, setChats] = useState<InboxChat[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [counts, setCounts] = useState<InboxCounts | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [identityPayload, setIdentityPayload] = useState<Record<string, unknown> | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [quotationList, setQuotationList] = useState<unknown[] | null>(null);
  const [modal, setModal] = useState<"payment" | "quote" | "ml" | null>(null);
  const [paymentAttempts, setPaymentAttempts] = useState<Record<string, unknown>[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteResults, setQuoteResults] = useState<Record<string, unknown>[]>([]);
  const [quoteLines, setQuoteLines] = useState<
    { producto_id: number; cantidad: number; precio_unitario: number; label: string }[]
  >([]);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [mlQuestion, setMlQuestion] = useState("");
  const [mlIaFlag, setMlIaFlag] = useState(false);
  const [mlAnswerDraft, setMlAnswerDraft] = useState("");
  const [mlBusy, setMlBusy] = useState(false);
  const [selectedOrderIdForPayment, setSelectedOrderIdForPayment] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const f = mapUrlFilterToView(searchParams.get("filter"));
    const s = mapUrlSrcToFilter(searchParams.get("src"));
    setFilter(f);
    setSrc(s);
  }, [searchParams]);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox/counts", { cache: "no-store" });
      handleAuthRedirect(res);
      const body = await readJson(res);
      if (!res.ok) {
        const msg =
          (body as { error?: { message?: string } })?.error?.message ??
          `Error ${res.status}`;
        setCountsError(msg);
        return;
      }
      setCountsError(null);
      const patch = extractCounts(body);
      setCounts((prev) => mergeCounts(prev, patch));
    } catch {
      setCountsError("No se pudieron actualizar los conteos");
    }
  }, []);

  useEffect(() => {
    void fetchCounts();
    const id = window.setInterval(() => void fetchCounts(), 60_000);
    return () => window.clearInterval(id);
  }, [fetchCounts]);

  const buildInboxQuery = useCallback(
    (cursor: string | null) => {
      const params = new URLSearchParams();
      params.set("limit", "30");
      if (filter) params.set("filter", filter);
      if (src) params.set("src", src);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (cursor) params.set("cursor", cursor);
      return params;
    },
    [filter, src, debouncedSearch]
  );

  const loadChats = useCallback(
    async (opts: { reset: boolean; cursor?: string | null }) => {
      const { reset, cursor } = opts;
      if (reset) {
        setListLoading(true);
        setListError(null);
      } else {
        setListLoadingMore(true);
      }
      try {
        const params = buildInboxQuery(cursor ?? null);
        const res = await fetch(`/api/inbox?${params}`, { cache: "no-store" });
        handleAuthRedirect(res);
        const body = await readJson(res);
        if (res.status === 403) {
          setListError("Sin permisos para ver la bandeja.");
          setChats([]);
          return;
        }
        if (!res.ok) {
          const msg =
            (body as { error?: { message?: string } })?.error?.message ??
            `Error ${res.status}`;
          setListError(msg);
          return;
        }
        const { chats: page, nextCursor: nc } = extractListPayload(body);
        setNextCursor(nc);
        setChats((prev) => (reset ? page : [...prev, ...page]));
        setListError(null);
      } catch (e) {
        setListError(e instanceof Error ? e.message : "Error de red");
      } finally {
        setListLoading(false);
        setListLoadingMore(false);
      }
    },
    [buildInboxQuery]
  );

  useEffect(() => {
    setNextCursor(null);
    void loadChats({ reset: true, cursor: null });
  }, [filter, src, debouncedSearch, loadChats]);

  const onListScroll = useCallback(() => {
    const el = listScrollRef.current;
    if (!el || listLoadingMore || !nextCursor || listLoading) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      void loadChats({ reset: false, cursor: nextCursor });
    }
  }, [listLoading, listLoadingMore, loadChats, nextCursor]);

  useEffect(() => {
    if (!chats.length) {
      setSelectedChatId(null);
      return;
    }
    if (selectedChatId == null || !chats.some((c) => c.id === selectedChatId)) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const hasActiveQuotation = useMemo(() => {
    if (!quotationList?.length) return false;
    return quotationList.some((row) => {
      const r = row as Record<string, unknown>;
      const st = String(r.status ?? "").toLowerCase();
      return st === "draft" || st === "sent";
    });
  }, [quotationList]);

  const selectedForLifecycle = useMemo(() => {
    if (!selectedChat) return null;
    return withDerivedLifecycle(selectedChat, hasActiveQuotation);
  }, [selectedChat, hasActiveQuotation]);

  const displayChats = useMemo(
    () => chats.map((c) => withDerivedLifecycle(c, false)),
    [chats]
  );

  const fetchMessages = useCallback(async (chatId: number, silent?: boolean) => {
    if (!silent) {
      setMsgLoading(true);
      setMsgError(null);
    }
    try {
      const res = await fetch(`/api/crm/chats/${chatId}/messages`, { cache: "no-store" });
      handleAuthRedirect(res);
      const body = await readJson(res);
      if (!res.ok) {
        const msg =
          (body as { error?: { message?: string } })?.error?.message ??
          `Error ${res.status}`;
        if (!silent) setMsgError(msg);
        return;
      }
      const data = (body as { data?: unknown }).data ?? body;
      const arr = Array.isArray((data as { messages?: unknown[] })?.messages)
        ? (data as { messages: unknown[] }).messages
        : Array.isArray(data)
          ? (data as unknown[])
          : [];
      const mapped = (arr as Record<string, unknown>[]).map(mapApiMessage);
      setMessages((prev) => {
        if (silent && prev.length) {
          const maxPrev = Math.max(0, ...prev.map((m) => (m.id > 0 ? m.id : 0)));
          const fresh = mapped.filter((m) => m.id > maxPrev);
          if (!fresh.length) return prev;
          return [...prev, ...fresh];
        }
        return mapped;
      });
    } catch (e) {
      if (!silent) setMsgError(e instanceof Error ? e.message : "Error de red");
    } finally {
      if (!silent) setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChatId == null) {
      setMessages([]);
      return;
    }
    void fetchMessages(selectedChatId, false);
    const id = window.setInterval(() => {
      void fetchMessages(selectedChatId, true);
    }, 5000);
    return () => window.clearInterval(id);
  }, [selectedChatId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  useEffect(() => {
    if (!selectedChat) {
      setIdentityPayload(null);
      setQuotationList(null);
      return;
    }
    const st = selectedChat.identity_status;
    if (st !== "unknown" && st !== "declared") {
      setIdentityPayload(null);
      setIdentityLoading(false);
    } else {
      setIdentityLoading(true);
      void (async () => {
        try {
          const res = await fetch(
            `/api/inbox/${selectedChat.id}/identity-candidates`,
            { cache: "no-store" }
          );
          handleAuthRedirect(res);
          const body = (await readJson(res)) as Record<string, unknown>;
          if (res.ok) {
            const data = (body.data as Record<string, unknown>) ?? body;
            setIdentityPayload(data as Record<string, unknown>);
          } else setIdentityPayload(null);
        } catch {
          setIdentityPayload(null);
        } finally {
          setIdentityLoading(false);
        }
      })();
    }

    void (async () => {
      try {
        const res = await fetch(`/api/inbox/quotations/${selectedChat.id}`, {
          cache: "no-store",
        });
        handleAuthRedirect(res);
        const body = await readJson(res);
        if (!res.ok) {
          setQuotationList(null);
          return;
        }
        const data = (body as { data?: unknown }).data ?? body;
        const list = Array.isArray((data as { quotations?: unknown[] })?.quotations)
          ? (data as { quotations: unknown[] }).quotations
          : Array.isArray(data)
            ? (data as unknown[])
            : [];
        setQuotationList(list);
      } catch {
        setQuotationList(null);
      }
    })();
  }, [selectedChat]);

  useEffect(() => {
    if (modal !== "payment" || !selectedChat) return;
    setPaymentLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/inbox/${selectedChat.id}/payments/pending`,
          { cache: "no-store" }
        );
        handleAuthRedirect(res);
        const body = await readJson(res);
        const data = (body as { data?: unknown }).data ?? body;
        const list = Array.isArray((data as { attempts?: unknown[] })?.attempts)
          ? (data as { attempts: unknown[] }).attempts
          : Array.isArray((data as { payments?: unknown[] })?.payments)
            ? (data as { payments: unknown[] }).payments
            : Array.isArray(data)
              ? (data as unknown[])
              : [];
        setPaymentAttempts(list as Record<string, unknown>[]);
        const ord = selectedChat.order?.id;
        setSelectedOrderIdForPayment(ord != null ? ord : null);
      } catch {
        setPaymentAttempts([]);
      } finally {
        setPaymentLoading(false);
      }
    })();
  }, [modal, selectedChat]);

  useEffect(() => {
    if (modal !== "quote") {
      setQuoteResults([]);
      return;
    }
    const q = quoteSearch.trim();
    if (q.length < 2) {
      setQuoteResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ q, limit: "20" });
          const res = await fetch(`/api/inventory/products/search?${params}`, {
            cache: "no-store",
          });
          const body = await readJson(res);
          if (!res.ok) return;
          const data = (body as { data?: unknown }).data ?? body;
          const rows = Array.isArray((data as { products?: unknown[] })?.products)
            ? (data as { products: unknown[] }).products
            : Array.isArray(data)
              ? (data as unknown[])
              : [];
          setQuoteResults(rows as Record<string, unknown>[]);
        } catch {
          setQuoteResults([]);
        }
      })();
    }, 350);
    return () => window.clearTimeout(t);
  }, [modal, quoteSearch]);

  useEffect(() => {
    if (modal !== "ml" || !selectedChat) return;
    setMlBusy(true);
    void (async () => {
      try {
        const res = await fetch(`/api/inbox/${selectedChat.id}/ml-question`, {
          cache: "no-store",
        });
        const body = (await readJson(res)) as Record<string, unknown>;
        if (res.ok) {
          const data = (body.data as Record<string, unknown>) ?? body;
          setMlQuestion(String(data.question_text ?? ""));
          setMlIaFlag(Boolean(data.ia_already_answered));
        } else {
          setMlQuestion("");
          setMlIaFlag(false);
        }
      } catch {
        setMlQuestion("");
      } finally {
        setMlBusy(false);
      }
    })();
  }, [modal, selectedChat]);

  const sendDraft = useCallback(async () => {
    const text = draft.trim();
    const sid = selectedChatId;
    if (!text || sid == null) return;
    const tempId = -Date.now();
    const optimistic: InboxMessage = {
      id: tempId,
      direction: "outbound",
      type: "text",
      content: { text },
      created_at: new Date(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      const res = await fetch(`/api/crm/chats/${sid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sent_by: getOperatorUserId() }),
        cache: "no-store",
      });
      handleAuthRedirect(res);
      const body = await readJson(res);
      if (!res.ok) {
        const msg =
          (body as { error?: { message?: string } })?.error?.message ?? "No se pudo enviar";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, pending: false, error: true, content: { text: `${m.content.text} (${msg})` } } : m
          )
        );
        return;
      }
      await fetchMessages(sid, false);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, pending: false, error: true } : m
        )
      );
    }
  }, [draft, selectedChatId, fetchMessages]);

  const countsSafe = counts ?? defaultCounts();

  const navItem = (
    label: string,
    active: boolean,
    count: number,
    onClick: () => void
  ) => (
    <button
      type="button"
      key={label}
      onClick={onClick}
      className="d-flex align-items-center justify-content-between w-100 text-start border-0 mb-1 py-2 px-2 rounded-1"
      style={{
        background: active ? "rgba(255,107,44,0.12)" : "transparent",
        color: active ? COL1_ACTIVE : COL1_TEXT,
        borderLeft: active ? `2px solid ${COL1_ACTIVE}` : "2px solid transparent",
        fontSize: 13,
      }}
    >
      <span>{label}</span>
      <span
        className="badge rounded-pill"
        style={{
          background: active ? COL1_ACTIVE : "rgba(255,255,255,0.15)",
          color: active ? "#fff" : COL1_TEXT,
          fontSize: 11,
        }}
      >
        {count}
      </span>
    </button>
  );

  const groupLabel = (t: string) => (
    <div
      className="text-uppercase small fw-semibold mt-3 mb-2 px-2"
      style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: "0.06em" }}
    >
      {t}
    </div>
  );

  const candidates = (identityPayload?.candidates ?? identityPayload) as
    | Record<string, unknown>
    | undefined;
  const phoneMatches = Array.isArray(candidates?.phoneMatches)
    ? (candidates?.phoneMatches as Record<string, unknown>[])
    : [];
  const mlBuyerMatches = Array.isArray(candidates?.mlBuyerMatches)
    ? (candidates?.mlBuyerMatches as Record<string, unknown>[])
    : [];
  const keywordHint = Boolean(candidates?.keywordHint);

  const linkCustomer = async (
    customerId: number,
    link_type: "phone" | "ml_buyer"
  ) => {
    if (!selectedChat) return;
    const res = await fetch(`/api/inbox/${selectedChat.id}/link-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        confirmed_by: getOperatorUserId(),
        link_type,
      }),
    });
    handleAuthRedirect(res);
    if (res.ok) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === selectedChat.id ? { ...c, identity_status: "manual_linked" } : c
        )
      );
      setIdentityPayload(null);
    }
  };

  const confidenceBadge = (label: string) => {
    const l = label.toLowerCase();
    if (l === "high")
      return <span className="badge bg-success ms-1">Alta</span>;
    if (l === "medium")
      return <span className="badge bg-warning text-dark ms-1">Media</span>;
    return <span className="badge bg-danger ms-1">Revisar</span>;
  };

  return (
    <div
      className="page-wrapper"
      style={{
        minHeight: "calc(100vh - 60px)",
        height: "calc(100vh - 60px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {countsError && (
        <div className="alert alert-warning py-1 px-3 mb-0 small rounded-0">
          Conteos: {countsError}
        </div>
      )}
      <div
        className="content"
        style={{
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="d-flex flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
          <aside
            className="flex-shrink-0 overflow-auto"
            style={{
              width: 180,
              background: COL1_BG,
              color: COL1_TEXT,
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="p-2">
              {groupLabel("Vista")}
              {navItem("Todas", filter === null && src === null, countsSafe.total, () => {
                setFilter(null);
                setSrc(null);
              })}
              {navItem("Sin leer", filter === "unread", countsSafe.unread, () => {
                setFilter("unread");
                setSrc(null);
              })}
              {navItem(
                "Pago pendiente",
                filter === "payment_pending",
                countsSafe.payment_pending,
                () => {
                  setFilter("payment_pending");
                  setSrc(null);
                }
              )}
              {navItem("Cotizar", filter === "quote", countsSafe.quote, () => {
                setFilter("quote");
                setSrc(null);
              })}
              {navItem("Despachar", filter === "dispatch", countsSafe.dispatch, () => {
                setFilter("dispatch");
                setSrc(null);
              })}

              {groupLabel("Fuente")}
              {navItem("WhatsApp", src === "wa", countsSafe.wa, () => {
                setSrc("wa");
                setFilter(null);
              })}
              {navItem("MercadoLibre", src === "ml", countsSafe.ml, () => {
                setSrc("ml");
                setFilter(null);
              })}

              {groupLabel("Tareas ML")}
              {navItem("Preguntas ML", src === "ml_question", countsSafe.ml_question, () => {
                setSrc("ml_question");
                setFilter(null);
              })}
              {navItem("Mensajería ML", src === "ml_message", countsSafe.ml_message, () => {
                setSrc("ml_message");
                setFilter(null);
              })}
              {navItem("WA + orden ML", src === "wa_ml_linked", countsSafe.wa_ml_linked, () => {
                setSrc("wa_ml_linked");
                setFilter(null);
              })}
            </div>
          </aside>

          <div
            className="flex-shrink-0 d-flex flex-column overflow-hidden border-end bg-white"
            style={{ width: 260 }}
          >
            <div className="p-2 border-bottom flex-shrink-0">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Buscar nombre o teléfono…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div
              className="flex-grow-1 overflow-auto"
              ref={listScrollRef}
              onScroll={onListScroll}
            >
              {listError && (
                <div className="p-2">
                  <p className="small text-danger mb-1">{listError}</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => void loadChats({ reset: true, cursor: null })}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {listLoading && (
                <p className="small text-muted p-3 mb-0">Cargando conversaciones…</p>
              )}
              {!listLoading &&
                displayChats.map((c) => {
                  const b = SOURCE_BADGE[c.source_type];
                  const active = c.id === selectedChatId;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedChatId(c.id)}
                      className="w-100 text-start border-0 border-bottom p-2"
                      style={{
                        background: active ? "rgba(255,107,44,0.08)" : "#fff",
                        borderLeft: active ? `3px solid ${COL1_ACTIVE}` : "3px solid transparent",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span
                          className="badge rounded-pill"
                          style={{ background: b.bg, color: b.color, fontSize: 10 }}
                        >
                          {b.label}
                        </span>
                        <span className="small text-muted">{formatTime(c.last_message_at)}</span>
                      </div>
                      <div className="fw-semibold small text-dark text-truncate">
                        {c.customer_name}
                      </div>
                      <div className="small text-muted text-truncate">{c.last_message_text}</div>
                      <div className="mt-1">{lifecyclePills(c)}</div>
                    </button>
                  );
                })}
              {!listLoading && !displayChats.length && !listError && (
                <p className="small text-muted p-3 mb-0">Sin conversaciones con este filtro.</p>
              )}
              {listLoadingMore && (
                <p className="small text-muted text-center py-2 mb-0">Cargando más…</p>
              )}
            </div>
          </div>

          <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ background: CHAT_BG }}>
            {selectedChat ? (
              <>
                <div className="flex-shrink-0 bg-white border-bottom px-3 py-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: "#6c757d",
                        fontSize: 14,
                      }}
                    >
                      {initials(selectedChat.customer_name)}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-bold text-truncate">{selectedChat.customer_name}</div>
                      <div className="small text-muted text-truncate">
                        {selectedChat.phone ?? `ML · orden #${selectedChat.ml_order_number ?? "—"}`}
                      </div>
                    </div>
                    <span
                      className="badge rounded-pill flex-shrink-0"
                      style={{
                        background: SOURCE_BADGE[selectedChat.source_type].bg,
                        color: SOURCE_BADGE[selectedChat.source_type].color,
                      }}
                    >
                      {SOURCE_BADGE[selectedChat.source_type].label}
                    </span>
                  </div>

                  {identityLoading && (
                    <div className="small text-muted mt-2">Analizando identidad…</div>
                  )}

                  {selectedChat.identity_status === "manual_linked" && (
                    <div className="alert alert-success py-1 px-2 small mb-0 mt-2">
                      Cliente vinculado
                    </div>
                  )}

                  {phoneMatches.length > 0 && (
                    <div className="alert alert-warning py-1 px-2 small mb-0 mt-2 d-flex flex-wrap align-items-center gap-2">
                      <span>
                        Posible cliente:{" "}
                        <strong>{String(phoneMatches[0].full_name ?? phoneMatches[0].name ?? "")}</strong>{" "}
                        · Confirmar
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-dark"
                        onClick={() => {
                          const id = Number(phoneMatches[0].id ?? phoneMatches[0].customer_id);
                          if (id) void linkCustomer(id, "phone");
                        }}
                      >
                        Confirmar
                      </button>
                    </div>
                  )}
                  {mlBuyerMatches.length > 0 && (
                    <div className="alert alert-warning py-1 px-2 small mb-0 mt-2 d-flex flex-wrap align-items-center gap-2">
                      <span>
                        Comprador ML encontrado:{" "}
                        <strong>
                          {String(mlBuyerMatches[0].full_name ?? mlBuyerMatches[0].name ?? "")}
                        </strong>
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-dark"
                        onClick={() => {
                          const id = Number(mlBuyerMatches[0].id ?? mlBuyerMatches[0].customer_id);
                          if (id) void linkCustomer(id, "ml_buyer");
                        }}
                      >
                        Confirmar
                      </button>
                    </div>
                  )}
                  {keywordHint && (
                    <div className="alert alert-warning py-1 px-2 small mb-0 mt-2">
                      Cliente menciona ML — vincular orden
                    </div>
                  )}

                  {!identityLoading &&
                    selectedChat.identity_status === "auto_matched" &&
                    !phoneMatches.length &&
                    !mlBuyerMatches.length && (
                      <div className="alert alert-warning py-1 px-2 small mb-0 mt-2">
                        Orden ML detectada
                      </div>
                    )}

                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {(selectedChat.source_type === "wa_inbound" ||
                      selectedChat.source_type === "wa_ml_linked") && (
                      <>
                        <button type="button" className="btn btn-sm btn-outline-secondary">
                          Inventario
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setModal("quote")}
                        >
                          Cotizar
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">
                          Crear orden
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setModal("payment")}
                        >
                          Confirmar pago
                        </button>
                      </>
                    )}
                    {selectedChat.source_type === "ml_question" && (
                      <>
                        <button type="button" className="btn btn-sm btn-outline-secondary">
                          Ver publicación
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setModal("ml")}
                        >
                          Responder en ML
                        </button>
                      </>
                    )}
                    {selectedChat.source_type === "ml_message" && (
                      <>
                        <button type="button" className="btn btn-sm btn-outline-secondary">
                          Ver orden ML
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">
                          Responder ML
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-grow-1 overflow-auto p-3">
                  {msgLoading && (
                    <p className="small text-muted text-center">Cargando mensajes…</p>
                  )}
                  {msgError && (
                    <div className="alert alert-danger py-1 small">
                      {msgError}{" "}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() =>
                          selectedChatId != null && void fetchMessages(selectedChatId, false)
                        }
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  {messages.map((m) => {
                    if (m.type === "system") {
                      return (
                        <div key={m.id} className="text-center my-2">
                          <span
                            className="small fst-italic text-muted px-2 py-1 rounded-pill"
                            style={{ background: "#e9ecef" }}
                          >
                            {m.content.text}
                          </span>
                        </div>
                      );
                    }
                    const outbound = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className={`d-flex mb-2 ${outbound ? "justify-content-end" : "justify-content-start"}`}
                      >
                        <div
                          className="rounded-3 px-3 py-2 small shadow-sm"
                          style={{
                            maxWidth: "78%",
                            background: outbound ? "#DCF8C6" : "#fff",
                            border: outbound ? "none" : "1px solid #e9ecef",
                          }}
                        >
                          {m.media_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.media_url}
                              alt=""
                              className="img-fluid rounded mb-1"
                              style={{ maxHeight: 180 }}
                            />
                          )}
                          {m.content.text}
                          {m.pending && (
                            <span className="text-muted ms-1" style={{ fontSize: 10 }}>
                              Enviando…
                            </span>
                          )}
                          {m.error && (
                            <span className="text-danger ms-1" style={{ fontSize: 10 }}>
                              Error
                            </span>
                          )}
                          <div className="text-muted mt-1" style={{ fontSize: 10 }}>
                            {formatTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex-shrink-0 p-2 bg-white border-top d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Escribir mensaje…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendDraft();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm text-white flex-shrink-0 px-3"
                    style={{ background: SEND_GREEN }}
                    onClick={() => void sendDraft()}
                  >
                    Enviar
                  </button>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center flex-grow-1 text-muted small">
                Seleccione una conversación
              </div>
            )}
          </div>

          <div
            className="flex-shrink-0 overflow-hidden bg-white border-start"
            style={{ width: 280 }}
          >
            <LifecyclePanel chat={selectedForLifecycle} />
          </div>
        </div>
      </div>

      {modal === "payment" && selectedChat && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.45)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Comprobantes pendientes</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setModal(null)}
                />
              </div>
              <div className="modal-body">
                {paymentLoading && <p className="small text-muted">Cargando…</p>}
                {!paymentLoading &&
                  paymentAttempts.map((pa) => {
                    const id = Number(pa.id ?? pa.attempt_id);
                    const conf = String(
                      pa.confidence_label ?? pa.confidence ?? "low"
                    ).toLowerCase();
                    const img = String(pa.firebase_url ?? pa.image_url ?? "");
                    return (
                      <div key={id} className="border rounded p-2 mb-3">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="img-fluid rounded mb-2" />
                        )}
                        <div className="small">
                          Monto: {String(pa.extracted_amount_bs ?? "—")} · Banco:{" "}
                          {String(pa.extracted_bank ?? "—")} · Ref:{" "}
                          {String(pa.extracted_reference ?? "—")}
                        </div>
                        <div className="mt-1">
                          Confianza: {confidenceBadge(conf)}
                          <span className="ms-2 text-muted">
                            {String(pa.reconciliation_status ?? "")}
                          </span>
                        </div>
                        <div className="d-flex gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={async () => {
                              const res = await fetch("/api/inbox/payments/confirm", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  attempt_id: id,
                                  order_id:
                                    pa.reconciled_order_id != null
                                      ? Number(pa.reconciled_order_id)
                                      : selectedOrderIdForPayment,
                                  confirmed_by: getOperatorUserId(),
                                }),
                              });
                              handleAuthRedirect(res);
                              if (res.ok) {
                                setModal(null);
                                setChats((prev) =>
                                  prev.map((c) =>
                                    c.id === selectedChat.id
                                      ? withDerivedLifecycle(
                                          {
                                            ...c,
                                            lifecycle_stage: "dispatch",
                                            payment_status: "approved",
                                            order: c.order
                                              ? { ...c.order, payment_status: "paid" }
                                              : c.order,
                                          },
                                          hasActiveQuotation
                                        )
                                      : c
                                  )
                                );
                                void fetchMessages(selectedChat.id, false);
                              }
                            }}
                          >
                            Confirmar pago
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={async () => {
                              const res = await fetch("/api/inbox/payments/reject", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  attempt_id: id,
                                  confirmed_by: getOperatorUserId(),
                                }),
                              });
                              handleAuthRedirect(res);
                              if (res.ok) setPaymentAttempts((p) => p.filter((x) => Number(x.id ?? x.attempt_id) !== id));
                            }}
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {!paymentLoading && !paymentAttempts.length && (
                  <p className="small text-muted mb-0">No hay comprobantes pendientes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === "quote" && selectedChat && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.45)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva cotización</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setModal(null)}
                />
              </div>
              <div className="modal-body">
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Buscar producto (SKU o nombre)…"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                />
                <div className="list-group mb-3 small">
                  {quoteResults.map((p) => {
                    const pid = Number(p.id ?? p.producto_id);
                    const name = String(p.name ?? p.nombre ?? "");
                    const sku = String(p.sku ?? "");
                    const price = Number(p.unit_price_usd ?? p.precio ?? 0);
                    const stock = Number(p.stock_qty ?? p.stock ?? 0);
                    const stockMin = Number(p.stock_min ?? p.min_stock ?? 0);
                    let stockLabel = "OK";
                    let stockClass = "text-success";
                    if (stock <= 0) {
                      stockLabel = "Sin stock";
                      stockClass = "text-danger";
                    } else if (stock <= stockMin) {
                      stockLabel = "Bajo";
                      stockClass = "text-warning";
                    }
                    return (
                      <button
                        type="button"
                        key={pid}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => {
                          setQuoteLines((lines) => [
                            ...lines,
                            {
                              producto_id: pid,
                              cantidad: 1,
                              precio_unitario: price,
                              label: `${sku} ${name}`.trim(),
                            },
                          ]);
                        }}
                      >
                        <span>
                          {name}{" "}
                          <span className="text-muted">({sku})</span> — ${price.toFixed(2)}
                        </span>
                        <span className={stockClass}>{stockLabel}</span>
                      </button>
                    );
                  })}
                </div>
                <h6 className="small fw-bold">Ítems</h6>
                <ul className="small">
                  {quoteLines.map((line, i) => (
                    <li key={`${line.producto_id}-${i}`} className="d-flex justify-content-between">
                      <span>{line.label}</span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-danger p-0"
                        onClick={() =>
                          setQuoteLines((L) => L.filter((_, j) => j !== i))
                        }
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={quoteBusy || !quoteLines.length}
                  onClick={async () => {
                    setQuoteBusy(true);
                    try {
                      const res = await fetch("/api/inbox/quotations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          chat_id: selectedChat.id,
                          cliente_id: selectedChat.customer_id ?? null,
                          channel_id: selectedChat.channel_id,
                          created_by: getOperatorUserId(),
                          items: quoteLines.map((l) => ({
                            producto_id: l.producto_id,
                            cantidad: l.cantidad,
                            precio_unitario: l.precio_unitario,
                          })),
                        }),
                      });
                      handleAuthRedirect(res);
                      const body = (await readJson(res)) as Record<string, unknown>;
                      if (!res.ok) return;
                      const data = (body.data as Record<string, unknown>) ?? body;
                      const qid = Number(data.id ?? data.quotation_id);
                      if (qid) {
                        const sendRes = await fetch(`/api/inbox/quotations/${qid}/send`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({}),
                        });
                        handleAuthRedirect(sendRes);
                      }
                      setModal(null);
                      setQuoteLines([]);
                      if (selectedChatId != null) void fetchMessages(selectedChatId, false);
                    } finally {
                      setQuoteBusy(false);
                    }
                  }}
                >
                  Crear y enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === "ml" && selectedChat && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.45)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Responder pregunta ML</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setModal(null)}
                />
              </div>
              <div className="modal-body">
                {mlBusy && <p className="small text-muted">Cargando…</p>}
                <p className="small"><strong>Pregunta:</strong> {mlQuestion}</p>
                {mlIaFlag && (
                  <div className="alert alert-info py-1 small">La IA ya respondió (puede responder manualmente).</div>
                )}
                <textarea
                  className="form-control form-control-sm"
                  rows={4}
                  value={mlAnswerDraft}
                  onChange={(e) => setMlAnswerDraft(e.target.value)}
                  placeholder="Respuesta…"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-2"
                  disabled={mlBusy || !mlAnswerDraft.trim()}
                  onClick={async () => {
                    setMlBusy(true);
                    try {
                      const res = await fetch(
                        `/api/inbox/${selectedChat.id}/ml-question/answer`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            answer_text: mlAnswerDraft.trim(),
                            answered_by: getOperatorUserId(),
                          }),
                        }
                      );
                      handleAuthRedirect(res);
                      if (res.ok) {
                        setModal(null);
                        setMlAnswerDraft("");
                        setChats((prev) =>
                          prev.map((c) =>
                            c.id === selectedChat.id ? { ...c, source_type: "ml_message" } : c
                          )
                        );
                        void fetchMessages(selectedChat.id, false);
                      }
                    } finally {
                      setMlBusy(false);
                    }
                  }}
                >
                  Enviar respuesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
