"use client";
/* eslint-disable @next/next/no-img-element */
import "../../../../node_modules/bootstrap/dist/css/bootstrap.rtl.min.css";
import "../../../app/global.scss";
import { useEffect } from "react";
import { usePathname } from "next/navigation"; // Import usePathname
import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";


export default function RtlLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get the current pathname

  useEffect(() => {
    if (pathname === "/layout-rtl") {
      document.body.classList.add("layout-mode-rtl");
    } else {
      document.body.classList.remove("layout-mode-rtl");
    }
  }, [pathname]); // Run effect when pathname changes

  return (
    <>
      <Header />
      <Sidebar />
      {children}
    </>
  );
}
