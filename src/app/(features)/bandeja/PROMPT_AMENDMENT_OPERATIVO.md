# AMENDMENT (revisión) — Panel operativo: color sin romper estructura

**Precedencia:** la **estructura operativa** (3 columnas, `ChatContextPanel`, `ChatActionSlideOver`, flujos y JSX internos) **no se modifica**. Solo se permite **cromática del contenedor** que envuelve el panel derecho.

---

## Zonas

| Zona | Rediseño WA (verde/gris chat) | Panel operativo (derecha) |
|------|-------------------------------|---------------------------|
| Lista + chat | Sí (`--wa-*`) | — |
| Wrapper `bandeja-detail-context` | — | **Sí: solo variables `--op-*`** en el shell |
| Interior de `ChatContextPanel` / slide-over | — | **No tocar** (cards, formularios, lógica) |

---

## Variables — panel operativo (scope `.bandeja-shell`, no `:root`)

Definir junto a `--wa-*`:

```scss
.bandeja-shell {
  /* ... --wa-* existentes ... */

  /* Superficie “herramientas / CRM” — distinta del hilo WA, sin invadir componentes hijos */
  --op-bg-surface:     #151f27;   /* más frío que --wa-bg-secondary */
  --op-border:         #243038;
  --op-scrollbar:      #2a3942;
}
```

**Uso permitido:** únicamente en selectores de **contenedor**:

```scss
.bandeja-shell--detail .bandeja-detail-context {
  background: var(--op-bg-surface);
  border-left: 1px solid var(--op-border);
  /* opcional: color de scrollbar */
}
```

**Prohibido:** `color:`, `background:` o `--wa-*` / `--op-*` sobre hijos directos de `ChatContextPanel`, ni sobrescribir clases Bootstrap dentro de ese componente desde el tema de bandeja.

---

## Fin del bloque operativo

La jerarquía visual queda: **lista (WA) | conversación (WA) | columna operativa (tono CRM `--op-*`, ancho fijo, scroll propio)**. Si un card interno sigue claro por diseño legacy, **no forzar** oscurecimiento desde el prompt: prevalece **estructura y comportamiento** del panel operativo.
