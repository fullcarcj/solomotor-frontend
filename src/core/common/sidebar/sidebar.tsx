"use client";
/* eslint-disable-next-line @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

import { SidebarData } from "../../json/siderbar_data";
import { all_routes } from "@/data/all_routes";
import { ChevronsLeft } from "react-feather";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

/** Recoge todos los `link` de un árbol de submenú (rutas activas / resaltado del padre). */
function collectSubmenuLinks(nodes: any[] | undefined): string[] {
  const acc: string[] = [];
  const walk = (list: any[] | undefined) => {
    if (!list) return;
    for (const n of list) {
      if (
        n?.link &&
        typeof n.link === "string" &&
        n.link.length > 0 &&
        n.link !== "#"
      ) {
        acc.push(n.link);
      }
      if (n?.submenuItems?.length) walk(n.submenuItems);
    }
  };
  walk(nodes);
  return acc;
}

export default function Sidebar() {
  const route = all_routes;
  const pathname = usePathname();
  // const { t } = useTranslation();

  const [subOpen, setSubopen] = useState("");
  const [subsidebar, setSubsidebar] = useState("");
  const [toggle, SetToggle] = useState(false);
  const [expandMenus, setExpandMenus] = useState(false); // Local state for expandMenus
  const [dataLayout, setDataLayout] = useState("default"); // Local state for dataLayout

  const toggleSidebar = (title: string): void => {
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem: string): void => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };

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
              <ul>
                {SidebarData?.map((mainLabel: any, index: any) => {
                  const topItems = mainLabel?.submenuItems ?? [];
                  const hideSectionHdr =
                    topItems.length === 1 &&
                    topItems[0]?.submenu === true &&
                    topItems[0]?.label === mainLabel?.label;
                  return (
                  <li className="submenu-open" key={index}>
                    {!hideSectionHdr ? (
                      <h6 className="submenu-hdr">{mainLabel?.label}</h6>
                    ) : null}
                    <ul>
                      {mainLabel?.submenuItems?.map((title: any, i: any) => {
                        title.links = collectSubmenuLinks(title?.submenuItems);
                        return (
                          <React.Fragment key={i}>
                            <li
                              className={`submenu ${
                                !title?.submenu && pathname === title?.link
                                  ? "custom-active-hassubroute-false"
                                  : ""
                              }`}
                            >
                              <Link
                                href={title?.link || "#"}
                                target={title?.target || undefined}
                                rel={
                                  title?.target === "_blank"
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                onClick={(e) => {
                                  if (
                                    title?.submenu &&
                                    (!title?.link || title.link === "#")
                                  ) {
                                    e.preventDefault();
                                  }
                                  toggleSidebar(title?.label);
                                }}
                                className={`${
                                  subOpen === title?.label ? "subdrop" : ""
                                } ${
                                  title?.links?.includes(pathname)
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <i className={`ti ti-${title.icon} me-2`}></i>
                                <span className="custom-active-span">
                                  {(title?.label)}
                                </span>
                                {title?.submenu && (
                                  <span className="menu-arrow" />
                                )}
                              </Link>
                              <ul
                                style={{
                                  display:
                                    subOpen === title?.label ? "block" : "none",
                                }}
                              >
                                {title?.submenuItems?.map(
                                  (item: any, titleIndex: any) => (
                                    <li
                                      className="submenu submenu-two"
                                      key={titleIndex}
                                    >
                                      <Link
                                        href={item?.link || "#"}
                                        className={`${
                                          collectSubmenuLinks(
                                            item?.submenuItems
                                          ).includes(pathname) ||
                                          item?.link === pathname
                                            ? "active"
                                            : ""
                                        } ${
                                          subsidebar === item?.label
                                            ? "subdrop"
                                            : ""
                                        }${
                                          item?.icon
                                            ? " submenu-link-with-icon"
                                            : ""
                                        }`}
                                        target={item?.target || undefined}
                                        rel={
                                          item?.target === "_blank"
                                            ? "noopener noreferrer"
                                            : undefined
                                        }
                                        onClick={(e) => {
                                          if (
                                            item?.submenu &&
                                            (!item?.link || item.link === "#")
                                          ) {
                                            e.preventDefault();
                                          }
                                          toggleSubsidebar(item?.label);
                                        }}
                                      >
                                        {item?.icon ? (
                                          <i
                                            className={`ti ti-${item.icon} me-2`}
                                          />
                                        ) : null}
                                        <span>{item?.label}</span>
                                        {item?.submenu && (
                                          <span className="menu-arrow inside-submenu" />
                                        )}
                                      </Link>
                                      <ul
                                        style={{
                                          display:
                                            subsidebar === item?.label
                                              ? "block"
                                              : "none",
                                        }}
                                      >
                                        {item?.submenuItems?.map(
                                          (items: any, subIndex: any) => (
                                            <li key={subIndex}>
                                              <Link
                                                href={items?.link || "#"}
                                                className={`${
                                                  subsidebar === items?.label
                                                    ? "submenu-two subdrop"
                                                    : "submenu-two"
                                                } ${
                                                  collectSubmenuLinks(
                                                    items?.submenuItems
                                                  ).includes(pathname) ||
                                                  items?.link === pathname
                                                    ? "active"
                                                    : ""
                                                }`}
                                                target={items?.target || undefined}
                                                rel={
                                                  items?.target === "_blank"
                                                    ? "noopener noreferrer"
                                                    : undefined
                                                }
                                              >
                                                {items?.label}
                                              </Link>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </li>
                                  )
                                )}
                              </ul>
                            </li>
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  </li>
                );
                })}
              </ul>
            </div>
          </div>
        </PerfectScrollbar>
      </div>
    </>
  );
}
