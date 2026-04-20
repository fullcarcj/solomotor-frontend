"use client";
/* eslint-disable-next-line @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import { ColorPicker, ColorPickerProps, GetProp } from "antd";
import "antd/dist/reset.css";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

type Color = Extract<
  GetProp<ColorPickerProps, "value">,
  string | { cleared: any }
>;

/** Valores iniciales idénticos en servidor y cliente (sin leer cookies en el primer render). */
const THEME_DEFAULTS = {
  dataLayout: "default",
  dataWidth: "fluid",
  dataTopBar: "white",
  dataTopBarColor: "white",
  dataTheme: "light",
  dataSidebarAll: "",
  dataColorAll: "",
  dataTopBarColorAll: "",
  dataTopbarAll: "",
  dataSidebar: "light",
  dataSidebarBg: "",
  dataTopbarBg: "",
  dataColor: "primary",
};

function rgbFromCookieTriplet(triplet: string): Color {
  const t = (triplet || "").trim();
  if (!t) return "rgb(255, 255, 255)";
  return `rgb(${t})`;
}

const ThemeSettings = () => {
  const buyNow = () => {
    window.open(
      "https://themeforest.net/item/dreamspos-pos-inventory-management-admin-dashboard-template/38834413?s_rank=13",
      "_blank"
    );
  };

  // Function to get initial state from cookies or default values
  const getInitialState = () => ({
    dataLayout: Cookies.get("dataLayout") || "default",
    dataWidth: Cookies.get("dataWidth") || "fluid",
    dataTopBar: Cookies.get("dataTopBar") || "white",
    dataTopBarColor: Cookies.get("dataTopBarColor") || "white",
    dataTheme: Cookies.get("dataTheme") || "light",
    dataSidebarAll: Cookies.get("dataSidebarAll") || "",
    dataColorAll: Cookies.get("dataColorAll") || "",
    dataTopBarColorAll: Cookies.get("dataTopBarColorAll") || "",
    dataTopbarAll: Cookies.get("dataTopbarAll") || "",
    dataSidebar: Cookies.get("dataSidebar") || "light",
    dataSidebarBg: Cookies.get("dataSidebarBg") || "",
    dataTopbarBg: Cookies.get("dataTopbarBg") || "",
    dataColor: Cookies.get("dataColor") || "primary",
  });

  // Local state for theme settings (primer render sin cookies → evita mismatch de hidratación)
  const [dataLayout, setDataLayout] = useState(THEME_DEFAULTS.dataLayout);
  const [dataWidth, setDataWidth] = useState(THEME_DEFAULTS.dataWidth);
  const [dataTopBar, setDataTopBar] = useState(THEME_DEFAULTS.dataTopBar);
  const [dataTopBarColor, setDataTopBarColor] = useState(
    THEME_DEFAULTS.dataTopBarColor
  );
  const [dataTheme, setDataTheme] = useState(THEME_DEFAULTS.dataTheme);
  const [dataSidebarAll, setDataSidebarAll] = useState(
    THEME_DEFAULTS.dataSidebarAll
  );
  const [dataColorAll, setDataColorAll] = useState(THEME_DEFAULTS.dataColorAll);
  const [dataTopBarColorAll, setDataTopBarColorAll] = useState(
    THEME_DEFAULTS.dataTopBarColorAll
  );
  const [dataTopbarAll, setDataTopbarAll] = useState(THEME_DEFAULTS.dataTopbarAll);
  const [dataSidebar, setDataSidebar] = useState(THEME_DEFAULTS.dataSidebar);
  const [dataSidebarBg, setDataSidebarBg] = useState(
    THEME_DEFAULTS.dataSidebarBg
  );
  const [dataTopbarBg, setDataTopbarBg] = useState(THEME_DEFAULTS.dataTopbarBg);
  const [dataColor, setDataColor] = useState(THEME_DEFAULTS.dataColor);
  const [themeHydrated, setThemeHydrated] = useState(false);

  const [colorRgb, setColorRgb] = useState<Color>(() =>
    rgbFromCookieTriplet(THEME_DEFAULTS.dataSidebarAll)
  );
  const [colorRgb2, setColorRgb2] = useState<Color>(() =>
    rgbFromCookieTriplet(THEME_DEFAULTS.dataTopbarAll)
  );
  const [colorRgb3, setColorRgb3] = useState<Color>(() =>
    rgbFromCookieTriplet(THEME_DEFAULTS.dataTopBarColorAll)
  );
  const [colorRgb4, setColorRgb4] = useState<Color>(() =>
    rgbFromCookieTriplet(THEME_DEFAULTS.dataColorAll)
  );
  const [formatRgb, setFormatRgb] = useState<ColorPickerProps["format"]>("rgb");

  useEffect(() => {
    const s = getInitialState();
    setDataLayout(s.dataLayout);
    setDataWidth(s.dataWidth);
    setDataTopBar(s.dataTopBar);
    setDataTopBarColor(s.dataTopBarColor);
    setDataTheme(s.dataTheme);
    setDataSidebarAll(s.dataSidebarAll);
    setDataColorAll(s.dataColorAll);
    setDataTopBarColorAll(s.dataTopBarColorAll);
    setDataTopbarAll(s.dataTopbarAll);
    setDataSidebar(s.dataSidebar);
    setDataSidebarBg(s.dataSidebarBg);
    setDataTopbarBg(s.dataTopbarBg);
    setDataColor(s.dataColor);
    setColorRgb(rgbFromCookieTriplet(s.dataSidebarAll));
    setColorRgb2(rgbFromCookieTriplet(s.dataTopbarAll));
    setColorRgb3(rgbFromCookieTriplet(s.dataTopBarColorAll));
    setColorRgb4(rgbFromCookieTriplet(s.dataColorAll));
    setThemeHydrated(true);
  }, []);

  useEffect(() => {
    if (!themeHydrated) return;
    Cookies.set("dataLayout", dataLayout);
    Cookies.set("dataWidth", dataWidth);
    Cookies.set("dataTopBar", dataTopBar);
    Cookies.set("dataTopBarColor", dataTopBarColor);
    Cookies.set("dataTheme", dataTheme);
    Cookies.set("dataSidebarAll", dataSidebarAll);
    Cookies.set("dataColorAll", dataColorAll);
    Cookies.set("dataTopBarColorAll", dataTopBarColorAll);
    Cookies.set("dataTopbarAll", dataTopbarAll);
    Cookies.set("dataSidebar", dataSidebar);
    Cookies.set("dataSidebarBg", dataSidebarBg);
    Cookies.set("dataTopbarBg", dataTopbarBg);
    Cookies.set("dataColor", dataColor);
  },[
    dataLayout,
    dataWidth,
    dataTopBar,
    dataTopBarColor,
    dataTheme,
    dataSidebarAll,
    dataColorAll,
    dataTopBarColorAll,
    dataTopbarAll,
    dataSidebar,
    dataSidebarBg,
    dataTopbarBg,
    dataColor,
    themeHydrated,
  ]);

  const handleReset = () => {
    setDataLayout("default");
    setDataWidth("fluid");
    setDataTopBar("white");
    setDataTopBarColor("white");
    setDataTheme("light");
    setDataSidebarAll("");
    setDataColorAll("");
    setDataTopBarColorAll("");
    setDataTopbarAll("");
    setDataSidebar("light");
    setDataSidebarBg("");
    setDataTopbarBg("");
    setDataColor("primary");

     // Remove cookies on reset
     Cookies.remove("dataLayout");
     Cookies.remove("dataWidth");
     Cookies.remove("dataTopBar");
     Cookies.remove("dataTopBarColor");
     Cookies.remove("dataTheme");
     Cookies.remove("dataSidebarAll");
     Cookies.remove("dataColorAll");
     Cookies.remove("dataTopBarColorAll");
     Cookies.remove("dataTopbarAll");
     Cookies.remove("dataSidebar");
     Cookies.remove("dataSidebarBg");
     Cookies.remove("dataTopbarBg");
     Cookies.remove("dataColor");

     // Remove `layout-box-mode mini-sidebar` classes on reset
    document.body.classList.remove("layout-box-mode", "mini-sidebar");
    document.body.classList.remove("mini-sidebar");
    document.body.classList.remove("menu-horizontal");

     // Reset the colors of `.nav.user-menu` and `.sidebar` to default
     if (typeof window !== "undefined") {
      const userMenuElement = document.querySelector<HTMLElement>(".nav.user-menu");
      if (userMenuElement) {
        userMenuElement.style.backgroundColor = ""; // Default color (white)
      }

      const sidebarElement = document.querySelector<HTMLElement>(".sidebar");
      if (sidebarElement) {
        sidebarElement.style.backgroundColor = ""; // Default color (light gray)
      }
    }
  };

  const rgbString = React.useMemo(
    () => (typeof colorRgb === "string" ? colorRgb : colorRgb?.toRgbString()),
    [colorRgb]
  );
  const rgbString2 = React.useMemo(
    () =>
      typeof colorRgb2 === "string" ? colorRgb2 : colorRgb2?.toRgbString(),
    [colorRgb2]
  );
  const rgbString3 = React.useMemo(
    () =>
      typeof colorRgb3 === "string" ? colorRgb3 : colorRgb3?.toRgbString(),
    [colorRgb3]
  );
  const rgbString4 = React.useMemo(
    () =>
      typeof colorRgb4 === "string" ? colorRgb4 : colorRgb4?.toRgbString(),
    [colorRgb4]
  );

  useEffect(() => {
    // Set default color and update the inline style of the nav user-menu with the selected color
    if (typeof window !== "undefined") {
      const userMenuElement = document.querySelector<HTMLElement>(".nav.user-menu");
      if (userMenuElement) {
        userMenuElement.style.backgroundColor = colorRgb
          ? typeof colorRgb === "string"
            ? colorRgb
            : colorRgb?.toRgbString() || ""
          : "rgb(255, 255, 255)"; // Default color (white)
      }
    }
  }, [colorRgb]);

  useEffect(() => {
    // Set default color and update the inline style of the sidebar with the selected color
    if (typeof window !== "undefined") {
      const sidebarElement = document.querySelector<HTMLElement>(".sidebar");
      if (sidebarElement) {
        sidebarElement.style.backgroundColor = colorRgb2
          ? typeof colorRgb2 === "string"
            ? colorRgb2
            : colorRgb2?.toRgbString() || ""
          : "rgb(255, 255, 255)"; // Default color (light gray)
      }
    }
  }, [colorRgb2]);

  // Update state when RGB values change
  useEffect(() => {
    setDataSidebarAll(rgbString.replace(/rgb\(|\)/g, "").trim());
    setDataTopbarAll(rgbString2.replace(/rgb\(|\)/g, "").trim());
    setDataTopBarColorAll(rgbString3.replace(/rgb\(|\)/g, "").trim());
    setDataColorAll(rgbString4.replace(/rgb\(|\)/g, "").trim());
  }, [rgbString, rgbString2, rgbString3, rgbString4]);

  // Update DOM attributes when state changes
  useEffect(() => {
    document.documentElement.setAttribute("data-layout", dataLayout);
    document.documentElement.setAttribute("data-width", dataWidth);
    document.documentElement.setAttribute("data-sidebar", dataSidebar);
    document.documentElement.setAttribute("data-theme", dataTheme);
    document.documentElement.setAttribute("data-topbar", dataTopBar);
    document.documentElement.setAttribute("data-topbarcolor", dataTopBarColor);
    document.documentElement.setAttribute("data-color", dataColor);
    document.body.setAttribute("data-sidebarbg", dataSidebarBg); // Apply dataSidebarBg to the body
    document.body.setAttribute("data-topbarbg", dataTopbarBg);
    setColorRgb(rgbFromCookieTriplet(dataSidebarAll));
    setColorRgb2(rgbFromCookieTriplet(dataTopbarAll));
    setColorRgb3(rgbFromCookieTriplet(dataTopBarColorAll));
    setColorRgb4(rgbFromCookieTriplet(dataColorAll));

    // Add or remove `layout-box-mode mini-sidebar` classes based on layout
    if (dataWidth === "box") {
      document.body.classList.add("layout-box-mode", "mini-sidebar");
    } else {
      document.body.classList.remove("layout-box-mode", "mini-sidebar");
    }
    if (dataLayout === "mini") {
      document.body.classList.add("mini-sidebar");
    } else {
      document.body.classList.remove("mini-sidebar");
    }
    if (dataLayout === "horizontal") {
      document.body.classList.add("menu-horizontal");
    } else {
      document.body.classList.remove("menu-horizontal");
    }
  }, [
    dataLayout,
    dataWidth,
    dataSidebar,
    dataSidebarAll,
    dataTheme,
    dataSidebarBg,
    dataTopBarColor,
    dataTopBar,
    dataTopbarBg,
    dataColor,
    dataColorAll,
    dataTopBarColorAll,
    dataTopbarAll,
  ]);



  const pathname = usePathname();

  // Add or remove the `layout-mode-rtl` class based on the layout and pathname
  useEffect(() => {
    if (dataLayout === "layout-mode-rtl" && pathname === "/layout-rtl") {
      document.body.classList.add("layout-mode-rtl");
    } else {
      document.body.classList.remove("layout-mode-rtl");
    }
  }, [dataLayout, pathname]);
  return (
    <>
      <div
        className="sidebar-themesettings offcanvas offcanvas-end"
        id="theme-setting"
      >
        <div className="offcanvas-header d-flex align-items-center justify-content-between bg-dark">
          <div>
            <h3 className="mb-1 text-white">Theme Customizer</h3>
            <p className="text-light">Choose your themes & layouts etc.</p>
          </div>
          <Link
            href="#"
            className="custom-btn-close d-flex align-items-center justify-content-center text-white"
            data-bs-dismiss="offcanvas"
          >
            <i className="ti ti-x" />
          </Link>
        </div>
        <div className="themecard-body offcanvas-body">
          <div
            className="accordion accordion-customicon1 accordions-items-seperate"
            id="settingtheme"
          >
            <div className="accordion-item border px-3 layout-select">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark bg-transparent fs-16 px-0 py-3"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#layoutsetting"
                  aria-expanded="true"
                  aria-controls="collapsecustomicon1One"
                >
                  Select Layouts
                </button>
              </h2>
              <div
                id="layoutsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body border-top px-0 py-3 pb-0">
                  <div className="row gx-3">
                    <div className="col-4">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="defaultLayout"
                          defaultValue="default"
                          checked={dataLayout === "default" ? true : false}
                          onChange={() => setDataLayout("default")}
                        />
                        <label htmlFor="defaultLayout">
                          <span className="d-block mb-2 layout-img">
                            <img src="assets/img/theme/default.svg" alt="img" />
                          </span>
                          <span className="layout-type">Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="miniLayout"
                          defaultValue="mini"
                          checked={dataLayout === "mini" ? true : false}
                          onChange={() => setDataLayout("mini")}
                        />
                        <label htmlFor="miniLayout">
                          <span className="d-block mb-2 layout-img">
                            <img src="assets/img/theme/mini.svg" alt="img" />
                          </span>
                          <span className="layout-type">Mini</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="twocolumnLayout"
                          defaultValue="twocolumn"
                          checked={dataLayout === "twocolumn" ? true : false}
                          onChange={() => setDataLayout("twocolumn")}
                        />
                        <label htmlFor="twocolumnLayout">
                          <span className="d-block mb-2 layout-img">
                            <img
                              src="assets/img/theme/two-column.svg"
                              alt="img"
                            />
                          </span>
                          <span className="layout-type">Two Column</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="horizontalLayout"
                          defaultValue="horizontal"
                          checked={dataLayout === "horizontal" ? true : false}
                          onChange={() => setDataLayout("horizontal")}
                        />
                        <label htmlFor="horizontalLayout">
                          <span className="d-block mb-2 layout-img">
                            <img
                              src="assets/img/theme/horizontal.svg"
                              alt="img"
                            />
                          </span>
                          <span className="layout-type">Horizontal</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="detachedLayout"
                          defaultValue="detached"
                          checked={dataLayout === "detached" ? true : false}
                          onChange={() => setDataLayout("detached")}
                        />
                        <label htmlFor="detachedLayout">
                          <span className="d-block mb-2 layout-img">
                            <img
                              src="assets/img/theme/detached.svg"
                              alt="img"
                            />
                          </span>
                          <span className="layout-type">Detached</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="theme-layout mb-3">
                        <input
                          type="radio"
                          name="LayoutTheme"
                          id="without-headerLayout"
                          defaultValue="without-header"
                          checked={
                            dataLayout === "without-header" ? true : false
                          }
                          onChange={() => setDataLayout("without-header")}
                        />
                        <label htmlFor="without-headerLayout">
                          <span className="d-block mb-2 layout-img">
                            <img
                              src="assets/img/theme/without-header.svg"
                              alt="img"
                            />
                          </span>
                          <span className="layout-type">Without Header</span>
                        </label>
                      </div>
                    </div>
                    <div className="col-4">
                      <Link
                        href={all_routes.RTL}
                        onClick={() => setDataLayout("layout-mode-rtl")}
                        className="theme-layout mb-3"
                      >
                        <span className="d-block mb-2 layout-img">
                          <img src="assets/img/theme/rtl.svg" alt="img" />
                        </span>
                        <span className="layout-type d-block">RTL</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item border px-3 layout-select">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 bg-transparent px-0 py-3"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidebarsetting"
                  aria-expanded="true"
                >
                  Layout Width
                </button>
              </h2>
              <div
                id="sidebarsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body px-0 py-3 border-top">
                  <div className="d-flex align-items-center">
                    <div className="theme-width m-1 me-2">
                      <input
                        type="radio"
                        name="width"
                        id="fluidWidth"
                        defaultValue="fluid"
                        checked={dataWidth === "fluid" ? true : false}
                        onChange={() => setDataWidth("fluid")}
                      />
                      <label
                        htmlFor="fluidWidth"
                        className="d-block rounded fs-12"
                      >
                        <i className="ti ti-layout-list me-1" />
                        Fluid Layout
                      </label>
                    </div>
                    <div className="theme-width m-1">
                      <input
                        type="radio"
                        name="width"
                        id="boxWidth"
                        defaultValue="box"
                        checked={dataWidth === "box" ? true : false}
                        onChange={() => setDataWidth("box")}
                      />
                      <label
                        htmlFor="boxWidth"
                        className="d-block rounded fs-12"
                      >
                        <i className="ti ti-layout-distribute-horizontal me-1" />
                        Boxed Layout
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item border px-3 themesettings-topbar-color">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#colorsetting"
                  aria-expanded="true"
                >
                  Top Bar Color
                </button>
              </h2>
              <div
                id="colorsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body pb-1 px-0 py-3 border-top">
                  <p className="mb-2 text-gray-9">Solid Colors</p>
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="whiteTopbar"
                        defaultValue="white"
                        checked={dataTopBar === "white" ? true : false}
                        onChange={() => setDataTopBar("white")}
                      />
                      <label htmlFor="whiteTopbar" className="bg-white" />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="darkaquaTopbar"
                        defaultValue="topbarcolorone"
                        checked={dataTopBar === "topbarcolorone" ? true : false}
                        onChange={() => setDataTopBar(" topbarcolorone")}
                      />
                      <label htmlFor="darkaquaTopbar" className="topbar-bg-1" />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="whiterockTopbar"
                        defaultValue="topbarcolortwo"
                        checked={dataTopBar === "topbarcolortwo" ? true : false}
                        onChange={() => setDataTopBar("topbarcolortwo")}
                      />
                      <label
                        htmlFor="whiterockTopbar"
                        className="bg-sidebar-color-2"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="rockblueTopbar"
                        defaultValue="topbarcolorthree"
                        checked={
                          dataTopBar === "topbarcolorthree" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolorthree")}
                      />
                      <label
                        htmlFor="rockblueTopbar"
                        className="bg-sidebar-color-3"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="bluehazeTopbar"
                        defaultValue="topbarcolorfour"
                        checked={
                          dataTopBar === "topbarcolorfour" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolorfour")}
                      />
                      <label
                        htmlFor="bluehazeTopbar"
                        className="bg-sidebar-color-4"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-5"
                        defaultValue="topbarcolorfive"
                        checked={
                          dataTopBar === "topbarcolorfive" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolorfive")}
                      />
                      <label
                        htmlFor="topbar-color-5"
                        className="bg-sidebar-color-5"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-6"
                        defaultValue="topbarcolorsix"
                        checked={dataTopBar === "topbarcolorsix" ? true : false}
                        onChange={() => setDataTopBar("topbarcolorsix")}
                      />
                      <label
                        htmlFor="topbar-color-6"
                        className="bg-sidebar-color-6"
                      />
                    </div>
                    <div
                      className={`theme-colorselect box-style position-relative theme-colorselect-rounded mb-3 mt-0 ${
                        dataTopBar === "all" ? "active" : ""
                      }`}
                      onClick={() => setDataTopBar("all")}
                    >
                      <div className="select-color position-absolute">
                        <i className="ti ti-palette"></i>
                      </div>
                      <ColorPicker
                        format={formatRgb}
                        value={colorRgb}
                        onChange={setColorRgb}
                        onFormatChange={setFormatRgb}
                      />
                    </div>
                  </div>
                  <p className="mb-2 text-gray-9">Gradient Colors</p>
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-7"
                        defaultValue="topbarcolorseven"
                        checked={
                          dataTopBar === "topbarcolorseven" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolorseven")}
                      />
                      <label
                        htmlFor="topbar-color-7"
                        className="bg-sidebar-color-7"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-8"
                        defaultValue="topbarcoloreight"
                        checked={
                          dataTopBar === "topbarcoloreight" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcoloreight")}
                      />
                      <label
                        htmlFor="topbar-color-8"
                        className="bg-sidebar-color-8"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-9"
                        defaultValue="topbarcolornine"
                        checked={
                          dataTopBar === "topbarcolornine" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolornine")}
                      />
                      <label
                        htmlFor="topbar-color-9"
                        className="bg-sidebar-color-9"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-10"
                        defaultValue="topbarcolorten"
                        checked={dataTopBar === "topbarcolorten" ? true : false}
                        onChange={() => setDataTopBar("topbarcolorten")}
                      />
                      <label
                        htmlFor="topbar-color-10"
                        className="bg-sidebar-color-10"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-11"
                        defaultValue="topbarcoloreleven"
                        checked={
                          dataTopBar === "topbarcoloreleven" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcoloreleven")}
                      />
                      <label
                        htmlFor="topbar-color-11"
                        className="bg-sidebar-color-11"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-12"
                        defaultValue="topbarcolortwelve"
                        checked={
                          dataTopBar === "topbarcolortwelve" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolortwelve")}
                      />
                      <label
                        htmlFor="topbar-color-12"
                        className="bg-sidebar-color-12"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-13"
                        defaultValue="topbarcolorthirteen"
                        checked={
                          dataTopBar === "topbarcolorthirteen" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolorthirteen")}
                      />
                      <label
                        htmlFor="topbar-color-13"
                        className="bg-sidebar-color-13"
                      />
                    </div>
                    <div className="theme-colorselect theme-colorselect-rounded mb-3 me-3">
                      <input
                        type="radio"
                        name="topbar"
                        id="topbar-color-14"
                        defaultValue="topbarcolorfourteen"
                        checked={
                          dataTopBar === "topbarcolorfourteen" ? true : false
                        }
                        onChange={() => setDataTopBar("topbarcolorfourteen")}
                      />
                      <label
                        htmlFor="topbar-color-14"
                        className="bg-sidebar-color-14"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item border px-3 themesidebar-color">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidebarsetting"
                  aria-expanded="true"
                >
                  Sidebar Color
                </button>
              </h2>
              <div
                id="sidebarsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body px-0 py-3 border-top">
                  <p className="mb-2 text-gray-9">Solid Colors</p>
                  <div className="d-flex align-items-center">
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="lightSidebar"
                        defaultValue="light"
                        checked={dataSidebar === "light" ? true : false}
                        onChange={() => setDataSidebar("light")}
                      />
                      <label
                        htmlFor="lightSidebar"
                        className="d-block mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolorSidebar"
                        defaultValue="sidebarcolorone"
                        checked={
                          dataSidebar === "sidebarcolorone" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorone")}
                      />
                      <label
                        htmlFor="bgcolorSidebar"
                        className="d-block bg-sidebar-color-1 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor2Sidebar"
                        defaultValue="sidebarcolortwo"
                        checked={
                          dataSidebar === "sidebarcolortwo" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolortwo")}
                      />
                      <label
                        htmlFor="bgcolor2Sidebar"
                        className="d-block bg-sidebar-color-2 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor3Sidebar"
                        defaultValue="sidebarcolorthree"
                        checked={
                          dataSidebar === "sidebarcolorthree" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorthree")}
                      />
                      <label
                        htmlFor="bgcolor3Sidebar"
                        className="d-block bg-sidebar-color-3 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor4Sidebar"
                        defaultValue="sidebarcolorfour"
                        checked={
                          dataSidebar === "sidebarcolorfour" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorfour")}
                      />
                      <label
                        htmlFor="bgcolor4Sidebar"
                        className="d-block bg-sidebar-color-4 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor5Sidebar"
                        defaultValue="sidebarcolorfive"
                        checked={
                          dataSidebar === "sidebarcolorfive" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorfive")}
                      />
                      <label
                        htmlFor="bgcolor5Sidebar"
                        className="d-block bg-sidebar-color-5 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor6Sidebar"
                        defaultValue="sidebarcolorsix"
                        checked={
                          dataSidebar === "sidebarcolorsix" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorsix")}
                      />
                      <label
                        htmlFor="bgcolor6Sidebar"
                        className="d-block bg-sidebar-color-6 mb-2"
                      ></label>
                    </div>
                    <div
                      className={`theme-colorselect oval-style position-relative m-1 mt-0 ${
                        dataSidebar === "all" ? "active" : ""
                      }`}
                      onClick={() => setDataSidebar("all")}
                    >
                      <div className="select-color position-absolute">
                        <i className="ti ti-palette"></i>
                      </div>
                      <ColorPicker
                        format={formatRgb}
                        value={colorRgb2}
                        onChange={setColorRgb2}
                        onFormatChange={setFormatRgb}
                      />
                    </div>
                  </div>
                  <p className="mb-2 text-gray-9">Gradient Colors</p>
                  <div className="d-flex align-items-center">
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor7Sidebar"
                        defaultValue="sidebarcolorseven"
                        checked={
                          dataSidebar === "sidebarcolorseven" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorseven")}
                      />
                      <label
                        htmlFor="bgcolor7Sidebar"
                        className="d-block bg-sidebar-color-7 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor8Sidebar"
                        defaultValue="sidebarcoloreight"
                        checked={
                          dataSidebar === "sidebarcoloreight" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcoloreight")}
                      />
                      <label
                        htmlFor="bgcolor8Sidebar"
                        className="d-block bg-sidebar-color-8 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor9Sidebar"
                        defaultValue="sidebarcolornine"
                        checked={
                          dataSidebar === "sidebarcolornine" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolornine")}
                      />
                      <label
                        htmlFor="bgcolor9Sidebar"
                        className="d-block bg-sidebar-color-9 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor10Sidebar"
                        defaultValue="sidebarcolorten"
                        checked={
                          dataSidebar === "sidebarcolorten" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorten")}
                      />
                      <label
                        htmlFor="bgcolor10Sidebar"
                        className="d-block bg-sidebar-color-10 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor11Sidebar"
                        defaultValue="sidebarcoloreleven"
                        checked={
                          dataSidebar === "sidebarcoloreleven" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcoloreleven")}
                      />
                      <label
                        htmlFor="bgcolor11Sidebar"
                        className="d-block bg-sidebar-color-11 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor12Sidebar"
                        defaultValue="sidebarcolortwelve"
                        checked={
                          dataSidebar === "sidebarcolortwelve" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolortwelve")}
                      />
                      <label
                        htmlFor="bgcolor12Sidebar"
                        className="d-block bg-sidebar-color-12 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor13Sidebar"
                        defaultValue="sidebarcolorthirteen"
                        checked={
                          dataSidebar === "sidebarcolorthirteen" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorthirteen")}
                      />
                      <label
                        htmlFor="bgcolor13Sidebar"
                        className="d-block bg-sidebar-color-13 mb-2"
                      ></label>
                    </div>
                    <div className="theme-colorselect m-1 me-2">
                      <input
                        type="radio"
                        name="sidebar"
                        id="bgcolor14Sidebar"
                        defaultValue="sidebarcolorfourteen"
                        checked={
                          dataSidebar === "sidebarcolorfourteen" ? true : false
                        }
                        onChange={() => setDataSidebar("sidebarcolorfourteen")}
                      />
                      <label
                        htmlFor="bgcolor14Sidebar"
                        className="d-block bg-sidebar-color-14 mb-2"
                      ></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item border px-3">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#modesetting"
                  aria-expanded="true"
                >
                  Theme Mode
                </button>
              </h2>
              <div
                id="modesetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body px-0 py3 border-top">
                  <div className="d-flex align-items-center">
                    <div className="theme-mode flex-fill text-center w-100 me-3">
                      <input
                        type="radio"
                        name="theme"
                        id="lightTheme"
                        defaultValue="light"
                        checked={dataTheme === "light" ? true : false}
                        onChange={() => setDataTheme("light")}
                      />
                      <label
                        htmlFor="lightTheme"
                        className="rounded fw-medium w-100"
                      >
                        <span className="d-inline-flex rounded me-2">
                          <i className="ti ti-sun-filled" />
                        </span>
                        Light
                      </label>
                    </div>
                    <div className="theme-mode flex-fill text-center w-100 me-3">
                      <input
                        type="radio"
                        name="theme"
                        id="darkTheme"
                        defaultValue="dark"
                        checked={dataTheme === "dark" ? true : false}
                        onChange={() => setDataTheme("dark")}
                      />
                      <label
                        htmlFor="darkTheme"
                        className="rounded fw-medium w-100"
                      >
                        <span className="d-inline-flex rounded me-2">
                          <i className="ti ti-moon-filled" />
                        </span>
                        Dark
                      </label>
                    </div>
                    <div className="theme-mode flex-fill text-center w-100 me-3">
                      <input
                        type="radio"
                        name="theme"
                        id="system"
                        defaultValue="system"
                        checked={dataTheme === "system" ? true : false}
                        onChange={() => setDataTheme("system")}
                      />
                      <label
                        htmlFor="system"
                        className="rounded fw-medium w-100"
                      >
                        <span className="d-inline-flex rounded me-2">
                          <i className="ti ti-device-laptop" />
                        </span>
                        System
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item border px-3 layout-select themesidebar-background">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidebarbgsetting"
                  aria-expanded="true"
                >
                  Sidebar Background
                </button>
              </h2>
              <div
                id="sidebarbgsetting"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body pb-1 px-0 py-3 border-top">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="theme-sidebarbg me-3 mb-3">
                      <input
                        type="radio"
                        name="sidebarbg"
                        id="sidebarBg1"
                        defaultValue="sidebarbg1"
                        checked={dataSidebarBg === "sidebarbg1" ? true : false}
                        onChange={() => setDataSidebarBg("sidebarbg1")}
                      />
                      <label htmlFor="sidebarBg1" className="d-block rounded">
                        <img
                          src="assets/img/theme/sidebar-bg-01.svg"
                          alt="img"
                          className="rounded"
                        />
                      </label>
                    </div>
                    <div className="theme-sidebarbg me-3 mb-3">
                      <input
                        type="radio"
                        name="sidebarbg"
                        id="sidebarBg2"
                        defaultValue="sidebarbg2"
                        checked={dataSidebarBg === "sidebarbg2" ? true : false}
                        onChange={() => setDataSidebarBg("sidebarbg2")}
                      />
                      <label htmlFor="sidebarBg2" className="d-block rounded">
                        <img
                          src="assets/img/theme/sidebar-bg-02.svg"
                          alt="img"
                          className="rounded"
                        />
                      </label>
                    </div>
                    <div className="theme-sidebarbg me-3 mb-3">
                      <input
                        type="radio"
                        name="sidebarbg"
                        id="sidebarBg3"
                        defaultValue="sidebarbg3"
                        checked={dataSidebarBg === "sidebarbg3" ? true : false}
                        onChange={() => setDataSidebarBg("sidebarbg3")}
                      />
                      <label htmlFor="sidebarBg3" className="d-block rounded">
                        <img
                          src="assets/img/theme/sidebar-bg-03.svg"
                          alt="img"
                          className="rounded"
                        />
                      </label>
                    </div>
                    <div className="theme-sidebarbg me-3 mb-3">
                      <input
                        type="radio"
                        name="sidebarbg"
                        id="sidebarBg4"
                        defaultValue="sidebarbg4"
                        checked={dataSidebarBg === "sidebarbg4" ? true : false}
                        onChange={() => setDataSidebarBg("sidebarbg4")}
                      />
                      <label htmlFor="sidebarBg4" className="d-block rounded">
                        <img
                          src="assets/img/theme/sidebar-bg-04.svg"
                          alt="img"
                          className="rounded"
                        />
                      </label>
                    </div>
                    <div className="theme-sidebarbg me-3 mb-3">
                      <input
                        type="radio"
                        name="sidebarbg"
                        id="sidebarBg5"
                        defaultValue="sidebarbg5"
                        checked={dataSidebarBg === "sidebarbg5" ? true : false}
                        onChange={() => setDataSidebarBg("sidebarbg5")}
                      />
                      <label htmlFor="sidebarBg5" className="d-block rounded">
                        <img
                          src="assets/img/theme/sidebar-bg-05.svg"
                          alt="img"
                          className="rounded"
                        />
                      </label>
                    </div>
                    <div className="theme-sidebarbg me-3 mb-3">
                      <input
                        type="radio"
                        name="sidebarbg"
                        id="sidebarBg6"
                        defaultValue="sidebarBg6"
                        checked={dataSidebarBg === "sidebarBg6" ? true : false}
                        onChange={() => setDataSidebarBg("sidebarBg6")}
                      />
                      <label htmlFor="sidebarBg6" className="d-block rounded">
                        <img
                          src="assets/img/theme/sidebar-bg-06.svg"
                          alt="img"
                          className="rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item border px-3">
              <h2 className="accordion-header">
                <button
                  className="accordion-button text-dark fs-16 px-0 py-3 bg-transparent"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#sidebarcolor"
                  aria-expanded="true"
                >
                  Theme Colors
                </button>
              </h2>
              <div
                id="sidebarcolor"
                className="accordion-collapse collapse show"
              >
                <div className="accordion-body pb-2 px-0 py-3 border-top">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="primaryColor"
                        defaultValue="primary"
                        checked={dataColor === "primary" ? true : false}
                        onChange={() => setDataColor("primary")}
                      />
                      <label htmlFor="primaryColor" className="primary-clr" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="brightblueColor"
                        defaultValue="brightblue"
                        checked={dataColor === "brightblue" ? true : false}
                        onChange={() => setDataColor("brightblue")}
                      />
                      <label
                        htmlFor="brightblueColor"
                        className="theme-color-1"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="lunargreenColor"
                        defaultValue="lunargreen"
                        checked={dataColor === "lunargreen" ? true : false}
                        onChange={() => setDataColor("lunargreen")}
                      />
                      <label
                        htmlFor="lunargreenColor"
                        className="theme-color-2"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="lavendarColor"
                        defaultValue="lavendar"
                        checked={dataColor === "lavendar" ? true : false}
                        onChange={() => setDataColor("lavendar")}
                      />
                      <label
                        htmlFor="lavendarColor"
                        className="theme-color-3"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="magentaColor"
                        defaultValue="magenta"
                        checked={dataColor === "magenta" ? true : false}
                        onChange={() => setDataColor("magenta")}
                      />
                      <label htmlFor="magentaColor" className="theme-color-4" />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="chromeyellowColor"
                        defaultValue="chromeyellow"
                        checked={dataColor === "chromeyellow" ? true : false}
                        onChange={() => setDataColor("chromeyellow")}
                      />
                      <label
                        htmlFor="chromeyellowColor"
                        className="theme-color-5"
                      />
                    </div>
                    <div className="theme-colorsset me-2 mb-2">
                      <input
                        type="radio"
                        name="color"
                        id="orangeColor"
                        defaultValue="orange"
                        checked={dataColor === "orange" ? true : false}
                        onChange={() => setDataColor("orange")}
                      />
                      <label htmlFor="orangeColor" className="theme-color-6" />
                    </div>
                    <div
                      className={`theme-colorsset round-style select-theme-color position-relative  mb-2 ${
                        dataColor === "all" ? "active" : ""
                      }`}
                      onClick={() => setDataColor("all")}
                    >
                      <div className="select-color position-absolute">
                        <i className="ti ti-palette"></i>
                      </div>
                      <ColorPicker
                        format={formatRgb}
                        value={colorRgb4}
                        onChange={setColorRgb4}
                        onFormatChange={setFormatRgb}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 pt-0">
          <div className="row gx-3">
            <div className="col-6">
              <Link
                href="#"
                id="resetbutton"
                className="btn btn-light close-theme w-100"
                onClick={handleReset}
              >
                <i className="ti ti-restore me-1" />
                Reset
              </Link>
            </div>
            <div className="col-6">
              <Link
                href="#"
                className="btn btn-primary w-100"
                onClick={buyNow}
                data-bs-dismiss="offcanvas"
              >
                <i className="ti ti-shopping-cart-plus me-1" />
                Buy Product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemeSettings;
