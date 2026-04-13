"use client";
/* eslint-disable @next/next/no-img-element */

import { customerreportdata } from "@/core/json/customerreportdata";
import { all_routes } from "@/data/all_routes";
import Link from "next/link";
import React from "react";
import Select from "react-select";
import Table from "@/core/common/pagination/datatable";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import { DatePicker } from "antd";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import CommonFooter from "@/core/common/footer/commonFooter";

export default function CustomerReportComponent() {
  const data = customerreportdata;

  const route = all_routes;

  const columns = [
    {
      title: "Reference",
      dataIndex: "Reference",
      render: (text: any) => (
        <Link href="#" className="text-orange">
          {text}
        </Link>
      ),
      sorter: (a: any, b: any) => a.Reference.length - b.Reference.length,
    },
    {
      title: "Code",
      dataIndex: "Code",
      sorter: (a: any, b: any) => a.Code.length - b.Code.length,
    },

    {
      title: "Customer",
      dataIndex: "Customer",
      render: (text: any, record: any) => (
        <>
          <div className="d-flex align-items-center">
            <Link href="#" className="avatar avatar-md">
              <img src={record.image} className="img-fluid" alt="img" />
            </Link>
            <div className="ms-2">
              <p className="text-dark mb-0">
                <Link href="#">{text}</Link>
              </p>
            </div>
          </div>
        </>
      ),
      sorter: (a: any, b: any) => a.Customer.length - b.Customer.length,
    },

    {
      title: "Total Orders",
      dataIndex: "Total_Orders",
      sorter: (a: any, b: any) => a.Total_Orders.length - b.Total_Orders.length,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      sorter: (a: any, b: any) => a.Amount.length - b.Amount.length,
    },

    {
      title: "Payment Method",
      dataIndex: "Payment_Method",
      sorter: (a: any, b: any) =>
        a.Payment_Method.length - b.Payment_Method.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: any) => (
        <span
          className={`badge ${
            text === "Completed" ? "badge-success" : "badge-danger"
          } d-inline-flex align-items-center badge-xs`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
  ];

  const Customer = [
    { value: "All", label: "All" },
    { value: "Carl Evans", label: "Carl Evans" },
    { value: "Minerva Rameriz", label: "Minerva Rameriz" },
    { value: "Robert Lamon", label: "Robert Lamon" },
  ];
  const PaymentMethod = [
    { value: "All", label: "All" },
    { value: "Cash", label: "Cash" },
    { value: "Paypal", label: "Paypal" },
    { value: "Stripe", label: "Stripe" },
  ];
  const PaymentStatus = [
    { value: "All", label: "All" },
    { value: "Completed", label: "Completed" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Paid", label: "Paid" },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="table-tab">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <Link className="nav-link active" href={route.customerreport}>
                Customer Report
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href={route.customerduereport}>
                Customer Due
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Customer Report</h4>
                <h6>View Reports of Customer</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <div className="card border-0">
            <div className="card-body pb-1">
              <form>
                <div className="row align-items-end">
                  <div className="col-lg-10">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Choose Date</label>
                          <div className="input-icon-start position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              placeholder="dd/mm/yyyy"
                            />
                            <span className="input-icon-left">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Customer</label>
                          <Select
                            classNamePrefix="react-select"
                            options={Customer}
                            placeholder="Choose"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <Select
                            classNamePrefix="react-select"
                            options={PaymentMethod}
                            placeholder="Choose"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Payment Status</label>
                          <Select
                            classNamePrefix="react-select"
                            options={PaymentStatus}
                            placeholder="Choose"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="mb-3">
                      <button className="btn btn-primary w-100" type="submit">
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card no-search">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div>
                <h4>Customer Report</h4>
              </div>
              <ul className="table-top-head">
                <TooltipIcons />
                <li>
                  <a
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Print"
                  >
                    <i className="ti ti-printer" />
                  </a>
                </li>
              </ul>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <Table columns={columns} dataSource={data} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      <CommonFooter />
    </div>
  );
}
