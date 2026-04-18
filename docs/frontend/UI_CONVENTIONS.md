# UI Conventions · Frontend

**Scope:** módulo ventas (`/ventas/**`), bandeja/Spacework (`/bandeja/**`) y código nuevo en general.
**Objetivo:** mantener consistencia visual y técnica, evitar introducir dependencias redundantes y cerrar atajos que históricamente generaron deuda en el repo.
**Última actualización:** Sprint 1.5 FE · 2026-04-18.

> La realidad del código manda. Si algo en este documento contradice una
> implementación existente y esa implementación tiene razones válidas,
> parar y escalar antes de cambiarla. Esto es una guía, no dogma.

---

## 1 · Stack UI canónico

El repo nace del template **Dreams POS** (DreamsTechnologies). Coexisten varias librerías por herencia, pero hay una jerarquía clara para código nuevo:

### Primario · usar por defecto

- **Ant Design 5** (`antd`) — tablas, modales, forms complejos, selects, DatePicker, notification, message, Tag, Spin, Alert, Upload, Drawer.
- **React Bootstrap 2** + **Bootstrap 5.3** — grid (`row`/`col`), layout, cards simples, utilidades `.d-flex`, `.text-muted`, etc.
- **SCSS modular con scope explícito** — ej. `bandeja-theme.scss` scoped bajo `.bandeja-shell`, `tablero.scss` scoped bajo `.ventas-tablero-*`. Nunca estilos globales sin prefijo.
- **SweetAlert2** (`sweetalert2` + `sweetalert2-react-content`) — confirmaciones destructivas y alertas modales bloqueantes.
- **Tabler Icons** (`@tabler/icons-react` o clases `ti ti-*` del template) — set principal de iconos.
- **dayjs** — parseo/format de fechas.

### Secundario · usar solo si ya existe en el archivo

- **PrimeReact** — componentes legacy (algunos diálogos del template). **No introducirlo en componentes nuevos.**
- **React Feather** / **FontAwesome** — iconos del template, evitar en código nuevo (preferir Tabler).
- **Apex Charts** / **Chart.js** — gráficos; elegir el que ya esté en el módulo, no mezclar dentro de un mismo archivo.
- **FullCalendar** — solo para la vista de calendario del template.
- **@hello-pangea/dnd** — drag & drop (Kanban del Sprint 3 usará esta librería).

### Prohibido introducir en código nuevo

- **shadcn/ui**, **Tailwind CSS**, **Radix primitives** — aunque el código parezca pedirlos. Romperíamos la coherencia visual con todo el template.
- **Material UI (MUI)**, **Chakra UI**, **Mantine** — stacks paralelos incompatibles.
- **styled-components**, **emotion** — la estrategia es SCSS scoped, no CSS-in-JS.

---

## 2 · Lo que NO hacemos

Reglas duras. Cada una tiene una razón concreta; preguntar antes de romperlas.

- **NO agregar React Query ni SWR** aunque el código parezca pedirlo. El repo usa `fetch` nativo con `credentials: "include"` y polling manual con `setInterval`. La consistencia vale más que el patrón "correcto".
- **NO introducir Tailwind para UI nueva** aunque sea tentador. Usar SCSS scoped + clases de Bootstrap.
- **NO usar librerías de forms** (React Hook Form, Formik, Zod para validación de UI). Estado manual + validación en submit. Si hace falta mucha validación, referenciarlo antes en un issue.
- **NO mezclar `<a href>` con `<Link>`** para navegación interna. Siempre `next/link` (`import Link from "next/link"`).
- **NO hardcodear rutas internas como strings**. Usar `all_routes` (`import { all_routes as route } from "@/data/all_routes"`).
- **NO commitear `console.log` de debug.** Un `console.error` en un `catch` está bien.
- **NO agregar dependencias nuevas sin consultar**. Si aparece la necesidad, documentar el caso y preguntar.
- **NO usar `ignoreBuildErrors: true` como excusa** para PRs con errores TS en código nuevo. Correr `npm run tsc:ventas` antes de commitear (ver §5).

---

## 3 · Patrones de fetching y estado

### 3.1 · Fetching básico

```tsx
// hook o componente cliente
useEffect(() => {
  let cancelled = false;
  fetch(`/api/…`, { credentials: "include", cache: "no-store" })
    .then(r => r.json())
    .then((data: ApiResponse) => {
      if (!cancelled) setState(data);
    })
    .catch(() => { /* notification.error(...) */ });
  return () => { cancelled = true; };
}, [deps]);
```

- Siempre `credentials: "include"` en calls al BFF (`/api/**`) — el backend valida sesión vía cookie HttpOnly.
- `cache: "no-store"` en data que cambia (counts, mensajes, órdenes).
- Guard `cancelled` para evitar setState en unmount.

### 3.2 · Polling

- **Mensajes de chat:** 5 s vía `useChatMessages`.
- **Counts/sidebar badges:** 30-60 s vía hook dedicado.
- **Page Visibility:** pausar polling cuando `document.hidden === true` para ahorrar requests en tabs inactivas.

### 3.3 · Estado global

- **Redux Toolkit** para sesión + menú. No agregar slices nuevos sin justificación (auth, menu UI están resueltos).
- **useState / useReducer** para estado local de página/componente.
- **No usar Redux** para estado de fetching (cache de listados, etc.). Eso vive en hooks + state local.

---

## 4 · Patrón BFF (`src/app/api/**`)

Los route handlers de Next actúan como proxy al backend Node + PostgreSQL:

```ts
// src/app/api/<modulo>/<recurso>/route.ts
import type { NextRequest } from "next/server";
import { nextJsonFromUpstream, proxyJsonToReceiver } from "@/lib/webhookReceiverProxyFetch";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const up = await proxyJsonToReceiver(`/api/<modulo>/<recurso>`);
  return nextJsonFromUpstream(up);
}
```

- **`runtime = "nodejs"`** siempre que el handler use `undici` o el proxy (no `edge`).
- **`params: Promise<{ … }>`** en Next 15 — destructurar con `await ctx.params`.
- No embeber lógica de negocio en el BFF — el backend manda. El BFF solo proxya, normaliza errores y mantiene cookies.

---

## 5 · TypeScript estricto scoped

Ver también el README del repo.

- `tsconfig.json` global: `strict: true`, pero `next.config.ts` tiene `ignoreBuildErrors: true` por deuda del template.
- `tsconfig.ventas.json`: tsconfig scoped al módulo ventas + bandeja + sus APIs y tipos. Con `strict: true` + `noUnusedLocals` + `noUnusedParameters`.
- Comando: `npm run tsc:ventas` — debe pasar **limpio** en cualquier PR que toque ese scope.
- Si al tocar código nuevo aparece un error TS preexistente (ej. en un hook heredado), se arregla en el mismo PR.

---

## 6 · Consumo de `chat_stage` y otros enums del backend

**Regla de oro:** los valores de enums que provee el backend se consumen **tal como llegan**. No se derivan localmente, no se renombran, no se remapean "por claridad".

### 6.1 · Por qué

La trampa clásica es tener dos fuentes de verdad (el famoso caso `productos` vs `products`). Cada vez que un enum se deriva en dos lugares, las dos lógicas divergen en meses.

### 6.2 · Ejemplo canónico: `chat_stage` (BE-1.9)

- **Campo del backend:** `chat_stage` en `GET /api/inbox` (heredado por `/api/bandeja`).
- **Enum (8 valores):** `contact | ml_answer | quote | approved | order | payment | dispatch | closed`.
- **Tipos canónicos:** `src/types/inbox.ts` (`ChatStage`, `CHAT_STAGE_LABELS`, `CHAT_STAGE_ORDER`).
- **Sí:** `const stage = chat.chat_stage; if (stage) { …CHAT_STAGE_LABELS[stage]… }`.
- **No:** derivar la etapa en frontend a partir de `order.payment_status` / `source_type`.
- **No:** renombrar a `lifecycle_stage` en tipos/props/params (colisiona con el `lifecycle_stage` que backend usa en `salesService.js` para feedback ML post-venta — son campos distintos con el mismo nombre).

### 6.3 · Regla general para cualquier enum del backend

1. **Un único lugar para el tipo y las constantes asociadas** — típicamente `src/types/<dominio>.ts`.
2. **Record exhaustivo** para labels y colores: `Record<EnumType, string>` — TypeScript avisa si falta un valor.
3. **`CHAT_STAGE_ORDER` o equivalente** cuando exista semántica de orden (pipelines, estados). Evita repetir el orden en cada componente.
4. **Si un valor nuevo aparece en backend**, agregarlo a los 3 lugares (tipo, labels, order) en un único commit.
5. **No mapear a otro nombre** sin razón fuerte. Si es imprescindible (ej. etiqueta i18n), el nombre original queda como key del Record.

---

## 7 · Convenciones de Sidebar

- Definir rutas en `src/data/all_routes.tsx` con comentario JSDoc si la ruta tiene contrato especial (endpoint, query string, deprecación).
- Agregar ítems al sidebar en `src/core/json/siderbar_data.tsx`, respetando el grupo (`submenuHdr`) correcto.
- Iconos: usar clase del set Tabler (`icon: "layout-kanban"`, `icon: "truck"`, etc.) — la lista está en [tabler-icons.io](https://tabler-icons.io).
- Rutas `@deprecated` en `all_routes.tsx`: mantener el string pero marcar con JSDoc `@deprecated` y documentar el reemplazo. No borrar hasta confirmar 0 consumidores.

---

## 8 · Commits y PRs

- **Una feature = un commit** (o un PR pequeño). Evitar commits con 5 features mezcladas.
- Mensajes tipo **Conventional Commits**: `feat(bandeja): …`, `fix(types): …`, `chore(tsconfig): …`, `docs(frontend): …`.
- Commits que tocan `/ventas/**` o `/bandeja/**` deben pasar `npm run tsc:ventas` antes de mergear.
- Si un hotfix rompe alguna convención de este documento, dejar comentario `// TODO(FE-X.Y): …` y abrir issue, no dejar pasar silenciosamente.

---

## 9 · Referencias

- Auditoría inbox/bandeja: [`INBOX_BANDEJA_AUDIT.md`](./INBOX_BANDEJA_AUDIT.md)
- Tipos canónicos del dominio bandeja: `src/types/inbox.ts`
- Tema visual bandeja (variables CSS): `src/app/(features)/bandeja/bandeja-theme.scss`
- Tsconfig scoped: `tsconfig.ventas.json`
