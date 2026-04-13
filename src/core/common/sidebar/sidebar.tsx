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
                {SidebarData?.map((mainLabel: any, index: any) => (
                  <li className="submenu-open" key={index}>
                    <h6 className="submenu-hdr">{mainLabel?.label}</h6>
                    <ul>
                      {mainLabel?.submenuItems?.map((title: any, i: any) => {
                        const link_array: any[] = [];
                        title?.submenuItems?.map((link: any) => {
                          link_array.push(link?.link);
                          if (link?.submenu) {
                            link?.submenuItems?.map((item: any) => {
                              link_array.push(item?.link);
                            });
                          }
                          return link_array;
                        });
                        title.links = link_array;
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
                                onClick={() => toggleSidebar(title?.label)}
                                className={`${
                                  subOpen === title?.label ? "subdrop" : ""
                                } ${
                                  title?.links?.includes(pathname)
                                    ? "subdrop active"
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
                                          item?.submenuItems
                                            ?.map((link: any) => link.link)
                                            .includes(pathname) ||
                                          item?.link === pathname
                                            ? "active"
                                            : ""
                                        } ${
                                          subsidebar === item?.label
                                            ? "subdrop"
                                            : ""
                                        }`}
                                        target={item?.target || undefined}
                                        rel={
                                          item?.target === "_blank"
                                            ? "noopener noreferrer"
                                            : undefined
                                        }
                                        onClick={() =>
                                          toggleSubsidebar(item?.label)
                                        }
                                      >
                                        {item?.label}
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
                                                  items?.submenuItems
                                                    ?.map(
                                                      (link: any) => link.link
                                                    )
                                                    .includes(pathname) ||
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
                ))}
              </ul>
            </div>
          </div>
        </PerfectScrollbar>
      </div>
    </>
  );
}
