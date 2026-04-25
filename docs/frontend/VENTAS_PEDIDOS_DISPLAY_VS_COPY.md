# Ventas · Pedidos — Texto mostrado vs texto copiado

Documento operativo: **solo constatación y comprobación**, sin asumir causa única en producción.

## Fenómeno reportado

En **Órdenes omnicanal** (`/ventas/pedidos`), para la misma venta (ej. `#so-1253`):

1. **Lo que se ve** en el resumen de la columna *Orden* (vista compacta / panel lateral): a veces aparece un identificador ML **partido en dos líneas** y con dígitos que **no coinciden** con la referencia esperada `ml_user_id-order_id` (ej. capturas con `1335928698-` / `2888816139188458` frente a `1335920698-2000016139180450`).
2. **Lo que se copia** al seleccionar o copiar desde otro sitio (p. ej. búsqueda, notas del detalle, o el mismo bloque según selección) puede **coincidir con la referencia correcta** o con otra fuente, según **de qué nodo del DOM** se copia.

La frase operativa es: **una cosa es lo que muestra la pantalla y otra lo que termina en el portapapeles**, porque no son el mismo acto (renderizado visual vs. `user-select` / rango seleccionado).

## Hechos verificados en código (frontend)

- El resumen de fila pinta **tal cual** la propiedad `sale.external_order_id` devuelta por `GET /api/ventas/pedidos` → upstream `GET /api/sales` (ver `OrdTable.tsx`, bloque `.ord-ext`).
- Ese texto se muestra con **fuente monoespaciada** y **`letter-spacing` positivo** (ver `pedidos-theme.scss`, clase `.ord-ext`). Eso puede afectar la **legibilidad** (confusión 0/8, lectura en diagonal) sin cambiar el string lógico del DOM.
- En layouts **estrechos**, el mismo string puede **partirse en varias líneas** (`word-break` / ancho del contenedor). Visualmente puede parecer “dos números” aunque en el DOM siga siendo una cadena continua hasta que el usuario selecciona solo una línea.

## Hechos verificados en datos (backend / BD)

- El detalle y el listado leen **`sales_orders.external_order_id`** para esa referencia en la API de ventas.
- El campo **Notas** del detalle suele contener la traza de importación:  
  `Import ml_orders ml_user_id=… order_id=…`  
  Esas dos cifras, concatenadas como `ml_user_id-order_id`, deben ser la referencia canónica **al momento del import**; si la columna `external_order_id` y las notas difieren, hay **inconsistencia persistida** en BD o actualización parcial.

## Cómo comprobar sin adivinar

1. **Red (DevTools)** — Respuesta JSON de `GET /api/sales` para la fila `so-1253`: valor exacto de `external_order_id` (caracteres, no captura de pantalla).
2. **Copiar desde la fila** — Seleccionar solo la línea del ID bajo “ML” y pegar en un editor en texto plano; comparar carácter a carácter con el JSON del paso 1.
3. **Copiar desde Notas** — Pegar el fragmento `ml_user_id=… order_id=…` y reconstruir `ml_user_id-order_id`.
4. **SQL** (solo lectura) — `SELECT id, external_order_id, notes FROM sales_orders WHERE id = …` y comparar columnas.

## Qué deja documentado este archivo

- Que el **síntoma** “muestra ≠ copia / ≠ notas” puede mezclar: **render + selección + fuente de copia**.
- Que la **fuente de verdad** para auditar es **JSON de red** o **columnas en BD**, no solo la captura de pantalla.
- Que cualquier **corrección de producto** (mostrar `external_order_id` en el modal, endurecer tipografía, revisar import de ítems, etc.) queda **fuera del alcance** de este documento.

### Comprobación post-reparación (BD)

Tras `npm run db:sales-ml-external-repair-notes`, un `SELECT id, external_order_id, notes FROM sales_orders WHERE id = 1253` puede mostrar ya el canónico `1335920698-2000016139180450` alineado con las notas. Si la captura de pantalla **sigue** viendo “8” donde en BD hay “0”, el dato en API/JSON es correcto: revisar **legibilidad del tema** (`.ord-ext` en `pedidos-theme.scss`: tamaño y `letter-spacing`).

*Última actualización: 2026-04-25 — pedido explícito “documenta solamente”; 2026-04-25 nota UI vs BD.*
