"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { onlineOrderData } from "@/core/json/onlineOrderData";
import {
  DollarSign,
  Download,
  Edit,
  Eye,
  PlusCircle,
  Trash2,
} from "react-feather";
import Link from "next/link";
import Table from "@/core/common/pagination/datatable";
import OnlineorderModal from "./onlineorderModal";
import CommonDeleteModal from "@/core/common/modal/commonDeleteModal";

export default function OnlineOrdersComponent() {
  const dataSource = onlineOrderData;

  const columns = [
    {
      title: "Customer Name",
      dataIndex: "customer",
      render: (text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link href="#" className="avatar avatar-md">
            <img src={`assets/img/users/${render.image}`} alt="product" />
          </Link>
          <Link href="#">{text}</Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.customer.length - b.customer.length,
    },
    {
      title: "Reference",
      dataIndex: "reference",
      sorter: (a: any, b: any) => a.reference.length - b.reference.length,
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a: any, b: any) => a.date.length - b.date.length,
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (render: any) => (
        <span
          className={`badge ${
            render === "Pending"
              ? "badge-cyan"
              : render === "Completed"
              ? "badge-success"
              : ""
          } `}
        >
          {render}
        </span>
      ),
      sorter: (a: any, b: any) => a.status.length - b.status.length,
    },
    {
      title: "Grand Total",
      dataIndex: "total",

      sorter: (a: any, b: any) => a.total.length - b.total.length,
    },
    {
      title: "Paid",
      dataIndex: "paid",
      sorter: (a: any, b: any) => a.paid.length - b.paid.length,
    },
    {
      title: "Due",
      dataIndex: "due",
      sorter: (a: any, b: any) => a.due.length - b.due.length,
    },
    {
      title: "Payment Status",
      dataIndex: "paymentstatus",
      render: (render: any) => (
        <span
          className={`badge badge-xs shadow-none ${
            render === "Unpaid"
              ? "badge-soft-danger"
              : render === "Paid"
              ? "badge-soft-success"
              : "badge-soft-warning"
          } `}
        >
          <i className="ti ti-point-filled me-1"></i>
          {render}
        </span>
      ),
      sorter: (a: any, b: any) =>
        a.paymentstatus.length - b.paymentstatus.length,
    },
    {
      title: "Biller",
      dataIndex: "biller",
      sorter: (a: any, b: any) => a.biller.length - b.biller.length,
    },

    {
      title: "",
      dataIndex: "action",
      render: () => (
        <>
          <Link
            className="action-set"
            href="#"
            data-bs-toggle="dropdown"
            aria-expanded="true"
          >
            <i className="fa fa-ellipsis-v" aria-hidden="true" />
          </Link>
          <ul className="dropdown-menu">
            <li>
              <Link
                href="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#sales-details-new"
              >
                <Eye className="info-img" />
                Sale Detail
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#edit-sales-new"
              >
                <Edit className="info-img" />
                Edit Sale
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#showpayment"
              >
                <DollarSign size={14} className="info-img" />
                Show Payments
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#createpayment"
              >
                <PlusCircle size={14} className="info-img" />
                Create Payment
              </Link>
            </li>
            <li>
              <Link href="#" className="dropdown-item">
                <Download className="info-img" />
                Download pdf
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="dropdown-item mb-0"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
              >
                <Trash2 className="info-img" />
                Delete Sale
              </Link>
            </li>
          </ul>
        </>
      ),
      sorter: (a: any, b: any) => a.createdby.length - b.createdby.length,
    },
  ];
  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Sales</h4>
                <h6>Manage Your Sales</h6>
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
                data-bs-target="#add-sales-new"
              >
                <i className="ti ti-circle-plus me-1"></i> Add Sales
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card manage-stock">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set"></div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Customer
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Carl Evans
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Minerva Rameriz
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Robert Lamon
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Patricia Lewis
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
                    Staus
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Completed
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Pending
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
                    Payment Status
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
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Overdue
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
              <div className="custom-datatable-filter table-responsive">
                <Table columns={columns} dataSource={dataSource} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>
      <OnlineorderModal />
      <CommonDeleteModal />
    </div>
  );
}
