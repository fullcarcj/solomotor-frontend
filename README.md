This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Convenciones del proyecto

### TypeScript estricto en código nuevo (scoped)

El build global del repo tiene `ignoreBuildErrors: true` (`next.config.ts`) por deuda
heredada del template Dreams POS. El código nuevo del **módulo ventas + bandeja**
corre con TS estricto en un tsconfig propio:

```bash
npm run tsc:ventas
```

Ejecutar **antes de cada commit** que toque:

- `src/app/(features)/ventas/**`
- `src/app/(features)/bandeja/**`
- `src/app/api/ventas/**`, `src/app/api/bandeja/**`, `src/app/api/inbox/**`
- `src/types/inbox.ts`, `src/types/sales.ts`, `src/types/customers.ts`
- `src/hooks/use{Chat,Inbox,Sales}*.ts`

Si aparecen errores nuevos, arreglarlos en el mismo PR. Usar `@ts-ignore`
solo con comentario explicando la razón y un issue de seguimiento.

Ver también [`docs/frontend/UI_CONVENTIONS.md`](./docs/frontend/UI_CONVENTIONS.md)
para convenciones de UI (librerías, formularios, alertas, enums del backend).
