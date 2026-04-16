"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import React, { useState } from "react";


const CollapsedSidebar = () => {
  const [isActive, setIsActive] = useState(false);
  const [isActive2, setIsActive2] = useState(false);
  const [isActive3, setIsActive3] = useState(false);
  const [isActive4, setIsActive4] = useState(false);
  const [isActive5, setIsActive5] = useState(false);
  const [isActive6, setIsActive6] = useState(false);
  const [isActive7, setIsActive7] = useState(false);
  const [isActive8, setIsActive8] = useState(false);

  const handleSelectClick = () => {
    setIsActive(!isActive);
  };
  const handleSelectClick2 = () => {
    setIsActive2(!isActive2);
  };
  const handleSelectClick3 = () => {
    setIsActive3(!isActive3);
  };
  const handleSelectClick4 = () => {
    setIsActive4(!isActive4);
  };
  const handleSelectClick5 = () => {
    setIsActive5(!isActive5);
  };
  const handleSelectClick6 = () => {
    setIsActive6(!isActive6);
  };
  const handleSelectClick7 = () => {
    setIsActive7(!isActive7);
  };
  const handleSelectClick8 = () => {
    setIsActive8(!isActive8);
  };

  return (
    <div className="sidebar collapsed-sidebar" id="collapsed-sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu-2" className="sidebar-menu sidebar-menu-three">
          <aside id="aside" className="ui-aside">
            <ul className="tab nav nav-tabs" id="myTab" role="tablist">
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#home"
                  id="home-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#home"
                  role="tab"
                  aria-selected="true"
                >
                  <img src="assets/img/icons/menu-icon.svg" alt="img" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#messages"
                  id="messages-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#product"
                  role="tab"
                  aria-selected="false"
                >
                  <img src="assets/img/icons/product.svg" alt="img" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#profile"
                  id="profile-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#sales"
                  role="tab"
                  aria-selected="false"
                >
                  <img src="assets/img/icons/sales1.svg" alt="image" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#reports"
                  id="report-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#purchase"
                  role="tab"
                  aria-selected="true"
                >
                  <img src="assets/img/icons/purchase1.svg" alt="image" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#set"
                  id="set-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#user"
                  role="tab"
                  aria-selected="true"
                >
                  <img src="assets/img/icons/users1.svg" alt="image" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#set2"
                  id="set-tab2"
                  data-bs-toggle="tab"
                  data-bs-target="#employee"
                  role="tab"
                  aria-selected="true"
                >
                  <img src="assets/img/icons/calendars.svg" alt="image" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link active"
                  href="#set3"
                  id="set-tab3"
                  data-bs-toggle="tab"
                  data-bs-target="#report"
                  role="tab"
                  aria-selected="true"
                >
                  <img src="assets/img/icons/printer.svg" alt="" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#set4"
                  id="set-tab4"
                  data-bs-toggle="tab"
                  data-bs-target="#document"
                  role="tab"
                  aria-selected="true"
                >
                  <i data-feather="user" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#set5"
                  id="set-tab6"
                  data-bs-toggle="tab"
                  data-bs-target="#permission"
                  role="tab"
                  aria-selected="true"
                >
                  <i data-feather="file-text" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  href="#set6"
                  id="set-tab5"
                  data-bs-toggle="tab"
                  data-bs-target="#settings"
                  role="tab"
                  aria-selected="true"
                >
                  <i data-feather="settings" />
                </Link>
              </li>
            </ul>
          </aside>
          <div className="tab-content tab-content-four pt-2">
            <ul className="tab-pane" id="home" aria-labelledby="home-tab">
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick}
                  className={isActive ? "subdrop" : ""}
                >
                  <span>Dashboard</span> <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive ? "block" : "none" }}>
                  <li>
                    <Link href="/admin-dashboard">Admin Dashboard</Link>
                  </li>
                  <li>
                    <Link href="sales-dashboard">Sales Dashboard</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick2}
                  className={isActive2 ? "subdrop" : ""}
                >
                  <span>Application</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive2 ? "block" : "none" }}>
                  <li>
                    <Link href="chat">Chat</Link>
                  </li>
                  <li className="submenu submenu-two">
                    <Link
                      href="#"
                      onClick={handleSelectClick7}
                      className={isActive7 ? "subdrop" : ""}
                    >
                      <span>Call</span>
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul style={{ display: isActive7 ? "block" : "none" }}>
                      <li>
                        <Link href="video-call">Video Call</Link>
                      </li>
                      <li>
                        <Link href="audio-call">Audio Call</Link>
                      </li>
                      <li>
                        <Link href="call-history">Call History</Link>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <Link href="calendar">Calendar</Link>
                  </li>
                  <li>
                    <Link href="email">Email</Link>
                  </li>
                  <li>
                    <Link href="todo">To Do</Link>
                  </li>
                  <li>
                    <Link href="notes">Notes</Link>
                  </li>
                  <li>
                    <Link href="file-manager">File Manager</Link>
                  </li>
                </ul>
              </li>
            </ul>
            <ul
              className="tab-pane"
              id="product"
              aria-labelledby="messages-tab"
            >
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick8}
                  className={isActive8 ? "subdrop" : ""}
                  aria-expanded={isActive8}
                >
                  <span>Inventory</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive8 ? "block" : "none" }}>
                  <li>
                    <Link href="product-list">
                      <span>Products</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="add-product">
                      <span>Create Product</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="expired-products">
                      <span>Expired Products</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="low-stocks">
                      <span>Low Stocks</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="category-list">
                      <span>Category</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="sub-categories">
                      <span>Sub Category</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="brand-list">
                      <span>Brands</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="units">
                      <span>Units</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="varriant-attributes">
                      <span>Variant Attributes</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="warranty">
                      <span>Warranties</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="barcode">
                      <span>Print Barcode</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="qrcode">
                      <span>Print QR Code</span>
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
            <ul className="tab-pane" id="sales" aria-labelledby="profile-tab">
              <li>
                <Link href="sales-list">
                  <span>Sales</span>
                </Link>
              </li>
              <li>
                <Link href="invoice-report">
                  <span>Invoices</span>
                </Link>
              </li>
              <li>
                <Link href="sales-returns">
                  <span>Sales Return</span>
                </Link>
              </li>
              <li>
                <Link href="quotation-list">
                  <span>Quotation</span>
                </Link>
              </li>
              <li>
                <Link href="pos">
                  <span>POS</span>
                </Link>
              </li>
              <li>
                <Link
                  href="https://dreamspos.dreamstechnologies.com/food-pos/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>POS 6</span>
                </Link>
              </li>
              <li>
                <Link href="coupons">
                  <span>Coupons</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="purchase" aria-labelledby="report-tab">
              <li>
                <Link href="purchase-list">
                  <span>Purchases</span>
                </Link>
              </li>
              <li>
                <Link href="purchase-order-report">
                  <span>Purchase Order</span>
                </Link>
              </li>
              <li>
                <Link href="purchase-returns">
                  <span>Purchase Return</span>
                </Link>
              </li>
              <li>
                <Link href="manage-stocks">
                  <span>Manage Stock</span>
                </Link>
              </li>
              <li>
                <Link href="stock-adjustment">
                  <span>Stock Adjustment</span>
                </Link>
              </li>
              <li>
                <Link href="stock-transfer">
                  <span>Stock Transfer</span>
                </Link>
              </li>
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick3}
                  className={isActive3 ? "subdrop" : ""}
                >
                  <span>Expenses</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive3 ? "block" : "none" }}>
                  <li>
                    <Link href="expense-list">Expenses</Link>
                  </li>
                  <li>
                    <Link href="expense-category">Expense Category</Link>
                  </li>
                </ul>
              </li>
            </ul>
            <ul className="tab-pane" id="user" aria-labelledby="set-tab">
              <li>
                <Link href="customers">
                  <span>Customers</span>
                </Link>
              </li>
              <li>
                <Link href="suppliers">
                  <span>Suppliers</span>
                </Link>
              </li>
              <li>
                <Link href="store-list">
                  <span>Stores</span>
                </Link>
              </li>
              <li>
                <Link href="warehouse">
                  <span>Warehouses</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="employee" aria-labelledby="set-tab2">
              <li>
                <Link href="employees-grid">
                  <span>Employees</span>
                </Link>
              </li>
              <li>
                <Link href="department-grid">
                  <span>Departments</span>
                </Link>
              </li>
              <li>
                <Link href="designation">
                  <span>Designation</span>
                </Link>
              </li>
              <li>
                <Link href="shift">
                  <span>Shifts</span>
                </Link>
              </li>
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick4}
                  className={isActive4 ? "subdrop" : ""}
                >
                  <span>Attendence</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive4 ? "block" : "none" }}>
                  <li>
                    <Link href="attendance-employee">Employee Attendence</Link>
                  </li>
                  <li>
                    <Link href="attendance-admin">Admin Attendence</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick5}
                  className={isActive5 ? "subdrop" : ""}
                >
                  <span>Leaves</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive5 ? "block" : "none" }}>
                  <li>
                    <Link href="leaves-admin">Admin Leaves</Link>
                  </li>
                  <li>
                    <Link href="leaves-employee">Employee Leaves</Link>
                  </li>
                  <li>
                    <Link href="leave-types">Leave Types</Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="holidays">
                  <span>Holidays</span>
                </Link>
              </li>
              <li className="submenu">
                <Link
                  href="#"
                  onClick={handleSelectClick6}
                  className={isActive6 ? "subdrop" : ""}
                >
                  <span>Payroll</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive6 ? "block" : "none" }}>
                  <li>
                    <Link href="payroll-list">Employee Salary</Link>
                  </li>
                  <li>
                    <Link href="payslip">Payslip</Link>
                  </li>
                </ul>
              </li>
            </ul>
            <ul
              className="tab-pane active"
              id="report"
              aria-labelledby="set-tab3"
            >
              <li>
                <Link href="sales-report">
                  <span>Sales Report</span>
                </Link>
              </li>
              <li>
                <Link href="purchase-report">
                  <span>Purchase report</span>
                </Link>
              </li>
              <li>
                <Link href="inventory-report">
                  <span>Inventory Report</span>
                </Link>
              </li>
              <li>
                <Link href="invoice-report">
                  <span>Invoice Report</span>
                </Link>
              </li>
              <li>
                <Link href="supplier-report">
                  <span>Supplier Report</span>
                </Link>
              </li>
              <li>
                <Link href="customer-report">
                  <span>Customer Report</span>
                </Link>
              </li>
              <li>
                <Link href="expense-report" className="active">
                  <span>Expense Report</span>
                </Link>
              </li>
              <li>
                <Link href="income-report">
                  <span>Income Report</span>
                </Link>
              </li>
              <li>
                <Link href="tax-report">
                  <span>Tax Report</span>
                </Link>
              </li>
              <li>
                <Link href="profit-and-loss">
                  <span>Profit &amp; Loss</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="permission" aria-labelledby="set-tab4">
              <li>
                <Link href="users">
                  <span>Users</span>
                </Link>
              </li>
              <li>
                <Link href="roles-permissions">
                  <span>Roles &amp; Permissions</span>
                </Link>
              </li>
              <li>
                <Link href="delete-account">
                  <span>Delete Account Request</span>
                </Link>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Base UI</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="ui-alerts">Alerts</Link>
                  </li>
                  <li>
                    <Link href="ui-accordion">Accordion</Link>
                  </li>
                  <li>
                    <Link href="ui-avatar">Avatar</Link>
                  </li>
                  <li>
                    <Link href="ui-badges">Badges</Link>
                  </li>
                  <li>
                    <Link href="ui-borders">Border</Link>
                  </li>
                  <li>
                    <Link href="ui-buttons">Buttons</Link>
                  </li>
                  <li>
                    <Link href="ui-buttons-group">Button Group</Link>
                  </li>
                  <li>
                    <Link href="ui-breadcrumb">Breadcrumb</Link>
                  </li>
                  <li>
                    <Link href="ui-cards">Card</Link>
                  </li>
                  <li>
                    <Link href="ui-carousel">Carousel</Link>
                  </li>
                  <li>
                    <Link href="ui-colors">Colors</Link>
                  </li>
                  <li>
                    <Link href="ui-dropdowns">Dropdowns</Link>
                  </li>
                  <li>
                    <Link href="ui-grid">Grid</Link>
                  </li>
                  <li>
                    <Link href="ui-images">Images</Link>
                  </li>
                  <li>
                    <Link href="ui-lightbox">Lightbox</Link>
                  </li>
                  <li>
                    <Link href="ui-media">Media</Link>
                  </li>
                  <li>
                    <Link href="ui-modals">Modals</Link>
                  </li>
                  <li>
                    <Link href="ui-offcanvas">Offcanvas</Link>
                  </li>
                  <li>
                    <Link href="ui-pagination">Pagination</Link>
                  </li>
                  <li>
                    <Link href="ui-popovers">Popovers</Link>
                  </li>
                  <li>
                    <Link href="ui-progress">Progress</Link>
                  </li>
                  <li>
                    <Link href="ui-placeholders">Placeholders</Link>
                  </li>
                  <li>
                    <Link href="ui-rangeslider">Range Slider</Link>
                  </li>
                  <li>
                    <Link href="ui-spinner">Spinner</Link>
                  </li>
                  <li>
                    <Link href="ui-sweetalerts">Sweet Alerts</Link>
                  </li>
                  <li>
                    <Link href="ui-nav-tabs">Tabs</Link>
                  </li>
                  <li>
                    <Link href="ui-toasts">Toasts</Link>
                  </li>
                  <li>
                    <Link href="ui-tooltips">Tooltips</Link>
                  </li>
                  <li>
                    <Link href="ui-typography">Typography</Link>
                  </li>
                  <li>
                    <Link href="ui-video">Video</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Advanced UI</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="ui-ribbon">Ribbon</Link>
                  </li>
                  <li>
                    <Link href="ui-clipboard">Clipboard</Link>
                  </li>
                  <li>
                    <Link href="ui-drag-drop">Drag &amp; Drop</Link>
                  </li>
                  <li>
                    <Link href="ui-rangeslider">Range Slider</Link>
                  </li>
                  <li>
                    <Link href="ui-rating">Rating</Link>
                  </li>
                  <li>
                    <Link href="ui-text-editor">Text Editor</Link>
                  </li>
                  <li>
                    <Link href="ui-counter">Counter</Link>
                  </li>
                  <li>
                    <Link href="ui-scrollbar">Scrollbar</Link>
                  </li>
                  <li>
                    <Link href="ui-stickynote">Sticky Note</Link>
                  </li>
                  <li>
                    <Link href="ui-timeline">Timeline</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Charts</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="chart-apex">Apex Charts</Link>
                  </li>
                  <li>
                    <Link href="chart-c3">Chart C3</Link>
                  </li>
                  <li>
                    <Link href="chart-js">Chart Js</Link>
                  </li>
                  <li>
                    <Link href="chart-morris">Morris Charts</Link>
                  </li>
                  <li>
                    <Link href="chart-flot">Flot Charts</Link>
                  </li>
                  <li>
                    <Link href="chart-peity">Peity Charts</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Icons</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="icon-fontawesome">Fontawesome Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-feather">Feather Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-ionic">Ionic Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-material">Material Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-pe7">Pe7 Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-simpleline">Simpleline Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-themify">Themify Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-weather">Weather Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-typicon">Typicon Icons</Link>
                  </li>
                  <li>
                    <Link href="icon-flag">Flag Icons</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Forms</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Form Elements
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="form-basic-inputs">Basic Inputs</Link>
                      </li>
                      <li>
                        <Link href="form-checkbox-radios">
                          Checkbox &amp; Radios
                        </Link>
                      </li>
                      <li>
                        <Link href="form-input-groups">Input Groups</Link>
                      </li>
                      <li>
                        <Link href="form-grid-gutters">Grid &amp; Gutters</Link>
                      </li>
                      <li>
                        <Link href="form-select">Form Select</Link>
                      </li>
                      <li>
                        <Link href="form-mask">Input Masks</Link>
                      </li>
                      <li>
                        <Link href="form-fileupload">File Uploads</Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Layouts
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="form-horizontal">Horizontal Form</Link>
                      </li>
                      <li>
                        <Link href="form-vertical">Vertical Form</Link>
                      </li>
                      <li>
                        <Link href="form-floating-labels">Floating Labels</Link>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <Link href="form-validation">Form Validation</Link>
                  </li>
                  <li>
                    <Link href="form-select2">Select2</Link>
                  </li>
                  <li>
                    <Link href="form-wizard">Form Wizard</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Tables</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="tables-basic">Basic Tables </Link>
                  </li>
                  <li>
                    <Link href="data-tables">Data Table </Link>
                  </li>
                </ul>
              </li>
            </ul>
            <ul className="tab-pane" id="document" aria-labelledby="set-tab5">
              <li>
                <Link href="profile">
                  <span>Profile</span>
                </Link>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Authentication</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Login
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="signin">Cover</Link>
                      </li>
                      <li>
                        <Link href="signin-2">Illustration</Link>
                      </li>
                      <li>
                        <Link href="signin-3">Basic</Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Register
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="register">Cover</Link>
                      </li>
                      <li>
                        <Link href="register-2">Illustration</Link>
                      </li>
                      <li>
                        <Link href="register-3">Basic</Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Forgot Password
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="forgot-password">Cover</Link>
                      </li>
                      <li>
                        <Link href="forgot-password-2">Illustration</Link>
                      </li>
                      <li>
                        <Link href="forgot-password-3">Basic</Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Reset Password
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="reset-password">Cover</Link>
                      </li>
                      <li>
                        <Link href="reset-password-2">Illustration</Link>
                      </li>
                      <li>
                        <Link href="reset-password-3">Basic</Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Email Verification
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="email-verification">Cover</Link>
                      </li>
                      <li>
                        <Link href="email-verification-2">Illustration</Link>
                      </li>
                      <li>
                        <Link href="email-verification-3">Basic</Link>
                      </li>
                    </ul>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      2 Step Verification
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="two-step-verification">Cover</Link>
                      </li>
                      <li>
                        <Link href="two-step-verification-2">Illustration</Link>
                      </li>
                      <li>
                        <Link href="two-step-verification-3">Basic</Link>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <Link href="lock-screen">Lock Screen</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Error Pages</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="error-404">404 Error </Link>
                  </li>
                  <li>
                    <Link href="error-500">500 Error </Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Places</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="countries">Countries</Link>
                  </li>
                  <li>
                    <Link href="states">States</Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="blank-page">
                  <span>Blank Page</span>{" "}
                </Link>
              </li>
              <li>
                <Link href="coming-soon">
                  <span>Coming Soon</span>{" "}
                </Link>
              </li>
              <li>
                <Link href="under-maintenance">
                  <span>Under Maintenance</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="settings" aria-labelledby="set-tab6">
              <li className="submenu">
                <Link href="#">
                  <span>General Settings</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="general-settings">Profile</Link>
                  </li>
                  <li>
                    <Link href="security-settings">Security</Link>
                  </li>
                  <li>
                    <Link href="notification">Notifications</Link>
                  </li>
                  <li>
                    <Link href="connected-apps">Connected Apps</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Website Settings</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="system-settings">System Settings</Link>
                  </li>
                  <li>
                    <Link href="company-settings">Company Settings </Link>
                  </li>
                  <li>
                    <Link href="localization-settings">Localization</Link>
                  </li>
                  <li>
                    <Link href="prefixes">Prefixes</Link>
                  </li>
                  <li>
                    <Link href="preference">Preference</Link>
                  </li>
                  <li>
                    <Link href="appearance">Appearance</Link>
                  </li>
                  <li>
                    <Link href="social-authentication">
                      Social Authentication
                    </Link>
                  </li>
                  <li>
                    <Link href="language-settings">Language</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>App Settings</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="invoice-settings">Invoice</Link>
                  </li>
                  <li>
                    <Link href="printer-settings">Printer</Link>
                  </li>
                  <li>
                    <Link href="pos-settings">POS</Link>
                  </li>
                  <li>
                    <Link href="custom-fields">Custom Fields</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>System Settings</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="email-settings">Email</Link>
                  </li>
                  <li>
                    <Link href="sms-gateway">SMS Gateways</Link>
                  </li>
                  <li>
                    <Link href="otp-settings">OTP</Link>
                  </li>
                  <li>
                    <Link href="gdpr-settings">GDPR Cookies</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Financial Settings</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="payment-gateway-settings">Payment Gateway</Link>
                  </li>
                  <li>
                    <Link href="bank-settings-grid">Bank Accounts</Link>
                  </li>
                  <li>
                    <Link href="tax-rates">Tax Rates</Link>
                  </li>
                  <li>
                    <Link href="currency-settings">Currencies</Link>
                  </li>
                  <li>
                    <Link href="/pricing-policies">Políticas de Precio</Link>
                  </li>
                  <li>
                    <Link href="/product-prices">Precios Calculados</Link>
                  </li>
                </ul>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Other Settings</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="storage-settings">Storage</Link>
                  </li>
                  <li>
                    <Link href="ban-ip-address">Ban IP Address</Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="https://dreamspos.dreamstechnologies.com/documentation/nextjs.html" target="_blank">
                  <span>Documentation</span>
                </Link>
              </li>
              <li>
                <Link href="https://dreamspos.dreamstechnologies.com/documentation/changelog.html" target="_blank">
                  <span>Changelog v2.2.5</span>
                </Link>
              </li>
              <li className="submenu">
                <Link href="#">
                  <span>Multi Level</span>
                  <span className="menu-arrow" />
                </Link>
                <ul>
                  <li>
                    <Link href="#">Level 1.1</Link>
                  </li>
                  <li className="submenu submenu-two">
                    <Link href="#">
                      Level 1.2
                      <span className="menu-arrow inside-submenu" />
                    </Link>
                    <ul>
                      <li>
                        <Link href="#">Level 2.1</Link>
                      </li>
                      <li className="submenu submenu-two submenu-three">
                        <Link href="#">
                          Level 2.2
                          <span className="menu-arrow inside-submenu inside-submenu-two" />
                        </Link>
                        <ul>
                          <li>
                            <Link href="#">Level 3.1</Link>
                          </li>
                          <li>
                            <Link href="#">Level 3.2</Link>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsedSidebar;
