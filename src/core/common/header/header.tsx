"use client";
{/* eslint-disable-next-line @next/next/no-img-element */}

import { all_routes } from "@/data/all_routes";
import { ChevronsLeft, Search } from "react-feather";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const route = all_routes;
  const [toggle, SetToggle] = useState(false);
  const [flagImage, setFlagImage] = useState("assets/img/flags/us-flag.svg");
  const pathname = usePathname(); // Use Next.js hook for current route
  const [expandMenus, setExpandMenus] = useState(false); // Local state for expandMenus
  const [dataLayout, setDataLayout] = useState("default"); // Local state for dataLayout



  const handlesidebar = (): void => {
    document.body.classList.toggle("mini-sidebar");
    SetToggle((current: boolean) => !current);
  };

  const sidebarOverlay = (): void => {
    document?.querySelector(".main-wrapper")?.classList?.toggle("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.toggle("opened");
    document?.querySelector("html")?.classList?.toggle("menu-opened");
  };

  const exclusionArray = [
    "/reactjs/template/dream-pos/index-three",
    "/reactjs/template/dream-pos/index-one",
  ];

  if (exclusionArray.includes(pathname)) {
    return null; // Return null if the pathname is in the exclusion array
  }

  const expandMenu = () => {
    setExpandMenus(false);
    document.body.classList.remove("expand-menu");
  };

  const expandMenuOpen = () => {
    setExpandMenus(true);
    document.body.classList.add("expand-menu");
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
        });
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => {
          });
        }
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    // Remove 'slide-nav' class from .main-wrapper on route change
    document?.querySelector(".main-wrapper")?.classList?.remove("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.remove("opened");
    document?.querySelector("html")?.classList?.remove("menu-opened");
  }, [pathname]);

  return (
    <>
      <div className="header">
        {/* Logo */}
        <div className="main-header">
          <div
            className={`header-left
             ${toggle ? "" : "active"}
             ${
               expandMenus || dataLayout === "layout-hovered"
                 ? "expand-menu"
                 : ""
             }
             `}
            onMouseLeave={expandMenu}
            onMouseOver={expandMenuOpen}
          >
            <Link href="/dashboard" className="logo logo-normal">
              <img src="assets/img/logo.png" alt="img" />
            </Link>
            <Link href="/dashboard" className="logo logo-white">
              <img src="assets/img/logo-white.png" alt="img" />
            </Link>
            <Link href="/dashboard" className="logo-small">
              <img src="assets/img/logo-small.png" alt="img" />
            </Link>
            <Link href={route.newdashboard} className="logo-small-white">
              <img src="assets/img/logo-small-white.png" alt="Img" />
            </Link>
            <Link
              id="toggle_btn"
              href="#"
              style={{
                display:
                  pathname.includes("tasks") || pathname.includes("pos")
                    ? "none"
                    : pathname.includes("compose")
                    ? "none"
                    : "",
              }}
              onClick={handlesidebar}
            >
              <ChevronsLeft className="feather-16" />
            </Link>
          </div>
          {/* /Logo */}
          <Link
            id="mobile_btn"
            className="mobile_btn"
            href="#"
            onClick={sidebarOverlay}
          >
            <span className="bar-icon">
              <span />
              <span />
              <span />
            </span>
          </Link>
          {/* Header Menu */}
          <ul className="nav user-menu">
            {/* Search */}
            <li className="nav-item nav-searchinputs">
              <div className="top-nav-search">
                <Link href="#" className="responsive-search">
                  <Search />
                </Link>
                <form action="#" className="dropdown">
                  <div
                    className="searchinputs input-group dropdown-toggle"
                    id="dropdownMenuClickable"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                  >
                    <input type="text" placeholder="Search" />
                    <div className="search-addon">
                      <span>
                        <i className="ti ti-search" />
                      </span>
                    </div>
                    <span className="input-group-text">
                      <kbd className="d-flex align-items-center">
                        <img
                          src="assets/img/icons/command.svg"
                          alt="img"
                          className="me-1"
                        />
                        K
                      </kbd>
                    </span>
                  </div>
                </form>
              </div>
            </li>
            {/* /Search */}

            {/* Select Store */}
            <li className="nav-item dropdown has-arrow main-drop select-store-dropdown">
              <Link
                href="#"
                className="dropdown-toggle nav-link select-store"
                data-bs-toggle="dropdown"
              >
                <span className="user-info">
                  <span className="user-letter">
                    <img
                      src="assets/img/store/store-01.png"
                      alt="Store Logo"
                      className="img-fluid"
                    />
                  </span>
                  <span className="user-detail">
                    <span className="user-name">Freshmart</span>
                  </span>
                </span>
              </Link>
              <div className="dropdown-menu dropdown-menu-right">
                <Link href="#" className="dropdown-item">
                  <img
                    src="assets/img/store/store-01.png"
                    alt="Store Logo"
                    className="img-fluid"
                  />
                  Freshmart
                </Link>
                <Link href="#" className="dropdown-item">
                  <img
                    src="assets/img/store/store-02.png"
                    alt="Store Logo"
                    className="img-fluid"
                  />
                  Grocery Apex
                </Link>
                <Link href="#" className="dropdown-item">
                  <img
                    src="assets/img/store/store-03.png"
                    alt="Store Logo"
                    className="img-fluid"
                  />
                  Grocery Bevy
                </Link>
                <Link href="#" className="dropdown-item">
                  <img
                    src="assets/img/store/store-04.png"
                    alt="Store Logo"
                    className="img-fluid"
                  />
                  Grocery Eden
                </Link>
              </div>
            </li>
            {/* /Select Store */}

            <li className="nav-item dropdown link-nav">
              <Link
                href="#"
                className="btn btn-primary btn-md d-inline-flex align-items-center"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-circle-plus me-1" />
                Add New
              </Link>
              <div className="dropdown-menu dropdown-xl dropdown-menu-center">
                <div className="row g-2">
                  <div className="col-md-2">
                    <Link href={route.categorylist} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-brand-codepen" />
                      </span>
                      <p>Category</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.addproduct} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-square-plus" />
                      </span>
                      <p>Product</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.categorylist} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-shopping-bag" />
                      </span>
                      <p>Purchase</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href="{route.online}" className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-shopping-cart" />
                      </span>
                      <p>Sale</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.expenselist} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-file-text" />
                      </span>
                      <p>Expense</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.quotationlist} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-device-floppy" />
                      </span>
                      <p>Quotation</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.salesreturn} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-copy" />
                      </span>
                      <p>Return</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.users} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-user" />
                      </span>
                      <p>User</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.customer} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-users" />
                      </span>
                      <p>Customer</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.salesreport} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-shield" />
                      </span>
                      <p>Biller</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.suppliers} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-user-check" />
                      </span>
                      <p>Supplier</p>
                    </Link>
                  </div>
                  <div className="col-md-2">
                    <Link href={route.stocktransfer} className="link-item">
                      <span className="link-icon">
                        <i className="ti ti-truck" />
                      </span>
                      <p>Transfer</p>
                    </Link>
                  </div>
                </div>
              </div>
            </li>
            <li className="nav-item pos-nav">
              <Link
                href={route.pos}
                className="btn btn-dark btn-md d-inline-flex align-items-center"
              >
                <i className="ti ti-device-laptop me-1" />
                POS
              </Link>
            </li>

            {/* Flag */}
            <li className="nav-item dropdown has-arrow flag-nav nav-item-box">
              <Link
                className="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
                href="#"
                role="button"
              >
                {/* <i data-feather="globe" /> */}
                {/* <FeatherIcon icon="globe" /> */}
                <img src={flagImage} alt="img" height={16} />
              </Link>
              <div className="dropdown-menu dropdown-menu-right">
                <Link
                  href="#"
                  className="dropdown-item active"
                  // onClick={() => changeLanguage("en")}
                >
                  <img
                    src="assets/img/flags/english.svg"
                    alt="img"
                    height={16}
                  />
                  {/* {t("English")} */}
                </Link>
                <Link
                  href="#"
                  className="dropdown-item"
                  // onClick={() => changeLanguage("fr")}
                >
                  <img
                    src="assets/img/flags/arabic.svg"
                    alt="img"
                    height={16}
                  />{" "}
                  Arabic
                </Link>
              </div>
            </li>
            {/* /Flag */}
            <li className="nav-item nav-item-box">
              <Link
                href="#"
                id="btnFullscreen"
                onClick={toggleFullscreen}
                className={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              >
                {/* <i data-feather="maximize" /> */}
                <i className="ti ti-maximize"></i>
              </Link>
            </li>
            <li className="nav-item nav-item-box">
              <Link href="/email">
                {/* <i data-feather="mail" /> */}
                <i className="ti ti-mail"></i>
                <span className="badge rounded-pill">1</span>
              </Link>
            </li>
            {/* Notifications */}
            <li className="nav-item dropdown nav-item-box">
              <Link
                href="#"
                className="dropdown-toggle nav-link"
                data-bs-toggle="dropdown"
              >
                {/* <i data-feather="bell" /> */}
                <i className="ti ti-bell"></i>
                {/* <span className="badge rounded-pill">2</span> */}
              </Link>
              <div className="dropdown-menu notifications">
                <div className="topnav-dropdown-header">
                  <h5 className="notification-title">Notifications</h5>
                  <Link href="#" className="clear-noti">
                    Mark all as read
                  </Link>
                </div>
                <div className="noti-content">
                  <ul className="notification-list">
                    <li className="notification-message">
                      <Link href={route.activities}>
                        <div className="media d-flex">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src="assets/img/profiles/avatar-13.jpg"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details">
                              <span className="noti-title">James Kirwin</span>{" "}
                              confirmed his order. Order No: #78901.Estimated
                              delivery: 2 days
                            </p>
                            <p className="noti-time">4 mins ago</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                    <li className="notification-message">
                      <Link href={route.activities}>
                        <div className="media d-flex">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src="assets/img/profiles/avatar-03.jpg"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details">
                              <span className="noti-title">Leo Kelly</span>{" "}
                              cancelled his order scheduled for 17 Jan 2025
                            </p>
                            <p className="noti-time">10 mins ago</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                    <li className="notification-message">
                      <Link href={route.activities} className="recent-msg">
                        <div className="media d-flex">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src="assets/img/profiles/avatar-17.jpg"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details">
                              Payment of $50 received for Order #67890 from{" "}
                              <span className="noti-title">Antonio Engle</span>
                            </p>
                            <p className="noti-time">05 mins ago</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                    <li className="notification-message">
                      <Link href={route.activities} className="recent-msg">
                        <div className="media d-flex">
                          <span className="avatar flex-shrink-0">
                            <img
                              alt="Img"
                              src="assets/img/profiles/avatar-02.jpg"
                            />
                          </span>
                          <div className="flex-grow-1">
                            <p className="noti-details">
                              <span className="noti-title">Andrea</span>{" "}
                              confirmed his order. Order No: #73401.Estimated
                              delivery: 3 days
                            </p>
                            <p className="noti-time">4 mins ago</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="topnav-dropdown-footer d-flex align-items-center gap-3">
                  <Link href="#" className="btn btn-secondary btn-md w-100">
                    Cancel
                  </Link>
                  <Link
                    href={route.activities}
                    className="btn btn-primary btn-md w-100"
                  >
                    View all
                  </Link>
                </div>
              </div>
            </li>
            {/* /Notifications */}
            <li className="nav-item nav-item-box">
              <Link href="/general-settings">
                {/* <i data-feather="settings" /> */}
                <i className="ti ti-settings"></i>
              </Link>
            </li>
            <li className="nav-item dropdown has-arrow main-drop profile-nav">
              <Link
                href="#"
                className="nav-link userset"
                data-bs-toggle="dropdown"
              >
                <span className="user-info p-0">
                  <span className="user-letter">
                    <img
                      src="assets/img/profiles/avator1.jpg"
                      alt="Img"
                      className="img-fluid"
                    />
                  </span>
                </span>
              </Link>
              <div className="dropdown-menu menu-drop-user">
                <div className="profileset d-flex align-items-center">
                  <span className="user-img me-2">
                    <img src="assets/img/profiles/avator1.jpg" alt="Img" />
                  </span>
                  <div>
                    <h6 className="fw-medium">John Smilga</h6>
                    <p>Admin</p>
                  </div>
                </div>
                <Link className="dropdown-item" href={route.profile}>
                  <i className="ti ti-user-circle me-2" />
                  MyProfile
                </Link>
                <Link className="dropdown-item" href={route.salesreport}>
                  <i className="ti ti-file-text me-2" />
                  Reports
                </Link>
                <Link className="dropdown-item" href={route.generalsettings}>
                  <i className="ti ti-settings-2 me-2" />
                  Settings
                </Link>
                <hr className="my-2" />
                <Link className="dropdown-item logout pb-0" href={route.signin}>
                  <i className="ti ti-logout me-2" />
                  Logout
                </Link>
              </div>
            </li>
          </ul>
          {/* /Header Menu */}
          {/* Mobile Menu */}
          <div className="dropdown mobile-user-menu">
            <Link
              href="#"
              className="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="fa fa-ellipsis-v" />
            </Link>
            <div className="dropdown-menu dropdown-menu-right">
              <Link className="dropdown-item" href="profile">
                My Profile
              </Link>
              <Link className="dropdown-item" href="generalsettings">
                Settings
              </Link>
              <Link className="dropdown-item" href="signin">
                Logout
              </Link>
            </div>
          </div>
          {/* /Mobile Menu */}
        </div>
      </div>
    </>
  );
}
