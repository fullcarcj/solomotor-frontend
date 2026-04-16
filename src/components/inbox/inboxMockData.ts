import type { InboxChat, InboxMessage } from "./inboxTypes";

export const mockChats: InboxChat[] = [
  {
    id: 1,
    source_type: "wa_ml_linked",
    customer_name: "Carlos Mendoza",
    phone: "+58 412-555-0192",
    last_message_text: "listo te mandé el comprobante",
    last_message_at: new Date(),
    unread_count: 1,
    identity_status: "auto_matched",
    lifecycle_stage: "payment",
    payment_status: "pending",
    channel_id: 2,
    ml_order_number: "2000123456789",
  },
  {
    id: 2,
    source_type: "ml_question",
    customer_name: "Usuario ML anónimo",
    phone: null,
    last_message_text: "¿Compatible con Corolla 2019?",
    last_message_at: new Date(Date.now() - 3600_000),
    unread_count: 1,
    identity_status: "unknown",
    lifecycle_stage: "contact",
    payment_status: null,
    channel_id: 3,
  },
  {
    id: 3,
    source_type: "ml_message",
    customer_name: "Comprador ML #8809",
    phone: null,
    last_message_text: "¿cuándo llega mi pedido?",
    last_message_at: new Date(Date.now() - 7200_000),
    unread_count: 1,
    identity_status: "unknown",
    lifecycle_stage: "dispatch",
    payment_status: "approved",
    channel_id: 3,
    ml_order_number: "2000999888777",
  },
  {
    id: 4,
    source_type: "wa_inbound",
    customer_name: "Taller El Rayo",
    phone: "+58 416-888-0041",
    last_message_text: "necesito pastillas freno",
    last_message_at: new Date(Date.now() - 86_400_000),
    unread_count: 1,
    identity_status: "unknown",
    lifecycle_stage: "quote",
    payment_status: null,
    channel_id: 2,
  },
  {
    id: 5,
    source_type: "wa_inbound",
    customer_name: "Pedro Sánchez",
    phone: "+58 424-111-0088",
    last_message_text: "compré en mercadolibre",
    last_message_at: new Date(Date.now() - 172_800_000),
    unread_count: 0,
    identity_status: "declared",
    lifecycle_stage: "contact",
    payment_status: null,
    channel_id: 2,
  },
];

const baseMessages = (chatId: number): InboxMessage[] => {
  const now = Date.now();
  return [
    {
      id: chatId * 100 + 1,
      direction: "inbound",
      type: "text",
      content: { text: "Hola, buenos días." },
      created_at: new Date(now - 300_000),
    },
    {
      id: chatId * 100 + 2,
      direction: "outbound",
      type: "text",
      content: { text: "Buen día, ¿en qué podemos ayudarle?" },
      created_at: new Date(now - 280_000),
    },
    {
      id: chatId * 100 + 3,
      type: "system",
      direction: "inbound",
      content: { text: "Conversación asignada a operador." },
      created_at: new Date(now - 260_000),
    },
    {
      id: chatId * 100 + 4,
      direction: "inbound",
      type: "text",
      content: { text: "Necesito información de stock y precio." },
      created_at: new Date(now - 120_000),
    },
    {
      id: chatId * 100 + 5,
      direction: "outbound",
      type: "text",
      content: { text: "Claro, un momento por favor." },
      created_at: new Date(now - 90_000),
    },
  ];
};

/** Mock de hilo por conversación (4–6 mensajes). */
export function getMockMessagesForChat(chatId: number): InboxMessage[] {
  return baseMessages(chatId);
}
