# /bandeja — Módulo Unificado de Ventas

**Sprint 6A FE · Transformación estructural**

---

## Fuente de diseño

Mockup: `Downloads/solomotorx-modulo-ventas.html`  
Rol: vendedor operativo en el día a día (NO el mockup supervisor ADR-009 en `/ventas/tablero`).

---

## Layout

El módulo tiene **3 columnas de contenido** dentro del área del layout `(features)`:

```
[NAV global ← (features)/layout.tsx]  |  INBOX  |  CONVO  |  FICHA 360°
```

- **NAV**: sidebar global de la app — no modificado.
- **INBOX** (`.bandeja-panel-left` / `.bandeja-detail-list`): lista de conversaciones, filtros, búsqueda.
- **CONVO** (`.bandeja-detail-main`): hilo activo + PipelineMini + MessageInput.
- **FICHA 360°** (`.bandeja-detail-context`): datos del cliente y orden vinculada.

### Rutas

| Ruta | Comportamiento |
|---|---|
| `/bandeja` | INBOX + estado vacío a la derecha |
| `/bandeja/[chatId]` | INBOX + CONVO activa + FICHA 360° |
| `/inbox` | Redirect 308 → `/bandeja` (preservado) |

---

## Tokens de diseño

Definidos en `bandeja-theme.scss` bajo scope `.bandeja-shell`.

| Token | Valor | Uso |
|---|---|---|
| `--mu-bg` | `#0e0f0c` | Fondo base |
| `--mu-panel` | `#151611` | Paneles secundarios |
| `--mu-panel-2` | `#1c1e18` | Hover / inputs |
| `--mu-accent` | `#d4ff3a` | Acento principal (lima neón) |
| `--mu-ink` | `#efeadb` | Texto primario |
| `--mu-ink-dim` | `#a8a89a` | Texto secundario |
| `--mu-line` | `#2a2c24` | Bordes |

Los tokens legacy `--wa-*` se mantienen como alias para retrocompatibilidad.

---

## Componentes nuevos (Sprint 6A)

### `ChannelBadge`

```tsx
<ChannelBadge
  channelId={chat.channel_id}   // ADR-007: preferido cuando exista
  sourceType={chat.source_type} // fallback actual
  overlay                       // posición absolute sobre avatar
/>
```

Mapeo ADR-007:
| channel_id | source_type | Canal |
|---|---|---|
| 1 | `wa_inbound` | WhatsApp (verde) |
| 2 | `ml_question`, `ml_message` | MercadoLibre (amarillo) |
| 3 | `eco_*` | E-commerce (azul) |
| 4 | `fv_*`, `mostrador` | Fuerza de venta (naranja) |
| 5 | — | Mostrador/Directo (gris) |

> **Nota**: `channel_id` **no está expuesto en la raíz de `GET /api/inbox`** actualmente. El badge usa `source_type` como proxy. Cuando el backend lo agregue, bastará con que el campo llegue en el payload para que el componente lo tome automáticamente.

### `PipelineMini`

```tsx
<PipelineMini stage={chat.chat_stage} />
```

Barra horizontal compacta. Stages derivados de `CHAT_STAGE_ORDER` (constante canónica).  
Se renderiza entre el `ChatHeader` y `ChatWindow` en la columna CONVO.

---

## Ficha 360° — Secciones y condicionalidad

| Sección | Condición de render |
|---|---|
| Pregunta ML | `chat.source_type === "ml_question"` |
| Cliente | Siempre (cambia entre "no identificado" / skeleton / datos) |
| **Orden vinculada** | **`chat.order !== null`** — si null, NO se renderiza (sin placeholder) |
| Etapa pipeline | `chat.chat_stage !== undefined` |
| Acciones | Siempre visible |
| Órdenes recientes | `customerId !== null` |
| Vehículos | `customer.vehicles.length > 0` |

---

## Multimedia recuperada (Bloque 5)

**Causa raíz del problema**: el BFF pasa el payload raw del backend sin transformar. El backend devuelve `snake_case` (`media_url`, `mime_type`, `thumbnail_url`) mientras los tipos FE usaban solo `camelCase`. Resultado: `content.mediaUrl` era `undefined` y `MessageBubble` mostraba `[Imagen sin URL]`.

**Solución**: función `normalizeContent()` en `useChatMessages.ts` que acepta ambas formas con precedencia camelCase.

Tipos de mensaje soportados:
- `image` → `<img>` clickeable con lightbox
- `audio` → reproductor con barra de progreso
- `video` → `<video controls>` con poster opcional
- `document` → enlace con ícono (PDF en modal inline)

---

## Tests

```bash
npm test              # vitest run (64 tests)
npm run test:watch    # modo watch
npm run test:coverage # con reporte lcov
```

Archivos de test:
- `src/__tests__/bandeja/ChannelBadge.test.tsx` — unit ChannelBadge
- `src/__tests__/bandeja/PipelineMini.test.tsx` — unit PipelineMini
- `src/__tests__/bandeja/multimedia.test.ts` — normalización snake↔camel
- `src/__tests__/bandeja/integration.test.tsx` — integración payload mockeado

---

## Sprint 6B — Capas funcionales (completado)

### Bloque A · Drawer de revisión IA

| Elemento | Estado |
|---|---|
| `useAiResponderPending` hook (polling 30s, `GET /api/ai-responder/pending`) | DONE |
| `AiReviewBadge` (botón flotante, oculto si count=0) | DONE |
| `AiReviewDrawer` (panel fijo 480px, animación CSS, backdrop) | DONE |
| `AiReviewItem` (4 acciones: aprobar, editar+enviar, borrador, rechazar) | DONE |
| Manejo 409 `legacy_archived_blocked` → toast amigable + auto-remove | DONE |
| `ChannelBadge` extendido: `wa_ml_linked` → "W" + título compuesto; `null` → "D" | DONE |
| `useAiResponderStats` extendido: `total_pending_count`, `legacy_archived_count` | DONE |
| BFF routes: `/api/ai-responder/pending`, `/[id]/approve|override|draft|reject` | DONE |

### Bloque B · Acciones funcionales en ChatHeader

| Elemento | Estado |
|---|---|
| LLAMAR: `<a href="tel:...">` o `<button disabled>` con tooltip | DONE |
| VER FOTO: abre photo viewer (última imagen inbound) | DONE |
| EDITAR: abre `EditCustomerModal` (PATCH `/api/clientes/:id`) | DONE |
| `ti-search` eliminado del header (B.5) | DONE |
| BFF proxy `PATCH /api/clientes/[id]` → backend `PATCH /api/crm/customers/:id` | DONE |

### Tests Sprint 6B

| Archivo | Tipo | Casos |
|---|---|---|
| `AiReviewBadge.test.tsx` | unit | 6 |
| `AiReviewItem.test.tsx` | unit | 20 (incl. mapping 6 canales) |
| `useAiResponderPending.test.ts` | unit | 6 |
| `AiReviewDrawer.integration.test.tsx` | integration | 7 |

**Total Sprint 6B: 39 tests · 39 pass · 0 fail**

Documentación detallada del drawer: [`components/AiReviewDrawer/README.md`](./components/AiReviewDrawer/README.md)

---

## Items fuera de alcance (NO implementados)

| Elemento | Estado |
|---|---|
| Tags de intención NLU (backend no soporta) | NO se implementa |
| Resumen inteligente de consulta (NLU) | NO se implementa |
| Sugerencia de producto del bot (NLU) | NO se implementa |

---

## ADRs relacionados

- **ADR-007**: 5 canales unificados → `ChannelBadge`
- **ADR-009**: Vista supervisor → **NO** es este módulo. Ver `/ventas/tablero`.
- **BE-1.9**: `chat_stage` calculado por backend → `PipelineMini` lo consume directamente.
