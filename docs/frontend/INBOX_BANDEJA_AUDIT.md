# Auditoría `/inbox` vs `/bandeja` · 2026-04-18

**Ticket:** FE-1.5.1
**Autor:** Sprint 1.5 FE
**Estado:** aprobado tras revisión cruzada con Cursor backend (update 2026-04-18)

---

## Historial de cambios

### 2026-04-18 (post-FE-1.5.2) · enum de 8 valores confirmado

Tras verificación formal del backend (escenario B), `ChatStage` incluye **8 valores**, no 7. Se agrega `'order'` entre `'approved'` y `'payment'`.

Casos reales que emiten `'order'`:
- Orden recién creada sin `payment_status` asignado.
- Pago aprobado sin `fulfillment_type` asignado todavía.

Archivos actualizados: `src/types/inbox.ts`, `ChatListItem.tsx` (`STAGE_COLORS`).
`ChatStageSection.tsx` sin cambios (itera sobre `CHAT_STAGE_ORDER`).

---

### 2026-04-18 · update tras revisión del Cursor backend (BE-1.9)

El backend revisó la propuesta de este audit y produjo 3 correcciones que se adoptan sin reservas:

1. **Nombre del campo:** `chat_stage`, **no** `lifecycle_stage`. Ya existe un `lifecycle_stage` en `salesService.js` con otro significado (feedback ML post-venta: `waiting_buyer_feedback` / `waiting_seller_feedback` / `feedback_complete`). Usar el mismo nombre habría creado una ambigüedad grave en Sprint 3 al construir `v_sales_pipeline`.
2. **Ruta A confirmada (backend deriva):** el `CASE` se computa en backend (SQL) dentro del endpoint `/api/inbox` (y lo heredan los proxies `/api/bandeja`). **La ruta B (derivar en frontend) queda descartada.** Costo real BE-1.9: **2-3 h**, cabe holgado en Sprint 1.
3. **Enum canónico de 7 valores** (backend autoritativo):

   ```
   contact    → chat sin cotización ni orden
   ml_answer  → source_type = 'ml_question' pendiente de responder
   quote      → inventario_presupuesto con status ∈ (draft, sent)
   approved   → presupuesto approved, sin orden aún
   payment    → sales_orders existe, payment_status = pending
   dispatch   → payment_status = approved, fulfillment IN (preparing, ready, shipped)
   closed     → fulfillment = delivered (y approval != rejected)
   ```

   Notar: reemplaza la etapa `order` (nombre usado por el monolito `/inbox`) por **`approved`** — refleja con más precisión que hay cotización aprobada pero aún no hay `sales_orders.id`.

**Reglas duras derivadas (obligatorias para FE-1.5.2):**

- **NO** derivar `ml_answer` (ni ninguna otra etapa) en frontend con lógica propia. **Backend es la única fuente de verdad.**
- **NO** nombrar el campo `lifecycle_stage` en tipos/UI del frontend. Usar `chat_stage`. Si hace falta un alias por legibilidad interna, documentarlo en `src/types/inbox.ts`.
- **Sí** se permite **fallback temporal** en frontend usando datos ya disponibles (`order.payment_status`, `order.fulfillment_type`, `source_type`, `identity_status`) **mientras BE-1.9 no esté desplegado**, pero la UI debe leer `chat.chat_stage` cuando exista, y el fallback se elimina apenas BE-1.9 llegue a prod.

**Impacto en estimaciones y secuencia (sección 5 actualizada):**

| Gap | Antes | Después | Dependencia |
|---|---|---|---|
| G1 · Pipeline visual 7 etapas | 2-3 h | **2-3 h** — arrancar ya con fallback, swap a `chat_stage` al desplegar BE-1.9 | Independiente |
| G2 · Identificación de cliente | 3-4 h | **3-4 h** | Independiente |
| G5 · Pills de lifecycle en `ChatListItem` | 2-4 h según ruta | **2 h** — esperar BE-1.9 desplegado | **Bloquea** hasta BE-1.9 |

---

## Resumen ejecutivo

- Hoy conviven **dos UIs del mismo dominio** (bandeja omnicanal): `/inbox` (layout 4 columnas, monolito en `src/components/inbox/InboxPage.tsx`) y `/bandeja` (shell actualizado con tema WhatsApp y arquitectura de componentes + hooks).
- El **sidebar Spacework ya dirige todo a `/bandeja`** (filtros, WA, ML). `/inbox` solo permanece como ruta activa con un monolito y una sub-ruta `/inbox/history` que es `ComingSoon`.
- **Decisión:** URL canónica `/bandeja`. `/inbox` → redirect **308 permanent** a `/bandeja`.
- **Backend provee la etapa del chat como campo `chat_stage`** (enum de 7 valores: `contact | ml_answer | quote | approved | payment | dispatch | closed`). Ticket BE-1.9 ≈ 2-3 h, cabe en Sprint 1.
- **Gaps a migrar** (5 items): G1 Pipeline visual 7 etapas, G2 Identificación de cliente, G5 Pills de `chat_stage` en lista. Se difieren G3 (modal comprobantes → Sprint 5) y G7 (flag IA ya respondió → opcional).
- **Secuencia FE-1.5.2:** G1 + G2 en paralelo (independientes); G5 cuando BE-1.9 esté desplegado.
- Kill list clara y **acotada a 6 archivos**; BFF `src/app/api/inbox/**` **no se elimina** (lo sigue consumiendo `/bandeja`).

---

## 1 · Superficie inspeccionada

### 1.1 Rutas UI

| Ruta | Archivo | Qué monta |
|---|---|---|
| `/bandeja` | `src/app/(features)/bandeja/page.tsx` | Shell con `ChatList` (una sola columna + panel vacío a la derecha) |
| `/bandeja/[chatId]` | `src/app/(features)/bandeja/[chatId]/page.tsx` | Shell 3 columnas: `ChatList` + `ChatWindow` + `ChatContextPanel` (+ `ChatActionSlideOver`) |
| `/inbox` | `src/app/(features)/(inbox)/inbox/page.tsx` | Renderiza **`src/components/inbox/InboxPage.tsx`** (monolito 4 columnas) |
| `/inbox/history` | `src/app/(features)/(inbox)/inbox/history/page.tsx` | **`<ComingSoon module="Spacework - Historial" />`** (placeholder, sin lógica) |

> `/inbox` **no tiene ruta dinámica `/inbox/[chatId]`**: la selección de chat se maneja como estado interno de `InboxPage`, nunca en URL.

### 1.2 Componentes/hook del monolito `/inbox`

- `src/components/inbox/InboxPage.tsx` (≈1559 líneas, un solo componente)
- `src/components/inbox/LifecyclePanel.tsx` (7 etapas: contact → ml_answer → quote → order → payment → dispatch → closed)
- `src/components/inbox/inboxTypes.ts` (tipos locales: `InboxChat`, `LifecycleStage`, `InboxViewFilter`, etc. — **distintos** de los tipos canónicos en `src/types/inbox.ts` usados por `/bandeja`)
- `src/components/inbox/inboxMockData.ts` (mock; solo se autoreferencia)

### 1.3 Componentes de `/bandeja`

| Archivo | Rol |
|---|---|
| `components/ChatList.tsx` | Lista con scroll infinito (`useInbox` hook), skeleton, empty-state |
| `components/ChatListItem.tsx` | Item con avatar, preview, `unread_count`, badge de fuente, pill "Con orden" |
| `components/ChatFilters.tsx` | Búsqueda + select de fuente (WA / ML Preguntas / ML Mensajes) |
| `components/InboxCountBadges.tsx` | Tabs con conteos (Todas / Sin leer / Pago pend. / Cotizar / Despachar) — polling 30s a `/api/bandeja/counts` |
| `components/ChatHeader.tsx`, `components/ChatWindow.tsx`, `components/MessageInput.tsx`, `components/MessageBubble.tsx` | Chat con polling vía `useChatMessages`; `MessageInput` enruta ML vía BFF |
| `[chatId]/components/ChatContextPanel.tsx` | Ficha cliente resumida, acciones, órdenes recientes, vehículos, sección específica `MlQuestionContextSection` |
| `[chatId]/components/ChatActionSlideOver.tsx` | Slide-over con `MiniPos`, `PayPanel`, `DispatchPanel`, + `NewQuotationModal` (reutiliza modal ya existente en ventas) |
| `bandeja-theme.scss` | Tema tipo WhatsApp Web (variables `--wa-*`) |

### 1.4 BFF (no UI)

- `src/app/api/bandeja/**` · lista + messages + counts (3 archivos) — **consumido solo por `/bandeja`**
- `src/app/api/inbox/**` · ML question/answer, ML message reply, identity-candidates, link-customer, link-ml-order, payments (confirm/reject/pending), quotations — **consumido por AMBAS UIs** (`/bandeja` llama directamente a `/api/inbox/{chatId}/ml-question/*`, `/api/inbox/{chatId}/ml-message/reply`, etc.)

> **Conclusión BFF:** no borrar `src/app/api/inbox/**` al cerrar la UI `/inbox`. El BFF se queda y lo sigue consumiendo `/bandeja`.

---

## 2 · Tabla comparativa de features

Leyenda: ✅ presente y completo · 🟡 parcial · ❌ ausente · 🗑️ no vale la pena preservar

| # | Feature / Pantalla | En `/inbox` | En `/bandeja` | Decisión | Gap a migrar |
|---|---|---|---|---|---|
| 1 | Listado de chats con scroll infinito | ✅ (cursor, infinite scroll, 30/página) | ✅ `ChatList` + `useInbox` (`loadMore`) | Mantener en bandeja | — |
| 2 | Búsqueda por nombre/teléfono | ✅ (debounce 400ms) | ✅ `ChatFilters` (debounce en `useInbox`) | Mantener en bandeja | — |
| 3 | Filtros rápidos (Todas/Sin leer/Pago/Cotizar/Despachar) | ✅ (sidebar oscura) | ✅ `InboxCountBadges` (tabs horizontales) | Mantener en bandeja | — |
| 4 | Filtros por fuente (WA / ML) | ✅ | ✅ (select en `ChatFilters`) | Mantener en bandeja | — |
| 5 | Filtros "tareas ML" (Preguntas ML / Mensajería ML / WA+orden ML) | ✅ (3 botones dedicados) | 🟡 solo via query `?src=ml_question` sin botón UI explícito | Mantener en bandeja; **gap menor** | **G4 (opcional)** — añadir pestañas/chips para `ml_question`, `ml_message`, `wa_ml_linked` en `InboxCountBadges` |
| 6 | Badge de fuente en item de lista | ✅ | ✅ (`SourceBadge` en `ChatListItem`) | Mantener | — |
| 7 | **Pills de etapa por chat en la lista** (Contacto / Resp. ML / Cotiz. / Aprobada / Pago / Desp. / Cerrado) | ✅ (`lifecyclePills`) | ❌ (solo muestra pill "Con orden") | Migrar | **G5** — agregar función `chatStagePills` a `ChatListItem` leyendo `chat.chat_stage` (campo provisto por BE-1.9). **Depende de BE-1.9 desplegado.** |
| 8 | Polling de counts (bandeja de conteos) | ✅ 60 s a `/api/inbox/counts` | ✅ 30 s a `/api/bandeja/counts` | Mantener bandeja | — |
| 9 | Polling de mensajes del chat activo | ✅ 5 s a `/api/crm/chats/{id}/messages` | ✅ vía `useChatMessages` (hook dedicado) | Mantener bandeja | — |
| 10 | Envío optimistic + estado `pending/error` | ✅ (manual en el monolito) | ✅ (en `useChatMessages` / `MessageInput`) | Mantener bandeja | — |
| 11 | Mensajes tipo `system` centrados | ✅ | ✅ (en `MessageBubble`) | Mantener bandeja | — |
| 12 | Envío de texto a WA | ✅ | ✅ (`sendMessage`) | Mantener bandeja | — |
| 13 | Envío a ML: respuesta a pregunta (`/ml-question/answer`) | ✅ (modal dedicado) | ✅ (vía `sendMessageForChat` en `[chatId]/page.tsx`) | Mantener bandeja | — |
| 14 | Envío a ML: reply post-venta (`/ml-message/reply`) | ❌ | ✅ (vía `sendMessageForChat`) | `/bandeja` es superset | — |
| 15 | Ver pregunta ML formateada + link a ML (permalink / `https://articulo.mercadolibre.com.ve/MLV-<id>`) | 🟡 (solo texto en modal) | ✅ (`MlQuestionContextSection` con link) | `/bandeja` mejor | — |
| 16 | Flag "IA ya respondió" en pregunta ML | ✅ (`ia_already_answered`) | ❌ | **Descartar o diferir** | G7 — opcional (valor bajo; la UI de bandeja ya permite responder siempre) |
| 17 | **Identificación de cliente** (`phoneMatches`, `mlBuyerMatches`, `keywordHint` + botón "Confirmar") | ✅ (alerts en header con botón → `POST /api/inbox/{id}/link-customer`) | ❌ (`ChatContextPanel` muestra "Cliente no identificado" + botón *disabled*) | Migrar | **G2** — agregar a `ChatContextPanel` cuando `!hasCustomer`, usando `/api/inbox/{chatId}/identity-candidates` + `/api/inbox/{chatId}/link-customer` |
| 18 | Alerta "Orden ML detectada" (para `auto_matched`) | ✅ | ❌ | Migrar junto a G2 | **G2.a** (subcaso) |
| 19 | Ficha cliente (resumida con total_orders, total_spent) | ❌ | ✅ (`ChatContextPanel`) | `/bandeja` superset | — |
| 20 | Órdenes recientes del cliente | ❌ | ✅ (`ChatContextPanel` + `useChatContext` + `SaleStatusBadge`) | `/bandeja` superset | — |
| 21 | Vehículos del cliente | ❌ | ✅ (`ChatContextPanel`) | `/bandeja` superset | — |
| 22 | **Pipeline visual del chat** (contact → ml_answer → quote → approved → order → payment → dispatch → closed) | ✅ (`LifecyclePanel` columna 4) | ✅ `ChatStageSection` integrado en `ChatContextPanel` | Migrado en FE-1.5.2 | Enum canónico `chat_stage` con **8 valores**. |
| 23 | Modal "Nueva cotización" con búsqueda de productos inline | ✅ (modal Bootstrap + fetch `/api/inventory/products/search` + lista manual) | ✅ (`NewQuotationModal` importado desde `ventas/cotizaciones`; `ProductSearch` compartido) | `/bandeja` mejor (reusa producto de ventas) | — |
| 24 | Acción "Ver inventario" | 🟡 (botón placeholder) | ❌ (se resuelve desde ficha/POS) | Descartar | 🗑️ |
| 25 | Acción "Crear orden" | 🟡 (botón placeholder) | ✅ (vía POS rápido en `ChatActionSlideOver`) | `/bandeja` superset | — |
| 26 | POS rápido integrado en el chat | ❌ | ✅ (`MiniPos` en `ChatActionSlideOver`) | `/bandeja` superset | — |
| 27 | Solicitar despacho sobre orden existente | ❌ | ✅ (`DispatchPanel` + `RequestDispatchModal`) | `/bandeja` superset | — |
| 28 | Acción "Cobrar" (links a cotizaciones del cliente) | ❌ | ✅ (`PayPanel`) | `/bandeja` superset | — |
| 29 | **Modal "Comprobantes pendientes"** (lista de attempts + confirmar/rechazar) | ✅ (flujo `/api/inbox/{id}/payments/pending` + confirm/reject) | ❌ | **Diferir a Sprint 5** (conciliación bancaria) | **G3** — encaja mejor en `/ventas/conciliacion` (Sprint 5). No migrar en 1.5. Documentar para el Sprint 5 FE. |
| 30 | Redirect `/signin` en 401 | ✅ (`handleAuthRedirect`) | 🟡 (`FeaturesAuthGate` en layout ya protege antes; falta handler explícito en hooks de chat) | Mantener bandeja | — (cubierto por `FeaturesAuthGate`) |
| 31 | Ruta `/inbox/history` | 🟡 `ComingSoon` (placeholder) | ❌ | Eliminar `/inbox/history` y redirect a `/bandeja` | Nota: si se decide construir historial, planificar en sprint dedicado |
| 32 | Estilos inline (paletas hardcodeadas) vs tema scoped | 🟡 (colores `#1a1a2e`, `#FF6B2C`, etc. inline en JSX) | ✅ (`bandeja-theme.scss`, variables CSS scoped) | `/bandeja` gana consistencia | — |

**Total features evaluadas: 32.**

---

## 3 · Decisiones

1. **URL canónica: `/bandeja`** (consistente con el sidebar Spacework que ya apunta ahí en todos sus items funcionales).
2. **`/inbox` → redirect 308 permanent a `/bandeja`** (próxima tarea FE-1.5.3). Se deja el componente `InboxPage.tsx` en código hasta que el redirect esté en producción 1-2 semanas sin regresiones.
3. **`/inbox/history` → redirect 308 permanent a `/bandeja`** (por ahora). Es un `ComingSoon` sin lógica, y no hay una vista de historial equivalente todavía. Si se decide construir "Historial Spacework" se hace como ruta nueva bajo `/bandeja/historial` en sprint dedicado.
4. **BFF `src/app/api/inbox/**` se conserva íntegro** — `/bandeja` depende de él (rutas ML, quotations, link-customer, payments, identity-candidates). No entra en la kill list.
5. **Tipos duplicados: canonizar en `src/types/inbox.ts`**. Los tipos locales de `src/components/inbox/inboxTypes.ts` se eliminan con la kill list. Antes de borrar, cualquier migración de gap (G1, G2, G5) usa los tipos canónicos de `src/types/inbox.ts`. Concretamente: agregar a `src/types/inbox.ts` un tipo `ChatStage = 'contact' | 'ml_answer' | 'quote' | 'approved' | 'payment' | 'dispatch' | 'closed'` y un campo opcional `chat_stage?: ChatStage` en el tipo `InboxChat`. **No reintroducir `lifecycle_stage` como nombre en los tipos del frontend** (colisiona con el `lifecycle_stage` que backend usa para feedback ML post-venta en `salesService.js`).
6. **Sidebar Spacework: `label: "Historial"` apunta hoy a `route.inboxHistory`.** Se actualiza en FE-1.5.3 al mismo tiempo que los redirects: quitar el item o apuntar a ruta futura.
7. **Link en `src/components/dashboards/newdashboard.tsx:335` a `route.inbox`** seguirá funcionando via redirect 308, pero se actualiza oportunistamente en FE-1.5.3 a `route.bandeja` para evitar un salto extra en producción.

---

## 4 · Mapping de redirects

A aplicar en `next.config.ts` (ticket FE-1.5.3):

| Ruta origen (`/inbox…`) | Destino (`/bandeja…`) | Tipo | Notas |
|---|---|---|---|
| `/inbox` | `/bandeja` | 308 permanent | — |
| `/inbox/history` | `/bandeja` | 308 permanent | `ComingSoon` sin lógica. Cuando exista historial canónico, reapuntar a `/bandeja/historial` o similar. |
| `/inbox/:chatId` | `/bandeja/:chatId` | 308 permanent | **Preventivo**: hoy `/inbox/[chatId]` no está en App Router (`/inbox` maneja selección por state, no URL), pero el catch-all cubre cualquier link externo que alguien haya generado hacia `/inbox/<id>`. |

**Ítems de Sidebar a corregir en FE-1.5.3 junto con el redirect:**
- `src/core/json/siderbar_data.tsx:140` · eliminar el item "Historial" o reapuntarlo a nueva ruta planificada.

**Links hardcodeados a actualizar:**
- `src/components/dashboards/newdashboard.tsx:335` · `route.inbox` → `route.bandeja` (o dejarlo y confiar en redirect; trade-off: correr redirect extra en prod vs. tocar dashboard).

---

## 5 · Gaps identificados (tickets para FE-1.5.2)

| ID | Gap | Prioridad | Dónde migra en `/bandeja` | Estimación | Dependencia |
|---|---|---|---|---|---|
| **G1** | Pipeline visual 7 etapas (contact → ml_answer → quote → approved → payment → dispatch → closed) por chat seleccionado | Media-Alta | Nuevo componente `ChatStagePanel` dentro de `ChatContextPanel.tsx` (sección al tope, entre "Cliente" y "Acciones"). Lee `chat.chat_stage` (campo canónico de backend). **Fallback temporal** mientras BE-1.9 no esté en prod: derivar localmente desde `order.payment_status` / `order.fulfillment_type` / `source_type` / `identity_status`, **aislado en un único helper** `src/lib/bandeja/deriveChatStage.ts` para que el swap a `chat.chat_stage` sea un cambio de una línea. | **2-3 h** | **Independiente** — arrancar ya |
| **G2** | Identificación de cliente (phoneMatches / mlBuyerMatches / keywordHint + botón Confirmar) | **Alta** | Dentro de `ChatContextPanel.tsx` → reemplazar el bloque `!hasCustomer` (actualmente "Identificar cliente" con botón deshabilitado) por el flujo real: fetch `/api/inbox/{chatId}/identity-candidates`, render alerts por tipo, acción `POST /api/inbox/{chatId}/link-customer` con `link_type: phone \| ml_buyer`. | **3-4 h** | **Independiente** — arrancar ya |
| **G5** | Pills de `chat_stage` por chat en `ChatListItem` | Media | Función `chatStagePills(chat)` en `ChatListItem.tsx`, leyendo `chat.chat_stage` (no derivar en frontend). 7 pills posibles según el enum canónico. | **2 h** | **Bloqueado por BE-1.9** — arrancar cuando backend despliegue `chat_stage` en `/api/inbox` / `/api/bandeja` |
| **G4** | Chips "Preguntas ML / Mensajería ML / WA+orden ML" en `InboxCountBadges` | Baja | Extender `InboxCountBadges.tsx` con una 2a fila opcional o un `Select` de "Categoría ML". Hoy se llega vía query `?src=ml_question` pero sin UI dedicada. | **1-2 h** | — (backlog) |
| **G7** | Flag "IA ya respondió" en pregunta ML | **Descartar** o muy baja | Si se migra: en `MlQuestionContextSection` mostrar badge cuando `ia_already_answered === true`. Valor bajo porque la UI de bandeja siempre permite responder igual. | **30 min** o descartado | — |
| **G3** | Modal "Comprobantes pendientes" (WA payments) | **Diferir a Sprint 5** | Vista `/ventas/conciliacion` del Sprint 5 (addendum FE-5.x). No migra a bandeja. **Documentar para el Cursor backend/frontend del Sprint 5**. | — | — (fuera de Sprint 1.5) |

### Alcance recomendado FE-1.5.2

- **Arrancar ya (paralelo):** G1 (2-3 h) + G2 (3-4 h). Independientes entre sí y del backend.
- **Esperar BE-1.9 desplegado:** G5 (2 h). Como BE-1.9 está estimado en 2-3 h, lo más probable es que llegue a prod antes de que G1/G2 cierren.
- **Diferir:** G3 → Sprint 5. G4 → backlog. G7 → descartar.

Total FE-1.5.2 ≈ **7-9 h** (≈ 1-1.5 días). Cabe holgado en los 2 días presupuestados y deja tiempo para FE-1.5.3 a 1.5.6.

### Reglas duras (heredadas del update 2026-04-18)

- **NO** implementar lógica propia para derivar `ml_answer` (ni ninguna otra etapa) cuando `chat.chat_stage` esté disponible. Backend es la única fuente de verdad para la etapa.
- **NO** usar `lifecycle_stage` como nombre de campo en tipos/UI del frontend (nombre reservado por backend para feedback ML post-venta en `salesService.js`).
- El fallback temporal de G1 (antes de BE-1.9) **debe vivir aislado en un único helper** y **debe ceder** al valor real `chat.chat_stage` apenas venga del backend, con una sola línea de cambio.

---

## 6 · Kill list

### 6.1 Archivos a eliminar (post-redirect, tras 1-2 semanas en prod sin regresiones)

| Archivo | Razón | Consumidores |
|---|---|---|
| `src/app/(features)/(inbox)/inbox/page.tsx` | Reemplazado por redirect 308 a `/bandeja` | ninguno externo |
| `src/app/(features)/(inbox)/inbox/history/page.tsx` | `ComingSoon` sin valor; reemplazado por redirect | ninguno externo |
| `src/components/inbox/InboxPage.tsx` | Monolito de 1559 líneas; reemplazado por stack `/bandeja` + gaps migrados | solo el `page.tsx` eliminado arriba |
| `src/components/inbox/LifecyclePanel.tsx` | Su lógica se absorbe en G1 dentro de `ChatContextPanel` | solo `InboxPage.tsx` |
| `src/components/inbox/inboxTypes.ts` | Duplicado de `src/types/inbox.ts`; la migración de gaps usa los tipos canónicos | `InboxPage.tsx`, `LifecyclePanel.tsx`, `inboxMockData.ts` |
| `src/components/inbox/inboxMockData.ts` | Mock sin consumo externo confirmado; queda huérfano | solo `InboxPage.tsx` (verificado con grep) |

### 6.2 Carpeta `src/components/inbox/` queda vacía

Después del borrado, la carpeta `src/components/inbox/` queda vacía. Eliminar la carpeta también (`git rm -r`).

### 6.3 Qué NO se elimina

- **`src/app/api/inbox/**`** — BFF compartido que `/bandeja` sigue consumiendo (ML questions/answers, ML message reply, identity-candidates, link-customer, link-ml-order, payments, quotations). **No tocar.**
- **`src/types/inbox.ts`** — tipos canónicos usados por `/bandeja`. **No tocar.**
- **`src/data/all_routes.tsx`** — mantener `inbox` e `inboxHistory` como strings por ahora; son constantes inocuas y permiten que linkback existentes no rompan. Marcar como `@deprecated` en comentario en el mismo archivo al cerrar el sprint.

### 6.4 Fecha propuesta de borrado

- **Sprint 1.5 día final:** commit que agrega redirects + migra gaps, **sin** borrar los 6 archivos.
- **+1 a 2 semanas de observación** (logs de 404/308, feedback de usuarios).
- **Ticket de limpieza:** crear `FE-1.5.X-cleanup` a ejecutar tras observación. Ese ticket ejecuta el borrado y ajusta el link de `newdashboard.tsx` y el item "Historial" del sidebar.

---

## 7 · Criterios de verificación de la auditoría

- [x] Tabla de features con 32 ítems (mínimo exigido: 10)
- [x] Decisión explícita por cada feature (mantener / migrar / descartar / diferir)
- [x] Mapping de redirects completo (3 patrones cubren todo `/inbox*`)
- [x] Kill list explícita con 6 archivos + carpeta + fecha tentativa
- [x] Separación clara entre "UI a eliminar" y "BFF a conservar"
- [x] Lista de gaps con estimación y prioridad para FE-1.5.2

---

## 8 · Escalamientos / casos no triviales

- **Tipos duplicados (`inboxTypes.ts` vs `src/types/inbox.ts`):** la migración de gaps debe usar los canónicos. Al migrar G1/G2/G5, **ampliar `src/types/inbox.ts`** con:
  - `type ChatStage = 'contact' | 'ml_answer' | 'quote' | 'approved' | 'payment' | 'dispatch' | 'closed'`
  - Campo opcional `chat_stage?: ChatStage` en el tipo `InboxChat`.
  - Si aparece `identity_candidates` estructurado, modelarlo también allí.

  **No** reintroducir tipos locales en `src/components/inbox/inboxTypes.ts`.

- **Derivación de etapa (resuelto en update 2026-04-18):** **Ruta A confirmada** — el backend computa el `CASE` en SQL y expone el campo `chat_stage` vía BE-1.9 (≈ 2-3 h en Sprint 1). La Ruta B (derivar en frontend) **queda descartada**: replicarla abre la puerta a divergencias entre `ChatList` y `ChatContextPanel`, y se vuelve explosiva en Sprint 3 cuando `v_sales_pipeline` use el mismo CASE para el Kanban.

  **Único uso legítimo de lógica local:** el fallback temporal de G1, aislado en `src/lib/bandeja/deriveChatStage.ts`, mientras BE-1.9 no esté desplegado. Apenas llegue, la UI debe leer `chat.chat_stage` y el helper se marca `@deprecated` y se elimina.

- **Trampa `ml_answer`:** tentación de tratar `ml_answer` como "7ª etapa adicional" derivada en frontend desde `source_type === 'ml_question'`. **Prohibido.** La incluye el backend en el mismo `CASE` de `chat_stage`. Derivarla en frontend = doble fuente de verdad (misma clase de error que `productos` vs `products`).

- **Nombre del campo:** el backend ya usa `lifecycle_stage` en `salesService.js` con un significado distinto (feedback ML post-venta). El nuevo campo **se llama `chat_stage`**. No usar `lifecycle_stage` en tipos/props/URL params del frontend.

- **G3 (comprobantes pendientes):** el flujo de `/api/inbox/{id}/payments/pending` y `/api/inbox/payments/confirm`, `/api/inbox/payments/reject` seguirá existiendo en el BFF. Al construir `/ventas/conciliacion` en Sprint 5, considerar si ese BFF se reutiliza o si se expone uno nuevo (`/api/sales/bank-transactions/...`) según ADR-005 y el addendum FE-5.x.

---

## 9 · Check de aprobación

- [x] **URL canónica `/bandeja`** y redirect 308 — aprobado.
- [x] **Alcance de gaps:** G1 + G2 + G5 en 1.5; G3 diferido a Sprint 5; G4 backlog; G7 descartado — aprobado.
- [x] **Kill list diferida 1-2 semanas post-redirect** — aprobado.
- [x] **Nombre del campo `chat_stage`** y enum canónico de 7 valores (`contact | ml_answer | quote | approved | payment | dispatch | closed`) — aprobado (update 2026-04-18, acordado con backend).
- [x] **Ruta A (backend deriva)** — confirmada. Ruta B descartada.

**Estado:** audit cerrado. Proceder con FE-1.5.2 siguiendo la secuencia:

1. **G1 y G2 en paralelo** (ya; independientes del backend).
2. **G5** cuando BE-1.9 despliegue `chat_stage` en `/api/inbox` (propagado a `/api/bandeja`).
3. Al desplegar BE-1.9, **swap** del helper `src/lib/bandeja/deriveChatStage.ts` por lectura directa de `chat.chat_stage` en G1 (una línea).
