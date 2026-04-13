"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import { subscription_details } from "@/core/json/subscriptiondetails";
import Link from "next/link";
import Table from "@/core/common/pagination/datatable";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import PredefinedDateRanges from "@/core/common/daterangepicker/datePicker";
import React from "react";
import ReactApexChart from "react-apexcharts";
import TotaltransactionChart from "../charts/superAdmincharts/totaltransaction";
import ActivesubscriptionChart from "../charts/superAdmincharts/activeSubscription";
import ExpiredsubscriptionChart from "../charts/superAdmincharts/expiredSubscription";
import TotalsubscriptionChart from "../charts/superAdmincharts/totalSubscription";

export default function SubscriptionComponents() {
  const data = subscription_details;
  const columns = [
    {
      title: "Company Name",
      dataIndex: "CompanyName",
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link href="#" className="avatar avatar-md border rounded-circle">
            <img
              src={`assets/img/company/${record.Image}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link href="#">{record.CompanyName}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.CompanyName.length - b.CompanyName.length,
    },
    {
      title: "Plan",
      dataIndex: "Plan",
      sorter: (a: any, b: any) => a.Plan.length - b.Plan.length,
    },
    {
      title: "Billing Cycle",
      dataIndex: "BillCycle",
      render: (text: any, record: any) => <span>{record.BillCycle} Days</span>,
      sorter: (a: any, b: any) => a.BillCycle.length - b.BillCycle.length,
    },
    {
      title: "Payment Method",
      dataIndex: "PaymentMethod",
      sorter: (a: any, b: any) =>
        a.PaymentMethod.length - b.PaymentMethod.length,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      sorter: (a: any, b: any) => a.Amount.length - b.Amount.length,
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      sorter: (a: any, b: any) => a.CreatedDate.length - b.CreatedDate.length,
    },
    {
      title: "Expired On",
      dataIndex: "ExpiringDate",
      sorter: (a: any, b: any) => a.ExpiringDate.length - b.ExpiringDate.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: any) => (
        <span
          className={`badge ${
            text === "Paid" ? "badge-success" : "badge-danger"
          } d-inline-flex align-items-center badge-xs`}
        >
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: () => (
        <div className="action-icon d-inline-flex">
          <Link
            href="#"
            className="me-2 p-2 d-flex align-items-center border rounded"
            data-bs-toggle="modal"
            data-bs-target="#view_invoice"
          >
            <i className="ti ti-file-invoice" />
          </Link>
          <Link
            href="#"
            className="me-2 d-flex align-items-center border rounded p-2"
          >
            <i className="ti ti-download" />
          </Link>
          <Link
            href="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            className="d-flex align-items-center p-2 border rounded"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Subscriptions</h4>
                <h6>Manage your subscriptions</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>

          <div className="row">
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Total Transaction
                          </span>
                          <h5>$5,340</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <TotaltransactionChart />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Total Subscribers
                          </span>
                          <h5>600</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <TotalsubscriptionChart />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Active Subscribers
                          </span>
                          <h5>560</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ActivesubscriptionChart />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Expired Subscribers
                          </span>
                          <h5>40</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ExpiredsubscriptionChart />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Subscription List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                    <PredefinedDateRanges />
                    <span className="input-icon-addon">
                      <i className="ti ti-chevron-down" />
                    </span>
                  </div>
                </div>
                <div className="dropdown me-3">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Plan
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Advanced (Monthly)
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Basic (Yearly)
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Enterprise (Monthly)
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Paid
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Unpaid
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <Table dataSource={data} columns={columns} />
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
      {/* /Page Wrapper */}
      {/* View Invoice */}
      <div className="modal fade" id="view_invoice">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-body p-5">
              <div className="row justify-content-between align-items-center mb-3">
                <div className="col-md-6">
                  <div className="mb-4">
                    <img
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="logo"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className=" text-end mb-3">
                    <h5 className="text-dark mb-1">Invoice</h5>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-file-invoice me-1" />
                      INV0287
                    </p>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-calendar me-1" />
                      Issue date : 12 Sep 2024{" "}
                    </p>
                    <p className="fw-normal">
                      <i className="ti ti-calendar me-1" />
                      Due date : 12 Oct 2024{" "}
                    </p>
                  </div>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-7">
                  <p className="text-dark mb-2 fw-medium fs-16">
                    Invoice From :
                  </p>
                  <div>
                    <p className="mb-1">SmartHR</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">smarthr@example.com</p>
                  </div>
                </div>
                <div className="col-md-5">
                  <p className="text-dark mb-2 fw-medium fs-16">Invoice To :</p>
                  <div>
                    <p className="mb-1">BrightWave Innovations</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">michael@example.com</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="table-responsive mb-3">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Plan</th>
                        <th>Billing Cycle</th>
                        <th>Created Date</th>
                        <th>Expiring On</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Advanced (Monthly)</td>
                        <td>30 Days</td>
                        <td>12 Sep 2024</td>
                        <td>12 Oct 2024</td>
                        <td>$200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-4">
                  <div>
                    <h6 className="mb-4">Payment info:</h6>
                    <p className="mb-0">Credit Card - 123***********789</p>
                    <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                      <p className="mb-0">Amount</p>
                      <p className="text-dark fw-medium mb-2">$200.00</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Sub Total</p>
                    <p className="mb-2">$200.00</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Tax </p>
                    <p className="mb-2">$0.00</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Total</p>
                    <p className="text-dark fw-medium mb-2">$200.00</p>
                  </div>
                </div>
              </div>
              <div className="card border mb-0">
                <div className="card-body">
                  <p className="text-dark fw-medium mb-2">
                    Terms &amp; Conditions:
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline mb-2">
                    <i className="ti ti-point-filled text-primary me-1" />
                    All payments must be made according to the agreed schedule.
                    Late payments may incur additional fees.
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline">
                    <i className="ti ti-point-filled text-primary me-1" />
                    We are not liable for any indirect, incidental, or
                    consequential damages, including loss of profits, revenue,
                    or data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Invoice */}
      <>
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="avatar avatar-xl bg-danger-transparent rounded-circle text-danger mb-3">
                  <i className="ti ti-trash-x fs-36" />
                </span>
                <h4 className="mb-1">Confirm Delete</h4>
                <p className="mb-3">
                  You want to delete all the marked items, this cant be undone
                  once you delete.
                </p>
                <div className="d-flex justify-content-center">
                  <Link
                    href="#"
                    className="btn btn-secondary me-3"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    href="#"
                    className="btn btn-primary"
                    data-bs-dismiss="modal"
                  >
                    Yes, Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
      </>
    </>
  );
}
