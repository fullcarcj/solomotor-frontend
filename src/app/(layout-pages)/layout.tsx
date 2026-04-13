"use client";
/* eslint-disable @next/next/no-img-element */
import "../../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../../app/global.scss";
import { useEffect } from "react";
import { usePathname } from "next/navigation"; // Import usePathname
import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";
import HorizontalSidebar from "@/core/common/sidebar/horizontalSidebar";
import TwoColumnSidebar from "@/core/common/sidebar/two-column";

export default function Layoutpages({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current pathname

  useEffect(() => {
    const htmlElement = document.documentElement;

    // Log for debugging
    console.log("Current Pathname:", pathname);

    // Reset body classes before applying new ones
    document.body.classList.remove(
      "menu-horizontal",
      "layout-box-mode",
      "mini-sidebar"
    );

    switch (pathname) {
      case "/layout-horizontal":
        htmlElement.setAttribute("data-layout", "horizontal");
        document.body.classList.add("menu-horizontal");
        break;

      case "/layout-box":
        htmlElement.setAttribute("data-width", "box");
        htmlElement.setAttribute("data-layout", "default");
        document.body.classList.add("mini-sidebar","layout-box-mode");
        break;

      case "/layout-detached":
        htmlElement.setAttribute("data-layout", "detached");
        break;

      case "/layout-two-column":
        htmlElement.setAttribute("data-layout", "twocolumn");
        break;

      case "/layout-hovered":
        htmlElement.setAttribute("data-layout", "layout-hovered");
        document.body.classList.add("mini-sidebar");
        break;

      case "/layout-box":
        htmlElement.setAttribute("data-width", "box");
        document.body.classList.add("mini-sidebar");
      case "/layout-dark":
        htmlElement.setAttribute("data-theme", "dark");

      default:
        htmlElement.setAttribute("data-layout", "default");
        break;
    }
  }, [pathname]);

  // Run effect when pathname changes// Run effect when pathname changes
  return (
    <div className="main-wrapper">
      <Header />
      <HorizontalSidebar />
      <TwoColumnSidebar />
      <Sidebar />
      {children}
    </div>
  );
}
