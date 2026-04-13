"use client";
/* eslint-disable @next/next/no-img-element */
import { SidebarData1 } from "@/core/json/sidebar_dataone";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";



const HorizontalSidebar = () => {
  const [opendSubMenu, setOpendSubMenu] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null
  ]);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = usePathname();

  /* ================= TOGGLES ================= */

  const showMenu = (title: string) => {
    setOpendSubMenu(prev =>
      prev[0] === title ? [null, null, null] : [title, null, null]
    );
  };

  const showSubMenu = (title: string) => {
    setOpendSubMenu(prev =>
      prev[1] === title ? [prev[0], null, null] : [prev[0], title, null]
    );
  };

  const showInnerMenu = (title: string) => {
    setOpendSubMenu(prev =>
      prev[2] === title ? [prev[0], prev[1], null] : [prev[0], prev[1], title]
    );
  };

  /* ================= CLICK OUTSIDE ================= */

  const handleClickOutside = (event: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
      setOpendSubMenu([null, null, null]);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= ACTIVE HELPERS ================= */

  const isActiveRoute = (route?: string) => {
    if (!route) return false;
    return location.split("/")[1] === route.split("/")[1];
  };

  const isActiveMenu = (menu: any): boolean => {
    return (
      isActiveRoute(menu.route) ||
      menu.subRoutes?.some((sub: any) => isActiveMenu(sub))
    );
  };

  /* ================= LINK RENDER ================= */

  const renderLink = (
    item: any,
    children: React.ReactNode,
    className = ""
  ) => {
    if (item.external) {
      return (
        <a
          href={item.route || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={item.route || "#"} className={className}>
        {children}
      </Link>
    );
  };

  /* ================= RENDER ================= */

  return (
    <div className="sidebar sidebar-horizontal" id="horizontal-menu" ref={sidebarRef}>
      <div className="sidebar-menu" id="sidebar-menu-3">
        <div className="main-menu">
          <ul className="nav">
            {SidebarData1.map((main, mainIndex) => (
              <li className="submenu" key={mainIndex}>
                <a
                  className={opendSubMenu[0] === main.tittle || isActiveMenu(main) ? "active" : ""}
                  onClick={() => showMenu(main.tittle)}
                >
                  <i className={`ti ti-${main.icon} me-2`} />
                  <span>{main.tittle}</span>
                  <span className="menu-arrow" />
                </a>

                {/* ========== LEVEL 2 ========== */}
                <ul className={`submenus-two ${opendSubMenu[0] === main.tittle ? "d-block" : "d-none"}`}>
                  {main.subRoutes.map((menu: any, i: number) => (
                    <React.Fragment key={i}>
                      {!menu.hasSubRoute && (
                        <li>
                          {renderLink(
                            menu,
                            <span>{menu.tittle}</span>,
                            isActiveRoute(menu.route) ? "active" : ""
                          )}
                        </li>
                      )}

                      {menu.hasSubRoute && (
                        <li className="submenu">
                          <a
                            className={isActiveMenu(menu) ? "active" : ""}
                            onClick={() => showSubMenu(menu.tittle)}
                          >
                            <span>{menu.tittle}</span>
                            <span className="menu-arrow" />
                          </a>

                          {/* ========== LEVEL 3 ========== */}
                          <ul
                            className={`submenus-three ${
                              opendSubMenu[1] === menu.tittle ? "d-block" : "d-none"
                            }`}
                          >
                            {menu.subRoutes?.map((sub: any, j: number) => (
                              <React.Fragment key={j}>
                                {!sub.hasSubRoute && (
                                  <li>
                                    {renderLink(
                                      sub,
                                      <span>{sub.tittle}</span>,
                                      isActiveRoute(sub.route) ? "active" : ""
                                    )}
                                  </li>
                                )}

                                {sub.hasSubRoute && (
                                  <li className="submenu">
                                    <a
                                      className={isActiveMenu(sub) ? "active" : ""}
                                      onClick={() => showInnerMenu(sub.tittle)}
                                    >
                                      <span>{sub.tittle}</span>
                                      <span className="menu-arrow" />
                                    </a>

                                    {/* OPTIONAL LEVEL 4 */}
                                    <ul
                                      className={`submenus-three ${
                                        opendSubMenu[2] === sub.tittle
                                          ? "d-block"
                                          : "d-none"
                                      }`}
                                    >
                                      {sub.subRoutes?.map((deep: any, k: number) => (
                                        <li key={k}>
                                          {renderLink(
                                            deep,
                                            <span>{deep.tittle}</span>,
                                            isActiveRoute(deep.route) ? "active" : ""
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </li>
                                )}
                              </React.Fragment>
                            ))}
                          </ul>
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HorizontalSidebar;
