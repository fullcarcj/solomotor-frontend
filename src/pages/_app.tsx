import type { AppProps } from "next/app";

/**
 * Requerido si existe `pages/_document` en proyectos híbridos App + Pages.
 * Las rutas reales viven en `src/app`; aquí no se montan layouts de negocio.
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
