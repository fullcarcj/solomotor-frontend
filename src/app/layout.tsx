import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./global.scss";
import "../style/css/feather.css";
import "../style/css/line-awesome.min.css";
import "../style/icons/tabler-icons/webfont/tabler-icons.css";
import "../style/icons/fontawesome/css/fontawesome.min.css";
import "../style/icons/fontawesome/css/all.min.css";
import "../style/fonts/feather/css/iconfont.css";
import AntdReact19Patch from "../components/AntdReact19Patch";
import BootstrapJs from "../components/bootstrap-js/bootstrapjs";
import { Providers } from "@/components/Providers";
import type { Viewport } from "next";

/** Barra de estado / tema en móvil (Chrome + Safari modernos). */
export const viewport: Viewport = {
  themeColor: "#0e0f0c",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Solomotorx · Ventas",
  description: "Gestión de ventas, bandeja omnicanal y tablero de supervisión",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Solomotorx",
  },
  icons: {
    icon: "favicon.png",
    shortcut: "favicon.png",
    apple: "favicon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/*
        Rutas relativas tipo src="assets/img/..." deben resolverse desde la raíz del sitio.
        Sin <base>, en /bandeja/… el navegador pide /bandeja/assets/… → 404 (estáticos viven en /assets/…).
      */}
      <head>
        <base href="/" />
      </head>
      <body>
        <>
          <AntdReact19Patch />
          <Providers>{children}</Providers>
          <BootstrapJs />
        </>
      </body>
    </html>
  );
}
