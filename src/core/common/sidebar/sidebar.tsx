"use client";
/* eslint-disable-next-line @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

import { all_routes } from "@/data/all_routes";
import { useMenu } from "@/hooks/useMenu";
import type { MenuSection } from "@/store/menuSlice";
import GroupSeparator from "./GroupSeparator";
import SidebarSection from "./SidebarSection";
import { ChevronsLeft } from "react-feather";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

function orderedGroupKeys(sections: MenuSection[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const s of sections) {
    if (!seen.has(s.group)) {
      seen.add(s.group);
      order.push(s.group);
    }
  }
  return order;
}

export default function Sidebar() {
  const route = all_routes;
  const pathname = usePathname();
  const { menu, loading, error } = useMenu();

  useEffect(() => {
    if (error) console.error("[sidebar] menú:", error);
  }, [error]);
  // const { t } = useTranslation();

  const [toggle, SetToggle] = useState(false);
  const [expandMenus, setExpandMenus] = useState(false); // Local state for expandMenus
  const [dataLayout, setDataLayout] = useState("default"); // Local state for dataLayout

  const handlesidebar = (): void => {
    document.body.classList.toggle("mini-sidebar");
    SetToggle((current: boolean) => !current);
  };

  const expandMenu = (): void => {
    setExpandMenus(false);
    document.body.classList.remove("expand-menu");
  };

  const expandMenuOpen = (): void => {
    setExpandMenus(true);
    document.body.classList.add("expand-menu");
  };

  useEffect(() => {
    // Update the DOM based on `dataLayout` and `expandMenus`
    document.body.classList.toggle("expand-menu", expandMenus || dataLayout === "layout-hovered");
  }, [expandMenus, dataLayout]);

  return (
    <>
      <div
        className={`sidebar ${toggle ? "" : "active"} ${
          expandMenus || dataLayout === "layout-hovered" ? "expand-menu" : ""
        }`}
        id="sidebar"
        onMouseLeave={expandMenu}
        onMouseOver={expandMenuOpen}
      >
        <>
          {/* Logo */}
          <div className="sidebar-logo">
            <Link href={route.newdashboard} className="logo logo-normal">
              <img src="assets/img/logo.svg" alt="Img" />
            </Link>
            <Link href={route.newdashboard} className="logo logo-white">
              <img src="assets/img/logo-white.svg" alt="Img" />
            </Link>
            <Link href={route.newdashboard} className="logo-small">
              <img src="assets/img/logo-small.png" alt="Img" />
            </Link>
            <Link href={route.newdashboard} className="logo-small-white">
              <img src="assets/img/logo-small-white.png" alt="Img" />
            </Link>
            <Link id="toggle_btn" href="#" onClick={handlesidebar}>
              <i data-feather="chevrons-left" />
              <ChevronsLeft className="feather-16" />
            </Link>
          </div>
          {/* /Logo */}
          <div className="modern-profile p-3 pb-0">
            <div className="text-center rounded bg-light p-3 mb-4 border">
              <div className="avatar avatar-lg online mb-3">
                <img
                  src="assets/img/customer/customer15.jpg"
                  alt="Img"
                  className="img-fluid rounded-circle"
                />
              </div>
              <h6 className="fs-14 fw-bold mb-1">Adrian Herman</h6>
              <p className="fs-12 mb-0">System Admin</p>
            </div>
            <div className="sidebar-nav mb-3">
              <ul
                className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent"
                role="tablist"
              >
                <li className="nav-item">
                  <Link className="nav-link active border-0" href="#">
                    Menu
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link border-0" href={route.chat}>
                    Chats
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link border-0" href={route.email}>
                    Inbox
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </>
        <PerfectScrollbar>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              {loading && (
                <div className="placeholder-glow px-3 py-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ padding: "8px 16px" }}>
                      <span className="placeholder col-7 d-block" />
                    </div>
                  ))}
                </div>
              )}
              {error && !loading && (
                <ul>
                  <li className="submenu-open">
                    <h6 className="submenu-hdr">Menú</h6>
                    <ul>
                      <li>
                        <Link href={route.signin} className="active">
                          <i className="ti ti-logout me-2" />
                          <span>Iniciar sesión</span>
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              )}
              {!loading && !error && menu !== null && menu.length === 0 && (
                <p className="text-muted small px-3 py-2 mb-0">
                  No hay ítems de menú para tu rol.
                </p>
              )}
              {!loading && !error && menu !== null && menu.length > 0 && (
                <ul>
                  {orderedGroupKeys(menu).map((g) => (
                    <React.Fragment key={g}>
                      <GroupSeparator label={g} />
                      {menu
                        .filter((s) => s.group === g)
                        .map((section) => (
                          <SidebarSection
                            key={section.id}
                            section={section}
                            pathname={pathname}
                          />
                        ))}
                    </React.Fragment>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </PerfectScrollbar>
      </div>
    </>
  );
}
