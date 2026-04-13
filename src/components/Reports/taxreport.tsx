"use client";
import CommonFooter from "@/core/common/footer/commonFooter";
/* eslint-disable @next/next/no-img-element */

import  Table  from "@/core/common/pagination/datatable";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { taxreportdata } from "@/core/json/taxreport";
import { all_routes } from "@/data/all_routes";
import { DatePicker } from "antd";
import Link from "next/link";
import React from "react";
import Select from "react-select";

export default function  TaxReportComponent  () {
  const data = taxreportdata;

  const columns = [
    {
      title: "Reference",
      dataIndex: "Reference",
      render: (text:any) => (
        <Link href="#" className="text-orange">{text}</Link>
      ),
      sorter: (a:any, b:any) => a.Customer.length - b.Customer.length,
    },
    {
      title: "Supplier",
      dataIndex: "Supplier",
      sorter: (a:any, b:any) => a.Supplier.length - b.Supplier.length,
    },

    {
      title: "Date",
      dataIndex: "Date",
      sorter: (a:any, b:any) => a.Date.length - b.Date.length,
    },
    {
      title: "Store",
      dataIndex: "Store",
      sorter: (a:any, b:any) => a.Store.length - b.Store.length,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      sorter: (a:any, b:any) => a.Amount.length - b.Amount.length,
    },
    {
      title: "Payment Method",
      dataIndex: "Payment_Method",
      sorter: (a:any, b:any) => a.Payment_Method.length - b.Payment_Method.length,
    },
    {
      title: "Discount",
      dataIndex: "Discount",
      sorter: (a:any, b:any) => a.Discount.length - b.Discount.length,
    },
    {
      title: "Tax Amount",
      dataIndex: "Tax_Amount",
      sorter: (a:any, b:any) => a.Tax_Amount.length - b.Tax_Amount.length,
    },
  ];


  const Store = [
    { value: "All", label: "All" },
    { value: "Electro Mart", label: "Electro Mart" },
    { value: "Quantum Gadgets", label: "Quantum Gadgets" },
    { value: "Prime Bazaar", label: "Prime Bazaar" },
  ]
  const Supplier = [
    { value: "All", label: "All" },
    { value: "Apex Computers", label: "Apex Computers" },
    { value: "Beats Headphones", label: "Beats Headphones" },
    { value: "Dazzle Shoes", label: "Dazzle Shoes" },
  ]
  const Payment_Method = [
    { value: "All", label: "All" },
    { value: "Stripe", label: "Stripe" },
    { value: "Paypal", label: "Paypal" },
    { value: "Cash", label: "Cash" },
  ]

  const route = all_routes

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="table-tab">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <Link className="nav-link active" href={route.taxreport}>
                Purchase tax
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href={route.salereport}>
                Sales Tax
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Purchase Tax</h4>
                <h6>View Reports of Purchase Tax</h6>
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
                          <label className="form-label">Store</label>
                          <Select
                            classNamePrefix="react-select"
                            options={Store}
                            placeholder="Choose"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Supplier</label>
                          <Select
                            classNamePrefix="react-select"
                            options={Supplier}
                            placeholder="Choose"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <Select
                            classNamePrefix="react-select"
                            options={Payment_Method}
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
                <h4>Purchase Tax Report</h4>
              </div>
              <ul className="table-top-head">
                <TooltipIcons />
                <li>
                  <Link href="#" data-bs-toggle="tooltip" data-bs-placement="top" title="Print">
                    <i className="ti ti-printer" />
                  </Link>
                </li>
              </ul>
            </div>
            <div className="card-body">
              <div className="table-responsive custome-search">
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
};

