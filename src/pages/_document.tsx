import { Head, Html, Main, NextScript } from "next/document";

/**
 * Stub mínimo del Pages Router: el proyecto usa App Router (`src/app`).
 * Sin este archivo, `next build` puede fallar con PageNotFoundError `/_document`.
 */
export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
