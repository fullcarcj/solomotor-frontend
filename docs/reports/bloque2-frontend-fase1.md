# Bloque 2 Frontend · Reporte de cierre Fase 1

**Fecha:** 20 de abril de 2026  
**Estado:** ✅ COMPLETO — En espera de aprobación del arquitecto para avanzar a Fase 2

---

## 1. Archivos creados

### Tipos TypeScript
| Archivo | Descripción |
|---------|-------------|
| `src/types/botActions.ts` | `BotAction`, `BotActionType`, `BotActionReviewInput` |
| `src/types/exceptions.ts` | `Exception`, `ExceptionCode`, `ExceptionStatus`, `ExceptionResolveInput`, `ExceptionCreateInput`, labels y colores por código |

### Fixtures (datos de prueba)
| Archivo | Contenido |
|---------|-----------|
| `src/fixtures/botActions.ts` | 5 acciones del chat #4332 (variadas: revisada correcta, sin revisar, confianza baja, revisada incorrecta, pending). 8 acciones sin revisar para cola del supervisor. |
| `src/fixtures/exceptions.ts` | 3 excepciones OPEN (SKU_NOT_FOUND, PAYMENT_AMBIGUOUS, AI_LOW_CONFIDENCE) + 1 RESOLVED reciente |

### Hooks
| Archivo | Firma pública |
|---------|--------------|
| `src/hooks/useBotActions.ts` | `useBotActions(chatId)`, `useReviewBotAction()` |
| `src/hooks/useExceptions.ts` | `useExceptions({ status, chatId? })`, `useResolveException()`, `useCreateException()` |
| `src/hooks/useSupervisorBotActions.ts` | `useUnreviewedBotActions({ cursor, limit })` |

### Componentes de presentación
| Archivo | Descripción |
|---------|-------------|
| `src/components/bandeja/HandoffBadge.tsx` | Chip de estado handoff: Sin asignar / Asignado / Atendido / Reabierto / BOT ACTIVO |
| `src/components/bandeja/ExceptionBadge.tsx` | Badge rojo con tooltip, modo compact o expandido |
| `src/components/bandeja/ExceptionsPanel.tsx` | Lista OPEN con botón Resolver → modal con textarea |
| `src/components/bandeja/BotActionsTimeline.tsx` | Timeline Ant de acciones del bot con ConfidenceBar, revisión inline |
| `src/components/supervisor/BotActionsReviewQueue.tsx` | Tabla Ant paginada para la cola del supervisor con modal de revisión |
| `src/components/supervisor/SupervisorExceptionsPanel.tsx` | Tabla con filtros por código y rango de fechas; botones Resolver / Escalar |

### Estilos
| Archivo | Descripción |
|---------|-------------|
| `src/app/(features)/supervisor/supervisor-theme.scss` | Tokens CSS, estilos de todos los componentes nuevos (HandoffBadge, ExceptionBadge, ExceptionsPanel, BotActionsTimeline, supervisor queues, tab bar de ficha) |

### Páginas nuevas
| Archivo | URL |
|---------|-----|
| `src/app/(features)/supervisor/bot-actions/page.tsx` | `/supervisor/bot-actions` |
| `src/app/(features)/supervisor/exceptions/page.tsx` | `/supervisor/exceptions` |

---

## 2. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/types/inbox.ts` | +4 campos opcionales: `has_active_exception?`, `top_exception_reason?`, `top_exception_code?`, `handoff_active?` |
| `src/data/all_routes.tsx` | +2 rutas: `supervisorBotActions`, `supervisorExceptions` |
| `src/core/json/siderbar_data.tsx` | +Sección "Supervisión" con entradas "Cola de revisión bot" y "Excepciones" (con tag NEW visual) |
| `src/app/(features)/bandeja/components/ChatListItem.tsx` | +Import `ExceptionBadge`; renderiza badge compact cuando `has_active_exception ?? false` |
| `src/app/(features)/bandeja/[chatId]/components/ChatContextPanel.tsx` | +Tab bar "Ficha 360° / Timeline bot / Excepciones"; tab "bot" renderiza `BotActionsTimeline`; tab "excepciones" renderiza `ExceptionsPanel` filtrado por `chatId` |

---

## 3. Decisiones visuales tomadas

### Paleta de colores para códigos de excepción
| Código | Color |
|--------|-------|
| SKU_NOT_FOUND | `#ef4444` (rojo) |
| PRICE_CONFLICT | `#f97316` (naranja) |
| STOCK_INSUFFICIENT | `#eab308` (amarillo) |
| CLIENT_DATA_MISSING | `#6366f1` (índigo) |
| PAYMENT_AMBIGUOUS | `#ec4899` (rosa) |
| MANUAL_REVIEW_REQUESTED | `#8b5cf6` (violeta) |
| AI_LOW_CONFIDENCE | `#06b6d4` (cyan) |

### Tag "NEW"
Se aplica en:
- Entradas del sidebar de Supervisión
- Botones de tab "Timeline bot" y "Excepciones" en ChatContextPanel
- Encabezado de tablas BotActionsReviewQueue y SupervisorExceptionsPanel

### Tabs en ChatContextPanel
El spec mencionaba "tabs" para integrar Timeline bot y Excepciones. El ChatContextPanel existente NO usa tabs (es scroll lineal). Se implementó un tab bar `.mu-ficha-tab-bar` que reemplaza la navegación del panel sin romper el contenido existente de "Ficha 360°" (todo el JSX original queda bajo `activeTab === "ficha"`).

### Botón "Escalar" en SupervisorExceptionsPanel
~~Queda `disabled` con `title` que documenta: "TODO: endpoint de escalado pendiente de definición en Bloque 2 BE"~~  
**Removido en Fase 2 según decisión D6 / 6A.** Sin endpoint backend definido, sin promesa. El botón fue eliminado de `SupervisorExceptionsPanel.tsx` en F2.4.

### BotActionsTimeline — sin evento SSE
Se agrega botón "Actualizar" visible (refetch manual) porque no existe `bot_action_created` en los eventos SSE actuales. **TODO documentado** en el componente.

### react-query NO instalado
Se usó `useState + useEffect` con cancelación por ref, patrón consistente con el resto del codebase.

---

## 4. Deuda de contrato (backend necesita entregar)

| Item | Descripción | Impacto |
|------|-------------|---------|
| `GET /api/inbox` extendido | **✅ Verificado 2026-04-20** (Ticket 0 Fase 2). Los tres campos `has_active_exception`, `top_exception_reason` y `top_exception_code` están presentes en el JSON real del backend. Ver `docs/reports/bloque2-frontend-fase2-ticket0.md` §T0.4. | ExceptionBadge en lista |
| Evento SSE `bot_action_created` | No existe hoy. Necesario para reactividad en tiempo real en `BotActionsTimeline`. Actualmente: refetch manual. | BotActionsTimeline |
| Evento SSE `exception_created` / `exception_resolved` | No existe hoy. Needed para que los paneles se actualicen en tiempo real. Actualmente: polling cada 30s (a implementar en Fase 2). | ExceptionsPanel, SupervisorExceptionsPanel |
| Endpoint `POST /api/sales/exceptions/:id/escalate` | Mencionado como posible en la spec de Fase 1. No definido en ADR-009. **Botón "Escalar" removido en Fase 2 (decisión 6A).** Cuando producto defina el contrato, re-agregar el botón y el handler. | SupervisorExceptionsPanel |
| Shape de `GET /api/sales/supervisor/exceptions` | **Analizado en Ticket 0 Fase 2.** El BFF ya existente proxia correctamente a `/api/sales/supervisor/exceptions`. El endpoint devuelve `[]` en local (sin datos). `SupervisorException` (OLD tablero) y `Exception` (Bloque 2) son shapes incompatibles. `SupervisorExceptionsPanel` del Bloque 2 usa `useExceptions` (no `useSupervisorExceptions`). Migración de OLD tablero → `Exception` diferida a Sprint 3. Ver `docs/reports/bloque2-frontend-fase2-ticket0.md`. | SupervisorExceptionsPanel Fase 2 — resuelto |

### 4.1 Verificación pre-Fase 2 — 2026-04-20 (actualizado en Ticket 0 Fase 2)

**✅ Verificado exitosamente** en Ticket 0 Fase 2 usando `X-Admin-Secret` header directamente contra `http://localhost:3002`.

Los tres campos están presentes en la respuesta real de `/api/inbox?limit=5`:
- `has_active_exception: false`
- `top_exception_reason: null`
- `top_exception_code: null`

Envelope confirmado: `{ "chats": [...], "nextCursor": "...", "total": 281 }` — patrón `.chats[0]` correcto.

Ver detalle completo en `docs/reports/bloque2-frontend-fase2-ticket0.md` §T0.4.

---

## 5. Observación sobre hooks existentes

El archivo `src/hooks/useSupervisorExceptions.ts` ya existía y usa `SupervisorException` de `src/types/supervisor.ts`, que tiene un shape **distinto** al `Exception` del Bloque 2. En Fase 2 será necesario:
1. `curl` el endpoint real y comparar shape.
2. Crear `normalizeSupervisorException()` si difieren.
3. Decidir si se unifica o coexisten los dos tipos.

---

## 6. TypeScript status

```
npx tsc --noEmit → 0 errores en archivos nuevos/modificados del Bloque 2.
Los errores pre-existentes (Next.js 15 async params, .next/types/validator.ts) son ajenos a este bloque.
```

---

## 7. STOP — Esperando aprobación del arquitecto

**NO continuar con Fase 2** hasta confirmar:
1. ✅ Diseño visual de HandoffBadge, ExceptionBadge, ExceptionsPanel aprobado
2. ✅ Tabs en ChatContextPanel (Ficha 360° / Timeline bot / Excepciones) aprobados
3. ✅ Estructura de BotActionsReviewQueue y SupervisorExceptionsPanel aprobada
4. ✅ Sidebar sección "Supervisión" con "Cola de revisión bot" y "Excepciones" aprobada
5. ⚠️ Confirmar shape real de `GET /api/sales/supervisor/exceptions` (ver deuda #5 arriba)
6. ⚠️ Confirmar si se necesita el endpoint de escalado antes de Fase 2
