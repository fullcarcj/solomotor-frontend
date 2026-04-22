'use client';

/**
 * /workspace · Módulo Unificado de Ventas
 *
 * · Bandeja + conversación + ficha básica: datos reales vía useInbox,
 *   useChatMessages, useChatContext (mismo stack que /bandeja).
 * · Pipeline maestro + modales inferiores: mock / demo (sin topbar de marca).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react';

import { useInbox } from '@/hooks/useInbox';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatContext } from '@/hooks/useChatContext';
import { CHAT_STAGE_LABELS, normalizeChatStage } from '@/constants/chatStage';
import MessageBubble from '@/app/(features)/bandeja/components/MessageBubble';

import {
  COT_ROWS,
  DESP_STEPS,
  CANALES,
  STOCK_BOXES,
  CAL_TAGS,
} from './mock-data';
import {
  fmtShortTime,
  initials,
  miniPipelineFromStage,
  pickAvatarClass,
  sourceToChannel,
  stageToTagClass,
} from './workspace-helpers';

import Swal from 'sweetalert2';

import './workspace.scss';

const INBOX_TABS: { label: string; filter: string }[] = [
  { label: 'Todos', filter: '' },
  { label: 'No leídos', filter: 'unread' },
  { label: 'Cotizaciones', filter: 'quote' },
  { label: 'Ventas', filter: 'payment_pending' },
  { label: 'Mis asignados', filter: 'dispatch' },
];

export default function WorkspacePage() {
  const [selectedChatId, setSelectedChatId] = useState<string | number | null>(null);
  const [searchDraft, setSearchDraft] = useState('');
  const [composerDraft, setComposerDraft] = useState('');
  // Mobile: 3er nivel de navegación (ficha full-screen). Desktop la ignora.
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => { setDetailsOpen(false); }, [selectedChatId]);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const {
    chats,
    total,
    loading,
    loadingMore,
    error,
    filters,
    setFilters,
    loadMore,
    nextCursor,
  } = useInbox({ limit: 100 });

  const chatList = Array.isArray(chats) ? chats : [];

  const selected = useMemo(
    () => chatList.find(c => String(c.id) === String(selectedChatId)) ?? null,
    [chatList, selectedChatId]
  );

  // Detecta mobile para no auto-seleccionar el primer chat (rompería la
  // navegación master-detail: al volver a la lista el efecto reseleccionaba).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (chatList.length === 0) {
      setSelectedChatId(null);
      return;
    }
    const stillThere =
      selectedChatId != null && chatList.some(c => String(c.id) === String(selectedChatId));
    if (stillThere) return;

    if (isMobile) {
      // En mobile respetamos null (muestra lista). Solo limpiamos si el chat
      // seleccionado desapareció de la bandeja.
      if (selectedChatId != null) setSelectedChatId(null);
    } else if (selectedChatId == null) {
      setSelectedChatId(chatList[0]!.id);
    } else {
      setSelectedChatId(chatList[0]!.id);
    }
  }, [chatList, selectedChatId, isMobile]);

  const customerId = selected?.customer_id ?? null;
  const { customer, recentOrders, loadingCustomer, loadingOrders } = useChatContext(customerId);

  const {
    messages,
    loading: loadingMsgs,
    error: errorMsgs,
    sendMessage,
  } = useChatMessages(selectedChatId);

  /** Cronológico: antiguos arriba, recientes abajo (alineado con bandeja / API). */
  const messagesChronological = useMemo(
    () =>
      [...(Array.isArray(messages) ? messages : [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [messages]
  );

  const msgsRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const lastChatForScrollRef = useRef<string | number | null>(null);

  useLayoutEffect(() => {
    const el = msgsRef.current;
    if (!el) return;
    const switched = String(lastChatForScrollRef.current) !== String(selectedChatId);
    lastChatForScrollRef.current = selectedChatId;
    if (switched) {
      nearBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
      return;
    }
    if (nearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messagesChronological, selectedChatId]);

  const onMsgsScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    const fromBottom = t.scrollHeight - t.scrollTop - t.clientHeight;
    nearBottomRef.current = fromBottom < 120;
  }, []);

  useEffect(() => {
    document.body.classList.add('workspace-page');
    return () => {
      document.body.classList.remove('workspace-page');
    };
  }, []);

  const handleSend = useCallback(async () => {
    const t = composerDraft.trim();
    if (!t) return;
    const ok = await sendMessage(t);
    if (ok) {
      setComposerDraft('');
      nearBottomRef.current = true;
    }
  }, [composerDraft, sendMessage]);

  const handleAttachChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedChatId) return;
    void Swal.fire({
      icon: 'info',
      title: 'Adjunto seleccionado',
      html: `<p style="margin:0 0 8px"><strong>${file.name}</strong></p><p style="margin:0;font-size:14px;opacity:.85">El envío de archivos por API se alineará con la bandeja en la siguiente iteración.</p>`,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#c8e632',
    });
  }, [selectedChatId]);

  const stage = normalizeChatStage(selected?.chat_stage != null ? String(selected.chat_stage) : undefined);
  const miniPm = useMemo(() => miniPipelineFromStage(stage) ?? [], [stage]);

  const headerSub = useMemo(() => {
    if (!selected) return 'Seleccioná una conversación';
    const parts: string[] = [];
    parts.push(selected.source_type || '—');
    if (selected.phone) parts.push(selected.phone);
    if (customer?.first_order_date) {
      try {
        const y = new Date(customer.first_order_date).getFullYear();
        parts.push(`Cliente desde ${y}`);
      } catch { /* noop */ }
    }
    if (selected.order?.id) parts.push(`Orden #${selected.order.id}`);
    return parts.join(' · ');
  }, [selected, customer]);

  const displayName = selected?.customer_name ?? selected?.phone ?? '—';
  const headerInitials = selected ? initials(selected.customer_name, selected.phone) : '—';
  const ch = selected ? sourceToChannel(selected.source_type) : { channel: 'wa' as const, letter: 'W' };
  const avatarClass = selected
    ? pickAvatarClass(chatList.findIndex(c => String(c.id) === String(selected.id)))
    : 'blue';

  const latestOrder = recentOrders[0];
  const orderLine =
    latestOrder != null
      ? `Pedido #${String(latestOrder.id)} · ${String(latestOrder.status)}`
      : selected?.order
        ? `Orden en chat #${selected.order.id} · ${selected.order.payment_status}`
        : 'Sin pedido vinculado';

  const orderAmount =
    latestOrder != null
      ? String(latestOrder.total_usd ?? latestOrder.order_total_amount ?? '—')
      : '—';

  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <main
          className="ws-root"
          data-view={
            selectedChatId == null
              ? 'list'
              : detailsOpen
                ? 'details'
                : 'chat'
          }
        >
          <div className="webapp">
            <div className="webapp-chrome">
              <span className="dot-btn r" />
              <span className="dot-btn y" />
              <span className="dot-btn g" />
              <div className="url">
                <span>solomotorx.app</span>
                {selectedChatId != null ? `/workspace/${selectedChatId}` : '/workspace'}
              </div>
              <span className="device-label">Spacework · datos reales</span>
            </div>

            <div className="webapp-body">
                <section className="inbox">
                  <div className="inbox-header">
                    <h2>Bandeja</h2>
                    <div className="inbox-tabs">
                      {INBOX_TABS.map(tab => (
                        <button
                          key={tab.filter || 'all'}
                          type="button"
                          className={`tab${filters.filter === tab.filter ? ' active' : ''}`}
                          onClick={() => setFilters({ filter: tab.filter })}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="inbox-search" style={{ cursor: 'text' }}>
                    <span>🔍</span>
                    <input
                      type="search"
                      value={searchDraft}
                      onChange={e => {
                        const v = e.target.value;
                        setSearchDraft(v);
                        setFilters({ search: v });
                      }}
                      placeholder="Buscar cliente, orden, SKU…"
                      autoComplete="off"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'inherit',
                        font: 'inherit',
                      }}
                    />
                  </label>

                  <div className="conv-list">
                    {loading && chatList.length === 0 && (
                      <div className="conv-preview" style={{ padding: 18 }}>Cargando conversaciones…</div>
                    )}
                    {error && (
                      <div className="conv-preview" style={{ padding: 18, color: 'var(--bad)' }}>{error}</div>
                    )}
                    {!loading && !error && chatList.length === 0 && (
                      <div className="conv-preview" style={{ padding: 18 }}>No hay chats con este filtro.</div>
                    )}
                    {chatList.map((c, idx) => {
                      const active = String(c.id) === String(selectedChatId);
                      const ini = initials(c.customer_name, c.phone);
                      const { channel, letter } = sourceToChannel(c.source_type);
                      const st = normalizeChatStage(c.chat_stage != null ? String(c.chat_stage) : undefined);
                      return (
                        <div
                          key={String(c.id)}
                          role="button"
                          tabIndex={0}
                          className={`conv${active ? ' active' : ''}`}
                          onClick={() => setSelectedChatId(c.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedChatId(c.id);
                            }
                          }}
                        >
                          <div className={`avatar ${pickAvatarClass(idx)}`}>
                            {ini}
                            <span className={`ch-badge ch-${channel}`}>{letter}</span>
                          </div>
                          <div className="conv-meta">
                            <div className="conv-top">
                              <div className="conv-name">{c.customer_name ?? c.phone}</div>
                            </div>
                            <div className="conv-preview">
                              {(c.last_message_text ?? '').slice(0, 80)}
                              {(c.last_message_text?.length ?? 0) > 80 ? '…' : ''}
                            </div>
                            <div className="conv-tags">
                              {st && (
                                <span className={`tag ${stageToTagClass(st)}`}>
                                  {CHAT_STAGE_LABELS[st]}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="conv-right">
                            <div className="conv-time">{fmtShortTime(c.last_message_at)}</div>
                            {Number(c.unread_count) > 0 && (
                              <div className="unread">{Number(c.unread_count)}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {nextCursor != null && (
                    <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)' }}>
                      <button
                        type="button"
                        className="conv-load-more"
                        disabled={loadingMore}
                        onClick={() => loadMore()}
                      >
                        {loadingMore ? 'Cargando…' : 'Cargar más conversaciones'}
                      </button>
                    </div>
                  )}
                  {total > 0 && (
                    <div className="conv-preview" style={{ padding: '8px 18px', fontSize: 10, opacity: 0.7 }}>
                      {total} en bandeja · mostrando hasta {chatList.length}
                    </div>
                  )}
                </section>

                <section className="convo">
                  <div className="convo-header">
                    <button
                      type="button"
                      className="convo-back"
                      aria-label="Volver a la lista"
                      onClick={() => setSelectedChatId(null)}
                    >
                      ←
                    </button>
                    <div className={`avatar ${avatarClass}`}>
                      {headerInitials}
                      <span className={`ch-badge ch-${ch.channel}`}>{ch.letter}</span>
                    </div>
                    <div className="who">
                      <h3>
                        {displayName}
                        {stage && (
                          <span className={`tag ${stageToTagClass(stage)}`} style={{ marginLeft: 6 }}>
                            {CHAT_STAGE_LABELS[stage]}
                          </span>
                        )}
                      </h3>
                      <div className="sub">{headerSub}</div>
                    </div>
                    <button
                      type="button"
                      className="icon-btn convo-info"
                      title="Ver ficha del cliente"
                      aria-label="Ver ficha del cliente"
                      onClick={() => setDetailsOpen(true)}
                    >
                      ⓘ
                    </button>
                    <div className="icon-btn" title="Llamar">📞</div>
                    <div className="icon-btn" title="Traspasar">↔</div>
                    <div className="icon-btn" title="Más">⋯</div>
                  </div>

                  <div className="pipeline-mini">
                    {miniPm.map((pm, i) => (
                      <div
                        key={i}
                        className={`pm${pm.status === 'done' ? ' done' : ''}${pm.status === 'current' ? ' current' : ''}`}
                      >
                        {pm.label}
                      </div>
                    ))}
                  </div>

                  <div className="msgs" ref={msgsRef} onScroll={onMsgsScroll}>
                    {!selectedChatId && (
                      <div className="msg system">Seleccioná un chat en la lista</div>
                    )}
                    {selectedChatId && loadingMsgs && messages.length === 0 && (
                      <div className="msg system">Cargando mensajes…</div>
                    )}
                    {errorMsgs && (
                      <div className="msg system">{errorMsgs}</div>
                    )}
                    <div className="msgs-stack">
                      {messagesChronological.map(m => (
                        <MessageBubble key={String(m.id)} msg={m} />
                      ))}
                    </div>
                  </div>

                  <div className="composer">
                    <span className="composer-emoji" title="Emoji" aria-hidden>
                      😊
                    </span>
                    <input
                      ref={attachInputRef}
                      type="file"
                      hidden
                      accept="image/*,application/pdf,.pdf,.doc,.docx"
                      onChange={handleAttachChange}
                    />
                    <button
                      type="button"
                      className="composer-attach"
                      title="Adjuntar archivo"
                      aria-label="Adjuntar archivo"
                      disabled={!selectedChatId}
                      onClick={() => attachInputRef.current?.click()}
                    >
                      📎
                    </button>
                    <div className="composer-field">
                      <input
                        type="text"
                        value={composerDraft}
                        onChange={e => setComposerDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                        placeholder="Escribir un mensaje…"
                        disabled={!selectedChatId}
                        autoComplete="off"
                        aria-label="Escribir mensaje"
                      />
                    </div>
                    <span className="composer-mic" title="Nota de voz" aria-hidden>
                      🎤
                    </span>
                    <button
                      type="button"
                      className="composer-templates"
                      title="Plantillas (próximamente)"
                    >
                      / tpl
                    </button>
                    <button
                      type="button"
                      className="composer-send"
                      disabled={!selectedChatId || !composerDraft.trim()}
                      onClick={() => void handleSend()}
                      aria-label="Enviar mensaje"
                    >
                      Enviar
                    </button>
                  </div>
                </section>

                <aside className="ficha">
                  <div className="ficha-mobile-header">
                    <button
                      type="button"
                      className="ficha-back"
                      aria-label="Volver al chat"
                      onClick={() => setDetailsOpen(false)}
                    >
                      ←
                    </button>
                    <h3>Ficha del cliente</h3>
                  </div>
                  <div className="ficha-section">
                    <h4>Cliente <span className="more">VER FICHA →</span></h4>
                    <div className="cliente">
                      <div className={`avatar ${avatarClass}`} style={{ width: 44, height: 44, fontSize: 14 }}>
                        {headerInitials}
                      </div>
                      <div>
                        <div className="n">{customer?.full_name ?? displayName}</div>
                        <div className="id mono">
                          {loadingCustomer && 'Cargando…'}
                          {!loadingCustomer && customer && `ID cliente #${customer.id}`}
                          {!loadingCustomer && !customer && selected && 'Cliente no vinculado'}
                        </div>
                      </div>
                    </div>
                    <dl className="kv">
                      <dt>Teléfono</dt>
                      <dd>{customer?.phone ?? selected?.phone ?? '—'}</dd>
                      <dt>Zona</dt>
                      <dd>{customer?.city ?? customer?.address ?? '—'}</dd>
                      <dt>Compras</dt>
                      <dd>
                        {customer
                          ? `${customer.total_orders} · USD ${String(customer.total_spent_usd)}`
                          : loadingCustomer
                            ? '…'
                            : '—'}
                      </dd>
                      <dt>CRM</dt>
                      <dd>{customer?.crm_status ?? '—'}</dd>
                      <dt>Chat</dt>
                      <dd className="mono">#{selectedChatId ?? '—'}</dd>
                    </dl>
                  </div>

                  <div className="ficha-section">
                    <h4>Estado <span className="more">HISTORIAL →</span></h4>
                    <div className="estado-card">
                      <span className="tipo">
                        {stage && CHAT_STAGE_LABELS[stage]
                          ? CHAT_STAGE_LABELS[stage].toUpperCase()
                          : 'SIN ETAPA'}
                      </span>
                      <div className="num mono">{orderLine}</div>
                      <div className="monto">
                        <span className="cur">USD</span>
                        {loadingOrders ? '…' : orderAmount}
                      </div>
                    </div>
                  </div>

                  <div className="ficha-section">
                    <h4>Productos <span className="more">EDITAR →</span></h4>
                    <div className="items-list">
                      {loadingOrders && (
                        <div className="it">
                          <div className="it-img">…</div>
                          <div>
                            <div className="it-name">Cargando pedidos…</div>
                            <div className="it-sku mono">/api/ventas/pedidos</div>
                          </div>
                          <div className="it-price mono">—</div>
                        </div>
                      )}
                      {!loadingOrders && latestOrder && (
                        <div className="it">
                          <div className="it-img">📦</div>
                          <div>
                            <div className="it-name">Último pedido</div>
                            <div className="it-sku mono">
                              #{String(latestOrder.id)} · {latestOrder.status}
                            </div>
                          </div>
                          <div className="it-price mono">
                            {String(latestOrder.total_usd ?? latestOrder.order_total_amount)}
                          </div>
                        </div>
                      )}
                      {!loadingOrders && !latestOrder && (
                        <div className="it">
                          <div className="it-img">—</div>
                          <div>
                            <div className="it-name">Sin líneas de pedido</div>
                            <div className="it-sku">El detalle de ítems no está en la lista corta de ventas</div>
                          </div>
                          <div className="it-price mono">—</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ficha-section">
                    <h4>Banco <span className="more">CONCILIAR →</span></h4>
                    <div className="banco-row">
                      <div>
                        <div>Sin extracto en esta vista</div>
                        <div className="ref mono">Conectá conciliación en Finanzas / bandeja</div>
                      </div>
                      <div className="pending mono">—</div>
                    </div>
                  </div>

                  <div className="ficha-section">
                    <h4>Acciones</h4>
                    <div className="acciones">
                      <div className="btn">✎ Editar cot.</div>
                      <div className="btn">↻ Duplicar</div>
                      <div className="btn primary wide">→ CONCILIAR PAGO</div>
                      <div className="btn">🚚 Despachar</div>
                      <div className="btn">⭐ Calificar</div>
                      <div className="btn ghost wide">✕ Cerrar venta</div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

          <div className="modals-rack">

            <div className="modals-grid">
              <div className="modal">
                <div className="modal-head">
                  <div className="title">Cotización #COT-2026-0412</div>
                  <span className="tag tag-cot">● VIGENTE</span>
                </div>
                <div className="modal-body">
                  <dl className="kv" style={{ marginBottom: 14 }}>
                    <dt>Cliente</dt><dd>{customer?.full_name ?? displayName}</dd>
                    <dt>Canal</dt><dd>{selected?.source_type ?? '—'}</dd>
                    <dt>Vendedor</dt><dd>—</dd>
                    <dt>Vence</dt><dd className="mono">—</dd>
                  </dl>
                  <div className="cot-items">
                    <div className="row head">
                      <div>Producto · SKU</div>
                      <div style={{ textAlign: 'right' }}>Cant</div>
                      <div style={{ textAlign: 'right' }}>Precio</div>
                      <div style={{ textAlign: 'right' }}>Total</div>
                    </div>
                    {COT_ROWS.map((r, i) => (
                      <div key={i} className="row">
                        <div>{r.producto}</div>
                        <div className="num">{r.cant}</div>
                        <div className="num">{r.precio}</div>
                        <div className="num">{r.total}</div>
                      </div>
                    ))}
                  </div>
                  <div className="cot-totals">
                    <div className="r"><span>Subtotal</span><span>$ 191.00</span></div>
                    <div className="r"><span>IVA · exento</span><span>$ 0.00</span></div>
                    <div className="r"><span>Descuento</span><span>— $ 0.00</span></div>
                    <div className="r grand"><span>TOTAL</span><span className="v">USD 191.00</span></div>
                  </div>
                  <div className="acciones" style={{ marginTop: 14 }}>
                    <div className="btn">✎ Editar</div>
                    <div className="btn primary">✓ APROBAR</div>
                  </div>
                </div>
              </div>

              <div className="modal">
                <div className="modal-head">
                  <div className="title">Conciliar pago</div>
                  <span className="tag tag-pag">PASO 04</span>
                </div>
                <div className="modal-body">
                  <div className="pago-vis">
                    <div className="pago-col">
                      <div className="label">Esperado</div>
                      <div className="val">$ 191.00</div>
                      <div className="sub">ORDEN #CJ-79416</div>
                    </div>
                    <div className="pago-arrow">⇄</div>
                    <div className="pago-col right">
                      <div className="label">Recibido</div>
                      <div className="val">$ 100.00</div>
                      <div className="sub">BANESCO · 18:02</div>
                    </div>
                  </div>
                  <div className="pago-match">
                    <span className="check">✓</span>
                    <div>Abono parcial identificado · Pendiente $ 91.00 para completar</div>
                  </div>
                  <div className="pago-form">
                    <div className="field"><label>Banco</label><div className="v">BANESCO 0134</div></div>
                    <div className="field"><label>Referencia</label><div className="v">048291</div></div>
                    <div className="field"><label>Fecha</label><div className="v">17·04·2026</div></div>
                    <div className="field"><label>Método</label><div className="v">Pago móvil</div></div>
                  </div>
                  <div className="acciones" style={{ marginTop: 14 }}>
                    <div className="btn">↻ Volver a cotización</div>
                    <div className="btn primary">✓ CONFIRMAR ABONO</div>
                  </div>
                </div>
              </div>

              <div className="modal">
                <div className="modal-head">
                  <div className="title">Solicitar despacho</div>
                  <span className="tag tag-des">PASO 05</span>
                </div>
                <div className="modal-body">
                  <div className="desp-time">
                    {DESP_STEPS.map((s, i) => (
                      <div
                        key={i}
                        className={`desp-step${s.status === 'done' ? ' done' : ''}${s.status === 'current' ? ' current' : ''}`}
                      >
                        <div className="dot">{s.dot}</div>
                        <div>
                          <div className="ti">{s.title}</div>
                          <div className="su">{s.sub}</div>
                        </div>
                        <div className="tm">{s.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="desp-courier">
                    <div className="av">DM</div>
                    <div className="info">
                      <div className="n">Motorizado Primo Daniel</div>
                      <div className="m">Moto YBR 125 · PLACA AA·458 · 4.9 ★</div>
                    </div>
                    <div className="btn primary">ASIGNAR</div>
                  </div>
                </div>
              </div>

              <div className="modal">
                <div className="modal-head">
                  <div className="title">Calificación del cliente</div>
                  <span className="tag tag-apr">PASO 06</span>
                </div>
                <div className="modal-body">
                  <div className="cal-big">
                    <div className="stars">★ ★ ★ ★ ★</div>
                    <div className="score">5.0<span className="of"> / 5.0</span></div>
                  </div>
                  <div className="cal-quote">
                    &quot;Todo perfecto, el motorizado súper rápido y las pastillas llegaron bien. Volveré a comprar.&quot;
                  </div>
                  <dl className="kv" style={{ marginBottom: 12 }}>
                    <dt>Cliente</dt><dd>{customer?.full_name ?? displayName}</dd>
                    <dt>Canal</dt><dd>{selected?.source_type ?? '—'}</dd>
                    <dt>Vendedor</dt><dd>—</dd>
                    <dt>Despacho</dt><dd>—</dd>
                  </dl>
                  <div className="cal-tags">
                    {CAL_TAGS.map((t, i) => (
                      <span key={i} className={`ctag${t.highlighted ? ' hi' : ''}`}>{t.label}</span>
                    ))}
                  </div>
                  <div className="acciones" style={{ marginTop: 14 }}>
                    <div className="btn">📎 Guardar en ficha</div>
                    <div className="btn primary">→ CERRAR VENTA</div>
                  </div>
                </div>
              </div>

              <div className="modal">
                <div className="modal-head">
                  <div className="title">Canales de venta</div>
                  <span className="tag tag-cot">INBOX UNIFICADO</span>
                </div>
                <div className="modal-body">
                  <p style={{ fontSize: 12, color: 'var(--ink-dim)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    Toda interacción converge en un solo hilo por cliente. Sin importar por dónde entró, el
                    flujo es el mismo.
                  </p>
                  <div className="canales-list">
                    {CANALES.map((c, i) => (
                      <div key={i} className="can">
                        <div className={`can-ic ${c.iconTone}`}>{c.icon}</div>
                        <div className="can-info">
                          <div className="n">{c.name}</div>
                          <div className="d">{c.desc}</div>
                        </div>
                        <div className="can-count">
                          <div className="big">{c.count}</div>
                          <div className="sm">Activos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal">
                <div className="modal-head">
                  <div className="title">Producto · Inventario</div>
                  <span className="tag tag-des">TOY-DSC-COR18</span>
                </div>
                <div className="modal-body">
                  <div className="prod-head">
                    <div className="prod-img">⚙</div>
                    <div className="prod-info">
                      <h5>Disco de freno delantero</h5>
                      <div className="sku">TOY-DSC-COR18 · Toyota Corolla 2014-2019</div>
                      <div className="price">$ 48.00 / u.</div>
                    </div>
                  </div>
                  <div className="stock-grid">
                    {STOCK_BOXES.map((sb, i) => (
                      <div key={i} className={`stock-box ${sb.tone === 'no' ? 'none' : sb.tone}`}>
                        <div className="n">{sb.n}</div>
                        <div className="l">{sb.label}</div>
                      </div>
                    ))}
                  </div>
                  <dl className="kv" style={{ marginBottom: 12 }}>
                    <dt>Proveedor</dt><dd>Alibaba · Su Lin (cot. abierta)</dd>
                    <dt>Costo</dt><dd className="mono">$ 22.40</dd>
                    <dt>Margen</dt><dd style={{ color: 'var(--ok)' }}>53.3%</dd>
                    <dt>Rotación</dt><dd>18 u. / mes</dd>
                    <dt>Reservado</dt><dd>2 (esta orden)</dd>
                  </dl>
                  <div className="acciones">
                    <div className="btn">📦 Ver en almacén</div>
                    <div className="btn primary">+ ORDEN COMPRA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
