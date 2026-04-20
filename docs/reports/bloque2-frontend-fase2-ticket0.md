# Ticket 0 · Reconciliación de tipos y paths
**Bloque 2 Frontend — Fase 2**  
**Fecha:** 20 de abril de 2026  
**Estado:** ✅ CERRADO — camino limpio para F2.1 (con aviso sobre bot-actions)

---

## T0.1 · Resultados del grep exhaustivo

### `grep -rn "api/ventas/supervisor" src/`

```
src/app/(features)/observacion/page.tsx:206          /api/ventas/supervisor/kpis  (string de display únicamente)
src/hooks/useSupervisorExceptions.ts:93              fetch('/api/ventas/supervisor/exceptions', …)
src/hooks/useSupervisorWaiting.ts:87                 fetch('/api/ventas/supervisor/waiting', …)
src/hooks/useSupervisorKPIs.ts:56                    fetch('/api/ventas/supervisor/kpis', …)
```

### `grep -rn "api/sales/supervisor" src/`

```
src/app/(features)/ventas/tablero/mock-data.ts:13    comentario, no es fetch
src/app/api/ventas/supervisor/exceptions/route.ts:12,21  BFF → backend /api/sales/supervisor/exceptions
src/app/api/ventas/supervisor/waiting/route.ts:12,21     BFF → backend /api/sales/supervisor/waiting
src/app/api/ventas/supervisor/kpis/route.ts:12,21        BFF → backend /api/sales/supervisor/kpis
```

### `grep -rn "/api/ventas/" src/` (resumen)

Todos los fetches en componentes/hooks usan rutas BFF (Next.js):
- `/api/ventas/supervisor/exceptions` → proxiado por `src/app/api/ventas/supervisor/exceptions/route.ts`
- `/api/ventas/supervisor/waiting` → proxiado por `src/app/api/ventas/supervisor/waiting/route.ts`
- `/api/ventas/supervisor/kpis` → proxiado por `src/app/api/ventas/supervisor/kpis/route.ts`
- `/api/ventas/exceptions/:id/resolve` → proxiado por `src/app/api/ventas/exceptions/[id]/resolve/route.ts`
- `/api/ventas/pedidos`, `/api/ventas/historial`, `/api/ventas/cotizaciones` → otras áreas (fuera de scope)

### `grep -rn "/api/sales/" src/` (resumen)

Sólo aparece en los route handlers BFF (no en hooks ni componentes cliente):
- `src/app/api/ventas/supervisor/exceptions/route.ts` → target backend `/api/sales/supervisor/exceptions`
- `src/app/api/ventas/supervisor/waiting/route.ts` → target backend `/api/sales/supervisor/waiting`
- `src/app/api/ventas/supervisor/kpis/route.ts` → target backend `/api/sales/supervisor/kpis`
- `src/app/api/ventas/exceptions/[id]/resolve/route.ts` → target backend `/api/sales/exceptions/:id/resolve`
- `src/app/api/ordenes/[id]/...` → otros endpoints (fuera de scope Bloque 2)

### **Conclusión T0.1**

> **BFF reescribe en 3 route handlers** (`ventas/supervisor/{exceptions,waiting,kpis}/route.ts`).  
> Los hooks llaman BFF paths en español (`/api/ventas/…`). Los route handlers de la BFF proxian al backend inglés (`/api/sales/…`). Patrón consistente. **No hay paths dispersos hardcodeados al backend desde componentes cliente.**

---

## T0.2 · Curls con autenticación — JSON crudo

### Condición previa
`WEBHOOK_RECEIVER_BASE_URL=http://localhost:3002` (`.env`).  
Backend verificado levantado al inicio de la sesión. Autenticación via `X-Admin-Secret` header (backend acepta esta cabecera además de JWT cookie).

### Curl 1: `GET /api/inbox?limit=5` — verificar campos de excepción

```bash
curl.exe -sS -H "X-Admin-Secret: <secret>" "http://localhost:3002/api/inbox?limit=5"
```

**Respuesta (primer ítem):**

```json
{
  "id": 4401,
  "phone": "mlq:13566652205",
  "source_type": "ml_question",
  "identity_status": "unknown",
  "last_message_text": "Quiero 4 Pero las q son las grandes no sé si admision o escape",
  "last_message_at": "2026-04-20T17:08:03.704Z",
  "unread_count": 2,
  "ml_order_id": null,
  "assigned_to": null,
  "customer_name": null,
  "order": null,
  "chat_stage": "ml_answer",
  "status": "UNASSIGNED",
  "sla_deadline_at": null,
  "last_outbound_at": null,
  "has_active_exception": false,
  "top_exception_reason": null,
  "top_exception_code": null
}
```

**Envelope:** `{ "chats": [...], "nextCursor": "...", "total": 281 }` — patrón `.chats[0]` confirmado.

### Curl 2: `GET /api/sales/supervisor/exceptions`

```bash
curl.exe -sS -H "X-Admin-Secret: <secret>" "http://localhost:3002/api/sales/supervisor/exceptions"
```

**Respuesta:**
```json
[]
```
Array vacío. Endpoint responde HTTP 200. No hay excepciones activas en el entorno local al momento del test.

### Curl 3: `GET /api/ventas/supervisor/exceptions` (versión español — backend directo)

```bash
curl.exe -sS -H "X-Admin-Secret: <secret>" "http://localhost:3002/api/ventas/supervisor/exceptions"
```

**Respuesta:**
```json
{"ok":false,"error":"no encontrado"}
```
HTTP 404. Este path NO existe en el backend.

### Curl 4: `GET /api/sales/exceptions?limit=3`

```bash
curl.exe -sS -H "X-Admin-Secret: <secret>" "http://localhost:3002/api/sales/exceptions?limit=3"
```

**Respuesta:**
```json
{"data":[]}
```
Envelope `{"data": [...]}`. Endpoint responde HTTP 200. Sin excepciones en entorno local.

### Curl 5: `GET /api/sales/supervisor/bot-actions` — ⚠️ CRASH

```bash
curl.exe -sS -H "X-Admin-Secret: <secret>" "http://localhost:3002/api/sales/supervisor/bot-actions"
```

**Resultado:** `curl: (56) Recv failure: Connection was reset`  
**Consecuencia:** backend crasheó tras esta request. El proceso en `:3002` dejó de responder.

---

## T0.3 · Decisión de reconciliación

### Caso detectado: **A** (solo existe `/api/sales/supervisor/exceptions` en backend)

El path en español (`/api/ventas/supervisor/exceptions`) no existe en backend → **Caso A confirmado**.

### Análisis de shapes

| Tipo | Shape | Endpoint origen | Usado por |
|------|-------|-----------------|-----------|
| `SupervisorException` | `{id, kind, title, detail, primary_action, secondary_action?, chat_id?, order_id?, created_at}` | `/api/sales/supervisor/exceptions` (vía BFF `/api/ventas/supervisor/exceptions`) | OLD tablero: `ventas/tablero/page.tsx`, `observacion/page.tsx` |
| `Exception` | `{id, chat_id, code, reason, status, created_by, created_at, resolved_by, resolved_at, resolution_notes}` | `/api/sales/exceptions` (a crear en F2.1 como BFF `/api/sales/exceptions`) | NEW Bloque 2: `SupervisorExceptionsPanel`, `ExceptionsPanel` (en ChatContextPanel) |

Los shapes son **fundamentalmente distintos**. No hay un campo 1-a-1 entre `kind/title/detail/primary_action` y `code/reason/status/created_by`.

### Decisión: migración parcial de Exception como canónico

1. **Paths — sin cambio necesario:**  
   La BFF en `src/app/api/ventas/supervisor/exceptions/route.ts` ya existe y ya proxia correctamente a `/api/sales/supervisor/exceptions`. El hook `useSupervisorExceptions` llama al BFF path `/api/ventas/supervisor/exceptions` — CORRECTO. No hay path stale.

2. **Tipo `SupervisorException` — PRESERVADO:**  
   - No se puede migrar sin data real para verificar que el backend de `/api/sales/supervisor/exceptions` devuelve shape `Exception`. El endpoint devuelve `[]`.
   - La UI del OLD tablero (`ventas/tablero/ExceptionsPanel.tsx`) renderiza `exc.kind`, `exc.title`, `exc.detail`, `exc.primary_action` — campos que NO existen en `Exception`. Cambiar el tipo rompería las páginas pre-existentes.
   - **Deuda documentada:** migración de `SupervisorException` → `Exception` en el OLD tablero queda como Sprint 3, condicionada a que el arquitecto confirme el shape real del backend para ese endpoint.

3. **NEW Bloque 2 `SupervisorExceptionsPanel` — ya usa `Exception` + `useExceptions`:**  
   El componente en `src/components/supervisor/SupervisorExceptionsPanel.tsx` importa de `@/types/exceptions` y llama `useExceptions({ status: "OPEN" })`. Correcto. Sin cambios.

4. **`useSupervisorExceptions` — sin refactorización en este ticket:**  
   Sirve al OLD tablero (dominio diferente). Ya tiene polling 30s. Se agrega visibilityState pause + TODO SSE comment en F2.2 sin cambiar la firma pública ni el tipo de retorno.

### Archivos modificados en T0.3
*Ninguno.* La reconciliación resultó en que no es necesario tocar código existente.  
El camino limpio para F2.1 está abierto.

---

## T0.4 · Verificación de campos de inbox

Los tres campos están **presentes** en el JSON real de `/api/inbox?limit=5`:

| Campo | Valor en respuesta | Veredicto |
|-------|--------------------|-----------|
| `has_active_exception` | `false` | ✅ presente |
| `top_exception_reason` | `null` | ✅ presente |
| `top_exception_code` | `null` | ✅ presente |

**Valores `null`/`false`** porque los chats del entorno local no tienen excepciones activas — no es un error, es el estado real.

→ La deuda del §4 del reporte de Fase 1 queda resuelta. Se actualiza ese reporte.

---

## T0.5 · ⚠️ STOP-AND-REPORT parcial: bot-actions crash

Al curlear `/api/sales/supervisor/bot-actions`, el backend hizo crash (connection reset) y quedó fuera de servicio.

**Impacto en Fase 2:**
- Los route handlers de bot-actions se crean igualmente (son proxies sin lógica)
- `useBotActions` y `useSupervisorBotActions` se implementan con fetch real
- En test manual (F2.5), los endpoints de bot-actions podrían fallar si el backend tiene el mismo bug
- **Acción requerida del arquitecto:** reiniciar el backend y verificar qué causa el crash en `/api/sales/supervisor/bot-actions`. Puede ser tabla faltante en DB, join inválido, etc.

---

## Resumen de acciones T0

| Sub-tarea | Resultado |
|-----------|-----------|
| T0.1 · Grep paths | BFF reescribe en 3 handlers. Paths correctos. |
| T0.2 · Curls | Inbox: 3 campos confirmados. Exceptions: `[]`. Bot-actions: crash backend. |
| T0.3 · Decisión | Caso A. Shape incompatible. Migración parcial diferida. Camino limpio para F2.1. |
| T0.4 · Inbox fields | ✅ `has_active_exception`, `top_exception_reason`, `top_exception_code` presentes. |
| T0.5 · Cierre | Reporte escrito. Stop-and-report parcial por bot-actions crash. |

**→ Avanzando a F2.1.** El único riesgo es bot-actions; los route handlers se crean como proxies y el fallo de backend se documentará en F2.5.
