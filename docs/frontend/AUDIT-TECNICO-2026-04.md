# Auditoría técnica frontend · 2026-04-18

**Ejecutada por:** Cursor (modo auditoría, cero cambios de código)
**Scope:** repo `c:\Users\Javier\frontend` — Next.js 15.5 + App Router
**Metodología:** análisis estático, conteo de archivos, lectura de código, búsquedas por patrón. Sin depcheck ni ts-unused-exports (no instalados).

---

## Resumen ejecutivo

El repo arrancó desde el template comercial **Dreams POS** (DreamsTechnologies) y fue extendido con módulos de negocio propios. La deuda más relevante está concentrada en 3 áreas: **300 páginas demo del template** que nunca se usan (build más lento, superficie de confusión), **2 versiones paralelas del módulo inbox** (`src/components/inbox/` legacy vs `src/app/(features)/bandeja/` activo) con tipos duplicados y `LifecycleStage` vs `ChatStage` conviviendo, y **42 errores TypeScript ignorados** que son mayoritariamente triviales (null checks, params de Next 15).

Estimación total de resolución: **~25-35h** de trabajo limpio. Ningún hallazgo requiere rewrite masivo.

---

## Hallazgos críticos (resolver en próximo sprint disponible)

### C1 · Módulo `/inbox` legacy vivo con tipos duplicados

**Área:** Deuda técnica activa con riesgo real de confusión.

**Evidencia:**
- `src/components/inbox/inboxTypes.ts` define `LifecycleStage` con 7 valores (incluyendo el nombre que colisiona con `lifecycle_stage` de `salesService.js`), `InboxChat` con `lifecycle_stage` como campo, y todo el stack de tipos que corresponde a `src/types/inbox.ts`.
- `src/components/inbox/InboxPage.tsx` sigue vivo y siendo importado desde `src/app/(features)/(inbox)/inbox/page.tsx`.
- `src/components/inbox/LifecyclePanel.tsx` e `inboxMockData.ts` también siguen activos.
- El campo canónico se llama `chat_stage` (8 valores, BE-1.9), pero `inboxTypes.ts` sigue exponiendo `lifecycle_stage: LifecycleStage` con solo 7 valores.
- Cualquier componente que importe desde `inboxTypes.ts` en lugar de `types/inbox.ts` estará trabajando con el tipo incorrecto y el nombre deprecado.

**Tipos duplicados concretos:**

| Tipo | `src/types/inbox.ts` | `src/components/inbox/inboxTypes.ts` |
|---|---|---|
| `InboxChat` | ✅ canónico con `chat_stage?: ChatStage` | ⚠️ duplicado con `lifecycle_stage: LifecycleStage` |
| `InboxMessage` | ✅ | ✅ (idéntico) |
| `InboxViewFilter` | ✅ | ✅ (idéntico) |
| `InboxSrcFilter` | ✅ | ✅ (idéntico) |
| `InboxCounts` | ✅ | ✅ (idéntico) |
| `LifecycleStage` | ❌ no existe (fue reemplazado por `ChatStage`) | ⚠️ existe con 7 valores incorrectos |
| `ChatStage` | ✅ 8 valores canónicos | ❌ no existe |

**Riesgo:** Cualquier import accidental desde `inboxTypes.ts` en código nuevo pasa desapercibido porque TypeScript no avisa (tipos similares), pero los valores de etapa serán incorrectos en producción.

**Impacto:** Alto (riesgo de regresión silenciosa al implementar Sprint 2+)
**Estimación cleanup:** 3-4h
- Migrar `InboxPage.tsx` y `LifecyclePanel.tsx` a importar desde `@/types/inbox.ts`
- Reemplazar `lifecycle_stage` → `chat_stage` en `InboxPage.tsx`
- Deprecar `inboxTypes.ts` con re-export hacia `@/types/inbox.ts` como puente temporal
- Eliminar `inboxMockData.ts` (datos hardcodeados sin uso real)
- Eliminar `src/app/(features)/(inbox)/inbox/page.tsx` y `history/page.tsx` una vez migrado (ya tienen redirect 308)

**Prioridad:** ALTA — antes de implementar cualquier feature que toque la bandeja en Sprint 2.

---

### C2 · `src/app/api/inbox/**` y `src/app/api/bandeja/**` conviviendo con duplicación parcial

**Área:** BFF — endpoints paralelos para el mismo recurso.

**Evidencia:**
- `api/inbox/route.ts` y `api/bandeja/route.ts` probablemente sirven el mismo endpoint del backend.
- `api/inbox/counts/route.ts` y `api/bandeja/counts/route.ts` ídem.
- `api/crm/chats/[chatId]/messages/route.ts` existe pero los componentes activos consumen `api/bandeja/[chatId]/messages/route.ts`.
- Los componentes del módulo activo (`bandeja/`) mezclan: algunos llaman `/api/bandeja/**`, otros siguen apuntando a `/api/inbox/**`.

**Riesgo:** Confusión sobre cuál endpoint es el canónico. Si el backend hace algún cambio de contrato, hay que actualizar en 2 lugares.

**Estimación cleanup:** 2-3h
- Auditar qué componentes consumen `/api/inbox/**` vs `/api/bandeja/**`
- Decidir cuál es canónico (probablemente `bandeja`) y redirigir o consolidar
- Eliminar `/api/crm/chats/**` si no hay ningún consumidor activo

**Prioridad:** ALTA — resolver antes del Sprint 2 para no escalar la confusión.

---

### C3 · 42 errores TypeScript ignorados — clasificación

**Área:** TypeScript / deuda técnica build.

**Total:** 42 errores con `tsc --noEmit` global (sin `ignoreBuildErrors`).

**Distribución por tipo:**

| Código TS | Descripción | Cantidad estimada | Dificultad |
|---|---|---|---|
| `TS2344` | Route handlers con `params` no tipados para Next 15 | ~12 (`.next/types/validator.ts`) | Trivial: añadir `params: Promise<{…}>` |
| `TS18047` | `params` / `searchParams` / `pathname` possibly null | ~15 | Trivial: null guard o `!` operator |
| `TS2345` | `string \| null` no asignable a `string` | ~8 | Trivial: `?? ""` |
| `TS2322` | `{}` no asignable a `string \| number` | ~4 | Trivial: tipado explícito o cast |
| `TS2352` | Cast `Record<string,unknown>` a tipo concreto | ~3 | Medio: refactor normalizer |

**Archivos clave con errores:**
- `.next/types/validator.ts` — 12 errores de Next 15 route typing (no tocar directamente; arreglar en los handlers)
- ~~`src/components/inbox/InboxPage.tsx`~~ — eliminado con cierre de C1 (ya no aplica)
- `src/core/common/header/header.tsx` — 4 errores (`pathname` null, `string | null`)
- `src/core/common/sidebar/sidebar.tsx` — 1 error
- `src/components/settings/settingssidebar/index.tsx` — 6 errores (`string | null`)
- Páginas de features (`edit-product`, `clientes/historial`, `bandeja`) — ~8 errores `TS18047`

**Estimación para llegar a 0 errores y habilitar `ignoreBuildErrors: false`:** 6-8h
- La mayoría son triviales (null guard, cast explícito)
- Los más complejos son los 3 errores `TS2352` en `clientes/historial` y `config/CompanyForm`

**Prioridad:** MEDIA — resolver en 1-2 sprints de limpieza, módulo por módulo.

---

## Hallazgos importantes (resolver en los próximos 2-3 sprints)

### I1 · 300 páginas demo del template (de 335 totales)

**Área:** Deuda del template DreamPOS.

| Categoría | Cantidad |
|---|---|
| Páginas funcionales en `src/app/(features)/` | 35 |
| Páginas demo del template fuera de `(features)/` | 300 |
| **Total** | **335** |

Las 300 páginas incluyen: demos de UI (alertas, tablas, modales), páginas de auth duplicadas (signin-2, signin-3, register, register-2, etc.), POS demos (pos-2, pos-3, pos-4, pos-5), páginas de error, pricing, coming-soon, etc.

**Impacto:**
- Build más lento (cada página es un módulo webpack)
- Confusión para nuevos desarrolladores
- 1252 archivos en `public/` con **161 MB de assets** (svgs, pngs, jpgs del template que nunca se muestran en las vistas reales)

**Riesgo de borrar:** Bajo para las páginas demo. Medio para assets (algunas imágenes pueden estar referenciadas desde SCSS).

**Estimación cleanup:** 6-8h (borrar carpetas + verificar referencias en SCSS + verificar que build no se rompe)

**Prioridad:** Media — impacta developer experience pero no funcionalidad.

---

### I2 · Fetching: buena cobertura de `credentials: include` pero sin Page Visibility

**Área:** Patrones de fetching.

**Lo bueno:**
- **85+ archivos** usan `credentials: "include"` — cobertura casi total y consistente.
- **No hay uso de lodash** — cero imports de librerías de utilidades pesadas.
- **No hay React Query ni SWR** — consistente con las convenciones.
- La mayoría de los hooks (`useChatMessages`, `useDispatch`, `useDashboard`) usan `setInterval` correctamente con `clearInterval` en cleanup.

**Gap detectado: Page Visibility ausente**
- **0 archivos** implementan `document.hidden` o `visibilitychange`.
- Los 4+ componentes con polling activo (`useChatMessages` 5s, `useDashboard`, `InboxCountBadges`, `useDispatch`) siguen llamando al backend aunque el tab esté en segundo plano.
- Estimado: 3-4 requests/min innecesarios por tab inactivo.

**Gap: cleanup de fetch en unmount inconsistente**
- ~19 componentes implementan guard de cancelación (`cancelled = true` o cleanup en `useEffect`)
- ~65+ componentes hacen fetch sin guardia de cancelación (risk de setState en componente desmontado)

**Estimación fixes:**
- Page Visibility: 2-3h (crear `usePageVisibility` hook, wrapear los 4 intervalos existentes)
- Guards de unmount: 4-6h (los más críticos son los 10+ componentes con polling)

**Prioridad:** Media.

---

### I3 · Tipos duplicados en `src/types/ventas.ts` vs `src/types/sales.ts`

**Área:** Tipos duplicados.

**Evidencia:**
- `src/types/ventas.ts` (556 bytes) y `src/types/sales.ts` (1042 bytes) — nombres similares para el mismo dominio.
- `src/types/quotations.ts` define tipos de cotizaciones que parcialmente también están en `src/types/inbox.ts` (contexto de cotizaciones de bandeja).

**Inventario de archivos de tipos:**

| Archivo | Tamaño | Estado |
|---|---|---|
| `inbox.ts` | 3.2KB | ✅ Canónico, bien organizado |
| `sales.ts` | 1KB | ⚠️ Nombre ambiguo vs `ventas.ts` |
| `ventas.ts` | 556B | ⚠️ Muy pequeño, posible subconjunto de `sales.ts` |
| `customers.ts` | 2.1KB | ✅ Canónico |
| `quotations.ts` | 1.5KB | ✅ Separado, razonable |
| `finanzas.ts` | 2.3KB | ✅ Razonable |
| `mercadolibre.ts` | 2.4KB | ✅ |
| `reportes.ts` | 2.4KB | ✅ |
| `compras.ts` | 2.2KB | ✅ |
| `pos.ts` | 1.3KB | ✅ (duplicate `customer_id` ya corregido en FE-1.5.5) |
| `wms.ts` | 1.7KB | ✅ |
| `dedup.ts` | 1.7KB | ✅ |
| `dispatch.ts` | 1.1KB | ✅ |
| `leavetypes.tsx` | 0B | ⚠️ **Archivo vacío** |
| `inboxTypes.ts` | 0B | ⚠️ **Archivo vacío** (el contenido está en `components/inbox/`) |
| `bootstrap.d.ts` | 207B | ✅ Declaración mínima |

**Estimación:** 1-2h para fusionar `ventas.ts` en `sales.ts` y eliminar vacíos.

---

### I4 · `src/app/(features)/(inbox)/inbox/` — rutas legacy sin deprecar del lado App Router

**Área:** Rutas del template + deuda de migración.

**Evidencia:**
- `src/app/(features)/(inbox)/inbox/page.tsx` — importa `InboxPage` (monolito legacy). Con el redirect 308 ya en `next.config.ts`, esta página sigue existiendo pero no debería ser accesible en producción.
- `src/app/(features)/(inbox)/inbox/history/page.tsx` — ídem.
- Estas páginas siguen compilándose, aumentando el tiempo de build innecesariamente.

**Estimación:** 0.5h — eliminar las dos carpetas + verificar que el redirect funciona sin la página de destino.

**Prioridad:** Baja-Media (no bloquea nada, pero es ruido en el build).

---

### I5 · 3 `<img>` sin `next/image` en features activos

**Área:** Performance / optimización de imágenes.

**Evidencia:**
- `src/app/(features)/finanzas/components/ComprobanteDetailModal.tsx` — 1 `<img>`
- `src/app/(features)/bandeja/components/MessageBubble.tsx` — 1 `<img>` (imágenes de mensaje)
- `src/app/(features)/config/components/CompanyForm.tsx` — 1 `<img>` (logo empresa)

El template completo no usa `next/image` (confirmado: 0 imports en features). En los casos de imágenes dinámicas de usuario (logos, fotos de comprobante) usar `<img>` es aceptable. Los 3 casos parecen justificados. Documentar como deuda consciente.

**Estimación:** Verificar caso a caso si migrar a `<Image>` aporta algo. Probable: 0.5h.

---

## Hallazgos menores (backlog)

### M1 · Redux: 2 slices, bien delimitados, sin actions sin usar

El store es mínimo y limpio: `authSlice` (sesión + restore) y `menuSlice` (menú dinámico del backend). No hay slices sin uso, no hay state redundante. **No hay deuda Redux relevante.** Mantenimiento: 0h.

---

### M2 · SCSS: 78 archivos, 75 del template, 3 propios

El template trae 75 archivos SCSS en `src/style/scss/**`. Los 3 propios son:
- `src/app/global.scss` — imports del template
- `src/app/(features)/bandeja/bandeja-theme.scss` — ✅ bien scoped
- `src/app/(features)/ventas/tablero/tablero.scss` — ✅ bien scoped

**Tailwind: 0 instancias** en código nuevo. Convención respetada.

Los archivos SCSS del template (HRM, stocks, barcode, etc.) corresponden a módulos demo que se borrarían con I1. No hay acción separada necesaria.

**Inline styles:** 93 instancias de `style={{` en código de features activos. La mayoría son casos válidos (dimensiones dinámicas en componentes de gráficos, estilos condicionales). Los más llamativos son los ~22 en `ChatContextPanel.tsx` — candidato a refactor SCSS en Sprint futuro.

---

### M3 · `src/app/api/ml/**` — directorio sin rutas conocidas

**Evidencia:** Git status del inicio de sesión muestra `?? src/app/api/ml/` como untracked. No está en el BFF contado. Verificar qué contiene y si es un trabajo en progreso o un directorio abandonado.

**Estimación:** 0.25h — revisar y decidir commitear o borrar.

---

### M4 · `src/pages/` — directorio Pages Router sin uso aparente

**Evidencia:** Git status muestra `?? src/pages/`. Next.js 15 App Router no usa `src/pages/`. Podría ser un error de estructura o un módulo experimental.

**Estimación:** 0.25h — revisar contenido y eliminar si es innecesario.

---

### M5 · `parseReportData.ts` con 3 errores TS `{}` → `string | number`

Ya identificado en FE-1.5.5 scope. No se corrigió porque está fuera del scope de `tsconfig.ventas.json`. Trivial (mismo fix que `useTodayRate.ts`).

**Estimación:** 0.5h.

---

### M6 · No hay React.memo ni memoización en componentes de features

**Evidencia:** 0 usos de `React.memo` en `src/app/(features)`. Tampoco `useMemo` ni `useCallback` salvo en los hooks propios.

**Contexto:** La mayoría de las páginas son server-rendered o tienen árbol de componentes plano. El módulo `/bandeja` es el candidato más obvio a memoización (lista de chats que se refresca cada 5s). Pero sin profiling real, no hay certeza de que sea un problema.

**Recomendación:** Profiling antes de actuar. No priorizar sin evidencia de re-renders reales.

---

## Métricas

| Métrica | Estado actual | Estado objetivo tras cleanup |
|---|---|---|
| Archivos `page.tsx` totales | 335 | ~60 (borrar demos template) |
| Páginas en `(features)/` (código propio) | 35 | ~45 (crecerá con Sprints 2-6) |
| Errores TypeScript globales | 42 | 0 |
| Archivos en `public/` | 1252 | ~100 (borrar assets template) |
| Peso de `public/` | 161 MB | ~5 MB |
| Slices Redux | 2 | 2 (correcto) |
| Archivos SCSS propios | 3 | ~10 (crecerá con módulos nuevos) |
| Endpoints BFF (`src/app/api/`) | 134 | ~120 (consolidar inbox/bandeja, eliminar crm/chats huérfano) |
| Archivos de tipos en `src/types/` | 19 | ~17 (fusionar ventas+sales, eliminar vacíos) |
| Módulos inbox paralelos | 2 (`components/inbox/` + `bandeja/`) | 1 (deprecar legacy) |

---

## Roadmap de cleanup sugerido

### Sprint de limpieza A (1-2 días, prioridad alta, hacer antes de Sprint 2 FE)

1. **C1** — Migrar `InboxPage.tsx` y `LifecyclePanel.tsx` a tipos canónicos. Eliminar `inboxMockData.ts`. Deprecar `inboxTypes.ts` como re-export temporal. (3-4h)
2. **C2** — Auditar y consolidar endpoints `/api/inbox/**` vs `/api/bandeja/**`. Decidir cuál es canónico. Eliminar `/api/crm/chats/**` si huérfano. (2-3h)
3. **I4** — Eliminar carpetas `src/app/(features)/(inbox)/inbox/` y `/history` (ya tienen redirect 308). (0.5h)
4. **M3 + M4** — Revisar `src/app/api/ml/` y `src/pages/` sin commitear. Commitear o borrar. (0.5h)

**Total Sprint A:** ~7h

---

### Sprint de limpieza B (2-3 días, después de Sprint 2 FE)

1. **C3** — Arreglar los 42 errores TS y habilitar `ignoreBuildErrors: false`. Módulo por módulo (header → sidebar → features pages → handlers Next 15). (6-8h)
2. **I2** — Agregar `usePageVisibility` y wrappear los 4 intervalos de polling. (2-3h)
3. **I3** — Fusionar `ventas.ts` en `sales.ts`. Eliminar archivos vacíos. (1-2h)
4. **M5** — Fix `parseReportData.ts` 3 errores TS. (0.5h)

**Total Sprint B:** ~10-14h

---

### Sprint de limpieza C (1 semana, coordinar con BE)

1. **I1** — Borrar 300 páginas demo del template y 1200+ assets de `public/`. (6-8h)
2. Verificar que no hay links rotos en el sidebar ni referencias SCSS rotas. (2h)
3. Actualizar `siderbar_data.tsx` para eliminar entradas huérfanas que apuntan a las demos borradas. (1h)

**Total Sprint C:** ~9-11h

---

## Lo que NO hay que tocar

- **Redux (2 slices):** Limpio y bien delimitado. No agregar slices, no mover a Context.
- **`src/style/scss/` del template:** Tocar solo cuando se borren las páginas demo correspondientes (Sprint C). Cambios aislados causan más daño que beneficio.
- **`src/app/api/**` endpoints de módulos activos:** No consolidar ni refactorizar BFF de módulos funcionales (finanzas, ML, inventario, compras) sin coordinación con backend.
- **`tsconfig.json` global:** No modificar. El scope scoped con `tsconfig.ventas.json` es la estrategia correcta. El global se toca solo cuando se apague `ignoreBuildErrors`.
- **`src/components/inbox/` (eliminado en 2026-04):** La carpeta y el monolito `InboxPage` ya no existen; la UI canónica es `/bandeja`. Ver sección «Estado de hallazgos» al final.
- **Inline styles del template:** Los ~93 casos son mayoritariamente legítimos. No iniciar un cleanup masivo de inline styles sin prioridad clara.

---

## Bugs detectados durante la auditoría

Ningún bug de producción encontrado. Los errores TS son deuda de tipos, no bugs funcionales. El único riesgo real es **C1** (tipos duplicados con nombre incorrecto) que podría manifestarse como comportamiento silenciosamente incorrecto si alguien importa desde `inboxTypes.ts` en Sprint 2+.

---

*Documento generado el 2026-04-18. Revisitar al cierre del Sprint 3 para actualizar métricas.*

---

## Estado de hallazgos · actualizado 2026-04-18

### C1 · RESUELTO

- **Acción:** eliminación física de `src/components/inbox/` (4 archivos: `InboxPage.tsx`, `LifecyclePanel.tsx`, `inboxTypes.ts`, `inboxMockData.ts`) y sustitución de `src/app/(features)/(inbox)/inbox/page.tsx` por `redirect("/bandeja")` para eliminar el único importador activo.
- **Commit:** `bf7cbe9309909a222dc3142fa5449e9e6b9f0471` — `chore(inbox-cleanup): eliminar src/components/inbox/ viejo (hallazgo C1 audit 2026-04-18)`.
- **Verificación:** `npm run tsc:ventas` exit 0, `npm run build` OK, sin `LifecycleStage` / `lifecycle_stage` en código aplicativo (solo comentario canónico en `src/types/inbox.ts`).
- **Deuda residual:** ninguna respecto a C1.

### C2 · Pendiente

- Sin cambios: `/api/inbox/**` y `/api/bandeja/**` siguen coexistiendo.
- Decisión diferida según plan original del audit.

### C3 · Pendiente

- Sin cambios: errores TypeScript globales siguen ignorados en build; `tsc:ventas` scoped pasa exit 0 para el módulo ventas/bandeja.
