"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import CommonDeleteModal from "@/core/common/modal/commonDeleteModal";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { invoicereportdata } from "@/core/json/invoicereportdata";
import { all_routes } from "@/data/all_routes";
import { Eye, Trash2 } from "react-feather";
import Link from "next/link";
import  Table  from "@/core/common/pagination/datatable";
export default function InvoiceComponent(){
    const data = invoicereportdata;
    const route = all_routes;
    const columns = [
      {
        title: "Invoice No",
        dataIndex: "invoiceno",
        render:(text:any) =>(
          <>
          <Link href={route.invoicedetails}>{text}</Link>
          </>
        ),
        sorter: (a:any, b:any) => a.invoiceno.length - b.invoiceno.length,
      },
  
      {
        title: "Customer",
        dataIndex: "customer",
        render: (text:any, render:any) => (
          <div className="d-flex align-items-center">
            <Link href="#" className="avatar avatar-md">
              <img src={`assets/img/users/${render.image}`} alt="product" />
            </Link>
            <Link href="#" className="ms-2">{text}</Link>
          </div>
  
        ),
        sorter: (a:any, b:any) => a.customer.length - b.customer.length,
      },
      {
        title: "Due Date",
        dataIndex: "duedate",
        sorter: (a:any, b:any) => a.duedate.length - b.duedate.length,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        sorter: (a:any, b:any) => a.amount.length - b.amount.length,
      },
      {
        title: "Paid",
        dataIndex: "paid",
        sorter: (a:any, b:any) => a.paid.length - b.paid.length,
      },
      {
        title: "Amount Due",
        dataIndex: "amountdue",
        sorter: (a:any, b:any) => a.amountdue.length - b.amountdue.length,
      },
  
      {
        title: "Status",
        dataIndex: "status",
        render: (text:any) => (
          <div>
            {text === "Paid" && (
              <span className="badge badge-soft-success badge-xs shadow-none"><i className="ti ti-point-filled me-1"></i>{text}</span>
            )}
            {text === "Unpaid" && (
              <span className="badge badge-soft-danger badge-xs shadow-none"><i className="ti ti-point-filled me-1"></i>{text}</span>
            )}
            {text === "Overdue" && (
              <span className="badge badge-soft-warning badge-xs shadow-none"><i className="ti ti-point-filled me-1"></i>{text}</span>
            )}
          </div>
        ),
        sorter: (a:any, b:any) => a.status.length - b.status.length,
      },
      {
        title: "",
        dataIndex: "action",
        render: () => (
          <div className="edit-delete-action d-flex align-items-center justify-content-center">
            <Link
              className="me-2 p-2 d-flex align-items-center justify-content-between border rounded"
              href={route.invoicedetails}
            >
              <Eye className="feather-eye" />
            </Link>
            <Link
              className="p-2 d-flex align-items-center justify-content-between border rounded"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
            >
              <Trash2 className="feather-trash-2" />
            </Link>
          </div>
  
        ),
        sorter: (a:any, b:any) => a.status.length - b.status.length,
      },
    ];
    return(
        <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="page-header">
              <div className="add-item d-flex">
                <div className="page-title">
                  <h4>Invoices </h4>
                  <h6>Manage your stock invoices</h6>
                </div>
              </div>
              <ul className="table-top-head">
                <TooltipIcons />
                <RefreshIcon />
                <CollapesIcon />
              </ul>
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
                      Status
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
                <div className=" table-responsive">
                  <Table columns={columns} dataSource={data} />
                </div>
              </div>
            </div>
            {/* /product list */}
          </div>
          <CommonFooter />
        </div>
  
        <CommonDeleteModal />
      </div>
    )
}