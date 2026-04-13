"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import AddCoupons from "../../core/modals/coupons/addcoupons";
import EditCoupons from "../../core/modals/coupons/editcoupons";
import { CouponData } from "../../core/json/coupons";
import CommonFooter from "../../core/common/footer/commonFooter";
import Link from "next/link";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import  Table  from "@/core/common/pagination/datatable";


export default function CouponsComponent  ()  {
  const dataSource = CouponData;

  const columns = [
    {
      title: "Name",
      dataIndex: "Name",
      sorter: (a:any, b:any) => a.Name.length - b.Name.length,
    },
    {
      title: "Code",
      dataIndex: "Code",
      render: (text:any) => (
        <span className="badge purple-badge">{text}</span>
      ),
      sorter: (a:any, b:any) => a.Code.length - b.Code.length,
    },
    {
      title: "Description",
      dataIndex: "Description",
      sorter: (a:any, b:any) => a.Description.length - b.Description.length,
    },
    {
      title: "Type",
      dataIndex: "Type",
      sorter: (a:any, b:any) => a.Type.length - b.Type.length,
    },
    {
      title: "Discount",
      dataIndex: "Discount",
      sorter: (a:any, b:any) => a.Discount.length - b.Discount.length,
    },
    {
      title: "Limit",
      dataIndex: "Limit",
      sorter: (a:any, b:any) => a.Limit.length - b.Limit.length,
    },
    {
      title: "Valid",
      dataIndex: "Valid",
      sorter: (a:any, b:any) => a.Valid.length - b.Valid.length,
    },
    
    {
      title: "Status",
      dataIndex: "Status",
      render: (text:any) => (
        <span className={`badge table-badge ${text === 'Active' ? 'bg-success':'bg-danger'} fw-medium fs-10`}>
          {text}
        </span>
      ),
      sorter: (a:any, b:any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      key: "actions",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="me-2 p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-units"
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link data-bs-toggle="modal" data-bs-target="#delete-modal" className="p-2" href="#">
              <i
                data-feather="trash-2"
                className="feather-trash-2"
              ></i>
            </Link>
          </div>
        </div>
      ),
    },
  ];


  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Coupons</h4>
                <h6>Manage Your Coupons</h6>
              </div>
            </div>
            <ul className="table-top-head">
             <TooltipIcons />
             <RefreshIcon />
             <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                href="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-units"
              >
              <i className='ti ti-circle-plus me-1'></i>
                Add Coupons
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              
            </div>
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Type
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Fixed
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Percentage
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="dropdown me-2">
                <Link
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Active
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Inactive
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="dropdown">
                <Link
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
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

            <div className="card-body">
              
              <div className="table-responsive">
              <Table columns={columns} dataSource={dataSource} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      <CommonFooter/>
      </div>
      <AddCoupons />
      <EditCoupons />
    </div>
  );
};

