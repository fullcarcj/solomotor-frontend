"use client";
/* eslint-disable @next/next/no-img-element */

import { all_routes } from '@/data/all_routes';
import Link from 'next/link';
import React from 'react'


const TwoColumnSidebar = () => {

    const route = all_routes;

    return (
        <>
            {/* Two Col Sidebar */}
            <div className="two-col-sidebar" id="two-col-sidebar">
                <div className="sidebar sidebar-twocol">
                    <div className="twocol-mini">
                        <div className="sidebar-left slimscroll">
                            <div
                                className="nav flex-column align-items-center nav-pills"
                                id="sidebar-tabs"
                                role="tablist"
                                aria-orientation="vertical"
                            >
                                <Link
                                    href="#"
                                    className="nav-link active"
                                    title="Dashboard"
                                    data-bs-toggle="tab"
                                    data-bs-target="#dashboard"
                                >
                                    <i className="ti ti-smart-home" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link "
                                    title="Super Admin"
                                    data-bs-toggle="tab"
                                    data-bs-target="#super-admin"
                                >
                                    <i className="ti ti-user-star" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link "
                                    title="Apps"
                                    data-bs-toggle="tab"
                                    data-bs-target="#application"
                                >
                                    <i className="ti ti-layout-grid-add" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Layout"
                                    data-bs-toggle="tab"
                                    data-bs-target="#layout"
                                >
                                    <i className="ti ti-layout-board-split" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Inventory"
                                    data-bs-toggle="tab"
                                    data-bs-target="#inventory"
                                >
                                    <i className="ti ti-table-plus" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Stock"
                                    data-bs-toggle="tab"
                                    data-bs-target="#stock"
                                >
                                    <i className="ti ti-stack-3" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Sales"
                                    data-bs-toggle="tab"
                                    data-bs-target="#sales"
                                >
                                    <i className="ti ti-device-laptop" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Finance"
                                    data-bs-toggle="tab"
                                    data-bs-target="#finance"
                                >
                                    <i className="ti ti-shopping-cart-dollar" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Hrm"
                                    data-bs-toggle="tab"
                                    data-bs-target="#hrm"
                                >
                                    <i className="ti ti-cash" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Reports"
                                    data-bs-toggle="tab"
                                    data-bs-target="#reports"
                                >
                                    <i className="ti ti-license" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Pages"
                                    data-bs-toggle="tab"
                                    data-bs-target="#pages"
                                >
                                    <i className="ti ti-page-break" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Settings"
                                    data-bs-toggle="tab"
                                    data-bs-target="#settings"
                                >
                                    <i className="ti ti-lock-check" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link "
                                    title="UI Elements"
                                    data-bs-toggle="tab"
                                    data-bs-target="#ui-elements"
                                >
                                    <i className="ti ti-ux-circle" />
                                </Link>
                                <Link
                                    href="#"
                                    className="nav-link"
                                    title="Extras"
                                    data-bs-toggle="tab"
                                    data-bs-target="#extras"
                                >
                                    <i className="ti ti-vector-triangle" />
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-right">
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
                            </div>
                            {/* /Logo */}
                        </>

                        <div className="sidebar-scroll">
                            <div className="text-center rounded bg-light p-3 mb-3 user-profile">
                                <div className="avatar avatar-lg online mb-3">
                                    <img
                                        src="assets/img/customer/customer15.jpg"
                                        alt="Img"
                                        className="img-fluid rounded-circle"
                                    />
                                </div>
                                <h6 className="fs-12 fw-bold mb-1">Adrian Herman</h6>
                                <p className="fs-10 mb-0">System Admin</p>
                            </div>
                            <div className="tab-content" id="v-pills-tabContent">
                                <div className="tab-pane fade show active" id="dashboard">
                                    <ul>
                                        <li className="menu-title">
                                            <span>MAIN</span>
                                        </li>
                                        <li>
                                            <Link href={route.newdashboard} className="active">
                                                Admin Dashboard
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.salesdashboard}>Sales Dashboard</Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="super-admin">
                                    <ul>
                                        <li className="menu-title">
                                            <span>SUPER ADMIN</span>
                                        </li>
                                        <li>
                                            <Link href={route.superadmindashboard}>Dashboard</Link>
                                        </li>
                                        <li>
                                            <Link href={route.companies}>Companies</Link>
                                        </li>
                                        <li>
                                            <Link href={route.subscription}>Subscriptions</Link>
                                        </li>
                                        <li>
                                            <Link href={route.packagelist}>Packages</Link>
                                        </li>
                                        <li>
                                            <Link href={route.domain}>Domain</Link>
                                        </li>
                                        <li>
                                            <Link href={route.purchasetransaction}>Purchase Transaction</Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="application">
                                    <ul>
                                        <li>
                                            <Link href={all_routes.chat}>Chat</Link>
                                        </li>
                                        <li className="submenu submenu-two">
                                            <Link href="#">
                                                Call
                                                <span className="menu-arrow inside-submenu" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.videocall}>Video Call</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.audiocall}>Audio Call</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.callhistory}>Call History</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.calendars}>Calendar</Link>
                                        </li>
                                        {/* <li>
                                            <Link href="contacts.html">Contacts</Link>
                                        </li> */}
                                        <li>
                                            <Link href={route.email}>Email</Link>
                                        </li>
                                        <li>
                                            <Link href={route.todo}>To Do</Link>
                                        </li>
                                        <li>
                                            <Link href={route.notes}>Notes</Link>
                                        </li>
                                        <li>
                                            <Link href={route.filemanager}>File Manager</Link>
                                        </li>
                                        <li>
                                            <Link href={route.projects}>Projects</Link>
                                        </li>
                                        <li className="submenu submenu-two">
                                            <Link href="#">
                                                Ecommerce
                                                <span className="menu-arrow inside-submenu" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.product}>Products</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.orders}>Orders</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.customer}>Customers</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.cart}>Cart</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.checkout}>Checkout</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.wishlist}>Wishlist</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.reviews}>Reviews</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.SocialFeed}>Social Feed</Link>
                                        </li>
                                        <li>
                                            <Link href={route.searchlist}>Search List</Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="layout">
                                    <ul>
                                        <li className="menu-title">
                                            <span>LAYOUT</span>
                                        </li>
                                        <li>
                                            <Link href={all_routes.layoutHorizontal}>Horizontal</Link>
                                        </li>
                                        <li>
                                            <Link href={all_routes.layoutDetached}>Detached</Link>
                                        </li>
                                        {/* <li>
                                            <Link href="layout-modern.html">Modern</Link>
                                        </li> */}
                                        <li>
                                            <Link href={all_routes.layoutTwoColumn}>Two Column</Link>
                                        </li>
                                        <li>
                                            <Link href={all_routes.layoutHovered}>Hovered</Link>
                                        </li>
                                        <li>
                                            <Link href={all_routes.layoutBoxed}>Boxed</Link>
                                        </li>
                                        <li>
                                            <Link href={all_routes.layoutRtl}>RTL</Link>
                                        </li>
                                        <li>
                                            <Link href={all_routes.layoutDark}>Dark</Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="inventory">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Inventory</span>
                                        </li>
                                        <li>
                                            <Link href={route.productlist}>
                                                <span>Products</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.addproduct}>
                                                <span>Create Product</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.expiredproduct}>
                                                <span>Expired Products</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.lowstock}>
                                                <span>Low Stocks</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.categorylist}>
                                                <span>Category</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.subcategories}>
                                                <span>Sub Category</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.brandlist}>
                                                <span>Brands</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.units}>
                                                <span>Units</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.variantattributes}>
                                                <span>Variant Attributes</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.warranty}>
                                                <span>Warranties</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.barcode}>
                                                <span>Print Barcode</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.qrcode}>
                                                <span>Print QR Code</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="stock">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Stock</span>
                                        </li>
                                        <li>
                                            <Link href={route.managestock}>
                                                <span>Manage Stock</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.stockadjustment}>
                                                <span>Stock Adjustment</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.stocktransfer}>
                                                <span>Stock Transfer</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="sales">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Sales</span>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Sales</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.onlineorder}>Online Orders</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.posorder}>POS Orders</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.invoice}>
                                                <span>Invoices</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.salesreturn}>
                                                <span>Sales Return</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.quotationlist}>
                                                <span>Quotation</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>POS</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.pos}>POS 1</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.pos2}>POS 2</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.pos3}>POS 3</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.pos4}>POS 4</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.pos5}>POS 5</Link>
                                                </li>
                                                <li>
                                                    <Link
                                                      href="https://dreamspos.dreamstechnologies.com/food-pos/login"
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                    >
                                                      POS 6
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="finance">
                                    <ul>
                                        <li className="menu-title">
                                            <span>FINANCE &amp; ACCOUNTS</span>
                                        </li>
                                        <li>
                                            <Link href={route.coupons}>
                                                <span>Coupons</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.GiftCard}>
                                                <span>Gift Cards</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Discount</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.discountPlan}>Discount Plan</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.discount}>Discount</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.purchaselist}>
                                                <span>Purchases</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.purchaseorderreport}>
                                                <span>Purchase Order</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.purchasereturn}>
                                                <span>Purchase Return</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Expenses</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.expenselist}>Expenses</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.expensecategory}>Expense Category</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Income</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.incomelist}>Income</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.incomecategory}>Income Category</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.accountlist}>
                                                <span>Bank Accounts</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.moneytransfer}>
                                                <span>Money Transfer</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.balancesheet}>
                                                <span>Balance Sheet</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.trailbalance}>
                                                <span>Trial Balance</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.cashflow}>
                                                <span>Cash Flow</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.accountstatement}>
                                                <span>Account Statement</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.customer}>
                                                <span>Customers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.biller}>
                                                <span>Billers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.suppliers}>
                                                <span>Suppliers</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.storelist}>
                                                <span>Stores</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.warehouses}>
                                                <span>Warehouses</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="hrm">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Hrm</span>
                                        </li>
                                        <li>
                                            <Link href={route.employeegrid}>
                                                <span>Employees</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.departmentgrid}>
                                                <span>Departments</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.designation}>
                                                <span>Designation</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.shift}>
                                                <span>Shifts</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Attendence</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.attendanceemployee}>Employee</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.attendanceadmin}>Admin</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Leaves</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.leavesadmin}>Admin Leaves</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.leavesemployee}>Employee Leaves</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.leavestype}>Leave Types</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.holidays}>
                                                <span>Holidays</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Payroll</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.payrollList}>Employee Salary</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.payslip}>Payslip</Link>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="reports">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Reports</span>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Sales Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.salereport}>Sales Report</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.bestseller}>Best Seller</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.purchasereport}>
                                                <span>Purchase report</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Inventory Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.inventoryreport}>Inventory Report</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.stockhistory}>Stock History</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.soldstock}>Sold Stock</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.invoicereport}>
                                                <span>Invoice Report</span>
                                            </Link>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Supplier Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.supplierreport}>Supplier Report</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.supplierduereport}>Supplier Due Report</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Customer Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.customerreport}>Customer Report</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.customerduereport}>Customer Due Report</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Product Report</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.product}>Product Report</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.productexpiredreport}>
                                                        Product Expiry Report
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href={route.productquantityreport}>
                                                        Product Quantity Alert
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.expensereport}>
                                                <span>Expense Report</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.incomereport}>
                                                <span>Income Report</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.taxreport}>
                                                <span>Tax Report</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.profitloss}>
                                                <span>Profit &amp; Loss</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.annualreport}>
                                                <span>Annual Report</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="pages">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Pages</span>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Pages</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.pagesList}>Pages</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Blog</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.allBlogs}>All Blog</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.blogTag}>Blog Tags</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.categorylist}>Categories</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.blogComments}>Blog Comments</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Location</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.counter}>Countries</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.states}>States</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.cities}>Cities</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.testimonial}>
                                                <span>Testimonials</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.faq}>
                                                <span>FAQ</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.users}>
                                                <span>Users</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.rolespermission}>
                                                <span>Roles &amp; Permissions</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.deleteaccount}>
                                                <span>Delete Account Request</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.profile}>
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
                                                            <Link href={route.signin}>Cover</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.signintwo}>Illustration</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.signinthree}>Basic</Link>
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
                                                            <Link href={route.register}>Cover</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.registerTwo}>Illustration</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.registerThree}>Basic</Link>
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
                                                            <Link href={route.forgotPassword}>Cover</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.forgotPasswordTwo}>Illustration</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.forgotPasswordThree}>Basic</Link>
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
                                                            <Link href={route.resetpassword}>Cover</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.resetpasswordTwo}>Illustration</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.resetpasswordThree}>Basic</Link>
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
                                                            <Link href={route.emailverification}>Cover</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.emailverificationTwo}>Illustration</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.emailverificationThree}>Basic</Link>
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
                                                            <Link href={route.twostepverification}>Cover</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.twostepverificationTwo}>
                                                                Illustration
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.twostepverificationThree}>Basic</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <Link href={route.lockscreen}>Lock Screen</Link>
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
                                                    <Link href={route.error404}>404 Error </Link>
                                                </li>
                                                <li>
                                                    <Link href={route.error500}>500 Error </Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.blankpage}>
                                                <span>Blank Page</span>{" "}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.pricing}>
                                                <span>Pricing</span>{" "}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.comingsoon}>
                                                <span>Coming Soon</span>{" "}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={route.undermaintenance}>
                                                <span>Under Maintenance</span>{" "}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="settings">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Settings</span>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>General Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.generalsettings}>Profile</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.securitysettings}>Security</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.notification}>Notifications</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.connectedapps}>Connected Apps</Link>
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
                                                    <Link href={route.systemsettings}>System Settings</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.companysettings}>Company Settings </Link>
                                                </li>
                                                <li>
                                                    <Link href={route.localizationsettings}>Localization</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.prefixes}>Prefixes</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.preference}>Preference</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.appearance}>Appearance</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.socialauthendication}>
                                                        Social Authentication
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href={route.languagesettings}>Language</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>App Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li className="submenu submenu-two">
                                                    <Link href="#">
                                                        Invoice
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link href={route.invoicesettings}>Invoice Settings</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.invoice}>Invoice Template</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <Link href={route.printersettings}>Printer</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.possettings}>POS</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.customfields}>Custom Fields</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>System Settings</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li className="submenu submenu-two">
                                                    <Link href="#">
                                                        Email
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link href={route.emailsettings}>Email Settings</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.email}>Email Template</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li className="submenu submenu-two">
                                                    <Link href="#">
                                                        SMS
                                                        <span className="menu-arrow inside-submenu" />
                                                    </Link>
                                                    <ul>
                                                        <li>
                                                            <Link href={route.smssettings}>SMS Settings</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.smstemplate}>SMS Template</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <Link href={route.otpsettings}>OTP</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.gdbrsettings}>GDPR Cookies</Link>
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
                                                    <Link href={all_routes.paymentgateway}>
                                                        Payment Gateway
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href={route.banipaddress}>Bank Accounts</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.taxrates}>Tax Rates</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.currencysettings}>Currencies</Link>
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
                                                    <Link href={route.storagesettings}>Storage</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.banipaddress}>Ban IP Address</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href={route.signin}>
                                                <span>Logout</span>{" "}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="ui-elements">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Ui Interface</span>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Base UI</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.alerts}>Alerts</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.accordion}>Accordion</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.avatar}>Avatar</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.badges}>Badges</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.borders}>Border</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.buttons}>Buttons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.buttonsgroup}>Button Group</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.breadcrumb}>Breadcrumb</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.cards}>Card</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.carousel}>Carousel</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.colors}>Colors</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.dropdowns}>Dropdowns</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.grid}>Grid</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.images}>Images</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.lightbox}>Lightbox</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.media}>Media</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.modals}>Modals</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.offcanvas}>Offcanvas</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.pagination}>Pagination</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.popover}>Popovers</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.progress}>Progress</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.placeholder}>Placeholders</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.rangeslider}>Range Slider</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.spinner}>Spinner</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.sweetalerts}>Sweet Alerts</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.navtabs}>Tabs</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.toasts}>Toasts</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.tooltip}>Tooltips</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.typography}>Typography</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.video}>Video</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.Sortable}>Sortable</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.SwiperJs}>Swiperjs</Link>
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
                                                    <Link href={route.ribbon}>Ribbon</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.clipboard}>Clipboard</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.draganddrop}>Drag &amp; Drop</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.rangeslider}>Range Slider</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.rating}>Rating</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.texteditor}>Text Editor</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.counter}>Counter</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.scrollbar}>Scrollbar</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.stickynote}>Sticky Note</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.timeline}>Timeline</Link>
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
                                                    <Link href={route.apexchart}>Apex Charts</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.chartjs}>Chart Js</Link>
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
                                                    <Link href={route.fontawesome}>Fontawesome Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.feathericon}>Feather Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.ionicicons}>Ionic Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.materialicons}>Material Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.pe7icons}>Pe7 Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.simpleline}>Simpleline Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.themifyicons}>Themify Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.iconweather}>Weather Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.typicons}>Typicon Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.flagicons}>Flag Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.TablerIcon}>Tabler Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.BootstrapIcon}>Bootstrap Icons</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.remixIcon}>Remix Icons</Link>
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
                                                            <Link href={route.basicinput}>Basic Inputs</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.checkboxradio}>
                                                                Checkbox &amp; Radios
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.inputgroup}>Input Groups</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.gridgutters}>
                                                                Grid &amp; Gutters
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.formselect}>Form Select</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.inputgroup}>Input Masks</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.fileupload}>File Uploads</Link>
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
                                                            <Link href={route.formhorizontal}>Horizontal Form</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.formvertical}>Vertical Form</Link>
                                                        </li>
                                                        <li>
                                                            <Link href={route.floatinglabel}>
                                                                Floating Labels
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                                <li>
                                                    <Link href={route.formvalidation}>Form Validation</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.select2}>Select2</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.wizard}>Form Wizard</Link>
                                                </li>
                                                <li>
                                                    <Link href={route.FormPicker}>Form Picker</Link>
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
                                                    <Link href={route.tablebasic}>Basic Tables </Link>
                                                </li>
                                                <li>
                                                    <Link href={route.datatable}>Data Table </Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="submenu">
                                            <Link href="#">
                                                <span>Maps</span>
                                                <span className="menu-arrow" />
                                            </Link>
                                            <ul>
                                                <li>
                                                    <Link href={route.Leaflets}>Leaflet</Link>
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-pane fade" id="extras">
                                    <ul>
                                        <li className="menu-title">
                                            <span>Help</span>
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
                </div>
            </div>
            {/* /Two Col Sidebar */}
        </>

    )
}

export default TwoColumnSidebar