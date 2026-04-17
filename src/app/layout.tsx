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

export const metadata = {
  title: "Dreams POS - Inventory Management & Admin Dashboard Template",
  description:
    "Dreams POS is a powerful Bootstrap-based Inventory Management Admin Template designed for businesses, offering seamless invoicing, project tracking, and estimates.",
  keywords:
    "inventory management, admin dashboard, bootstrap template, invoicing, estimates, business management, responsive admin, POS system",
  author: "Dreams Technologies",
  icons: {
    icon: "favicon.png",
    shortcut: "favicon.png", // Add shortcut icon for better support
    apple: "favicon.png", // Optional: for Apple devices (place in `public/`)
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
