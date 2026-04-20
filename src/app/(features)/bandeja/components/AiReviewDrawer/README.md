# AiReviewDrawer — Documentación (Sprint 6B)

Panel lateral de revisión humana para mensajes Tipo M del AI Responder.

---

## Flujo de estados del mensaje

```
[needs_human_review]
        │
        ├── APROBAR     → POST /approve → ai_replied        (enviado al cliente)
        ├── EDITAR+ENV. → POST /override → ai_replied       (enviado con texto editado)
        ├── BORRADOR    → POST /draft   → needs_human_review (sigue en cola, texto actualizado)
        └── RECHAZAR    → POST /reject  → rejected          (descartado, no enviado)
```

## Endpoints consumidos

| Método | Ruta                              | Descripción |
|--------|-----------------------------------|-------------|
| GET    | `/api/ai-responder/pending`        | Lista mensajes con `needs_human_review` |
| POST   | `/api/ai-responder/:id/approve`    | Envía `ai_reply_text` al cliente |
| POST   | `/api/ai-responder/:id/override`   | Envía texto editado `{ reply_text }` |
| POST   | `/api/ai-responder/:id/draft`      | Guarda borrador sin enviar `{ reply_text }` |
| POST   | `/api/ai-responder/:id/reject`     | Descarta el mensaje `{ reason? }` |

Todos son proxies BFF → backend `aiResponderApiHandler.js` en webhook-receiver.

## Mapping source_type → canal (Sprint 6B)

| source_type       | ChannelKey | Letra | Color     | Nota |
|-------------------|-----------|-------|-----------|------|
| `wa_inbound`      | `wa`      | W     | #25d366   |      |
| `wa_ml_linked`    | `wa`      | W     | #25d366   | título: "WhatsApp ↔ MercadoLibre" |
| `ml_question`     | `ml`      | M     | #fff159   |      |
| `ml_message`      | `ml`      | M     | #fff159   |      |
| `eco_*`           | `eco`     | E     | #6ab6ff   |      |
| `fv_*`/`mostrador`| `fv`      | F     | #ff6a3d   |      |
| `null` / `""`     | `direct`  | D     | #8a8a8a   | fallback neutral |

Si `channel_id` está presente (no null), tiene prioridad sobre `source_type`.

## Decisiones de diseño

### `ai_reply_text` nullable
- Textarea arranca vacío con placeholder "Sin sugerencia IA · escribí la respuesta"
- Botón **Aprobar** se oculta (`null → canApprove = false`)
- Botón **Editar y enviar** siempre visible (permite enviar sin sugerencia previa)
- Botón **Borrador** visible solo si el textarea tiene texto

### 409 `legacy_archived_blocked`
- Respuesta de backend cuando el mensaje fue archivado por migración legacy
- El drawer remueve el item de la lista local sin mostrar error técnico
- Toast amigable: "Este mensaje ya no está activo"
- El usuario no ve error pero el item desaparece (comportamiento correcto)

### Estado vacío
- Si `total_pending_count === 0` → `AiReviewBadge` no se renderiza → drawer no accesible
- Si el drawer se abre y `rows = []` → mensaje "Todo al día · no hay mensajes pendientes"

### z-index
- Backdrop: 499
- Panel drawer: 500
- MediaModal / PhotoViewer: 10000
- Modales inline (rechazo): 10002–10003
- Toast: 10001

## Arquitectura de componentes

```
ChatList
├── useAiResponderStats()      ← total_pending_count para badge
├── AiReviewBadge              ← botón flotante, oculto si count === 0
└── AiReviewDrawer             ← panel fijo derecho (z=500)
    └── useAiResponderPending()  ← polling 30s
        └── AiReviewItem × N
            ├── ChannelBadge   ← canal del mensaje
            ├── textarea       ← sugerencia editable
            └── 4 botones de acción
```

## Tests

```
src/__tests__/bandeja/AiReviewBadge.test.tsx          unit (6 casos)
src/__tests__/bandeja/AiReviewItem.test.tsx            unit (14 casos + mapping 6 canales)
src/__tests__/bandeja/useAiResponderPending.test.ts    unit (6 casos)
src/__tests__/bandeja/AiReviewDrawer.integration.test.tsx  integration (7 casos)
```

Ejecutar: `npx vitest run src/__tests__/bandeja/`
