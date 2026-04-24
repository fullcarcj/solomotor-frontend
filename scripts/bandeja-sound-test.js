#!/usr/bin/env node
/* eslint-disable no-console */
const port = process.env.PORT || 3000;
console.log(`
────────────────────────────────────────
  Prueba de sonido — bandeja (frontend)
────────────────────────────────────────

  1) En otra terminal, con el frontend levantado:
       npm run dev

  2) Iniciá sesión en el ERP (rutas bajo /dashboard requieren cookie).

  3) Abrí en el navegador:
       http://localhost:${port}/dev/bandeja-sonido

  4) Hacé clic en «Reproducir sonido mensaje nuevo».

  Si no se oye: volumen del sistema, pestaña sin silenciar, y probá otro navegador.
────────────────────────────────────────
`);
