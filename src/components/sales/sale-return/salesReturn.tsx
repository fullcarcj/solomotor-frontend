"use client";
/* eslint-disable @next/next/no-img-element */

import CommonDeleteModal from "@/core/common/modal/commonDeleteModal";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { salersretrunsdata } from "@/core/json/salesreturn";
import Link from "next/link";
import  Table  from "@/core/common/pagination/datatable";
import AddSalesReturns from "@/core/modals/sales/addsalesreturns";
import EditSalesRetuens from "@/core/modals/sales/editsalesretuens";

export default function SalesReturnComponent(){
    const data = salersretrunsdata;


  const columns = [
    {
      title: "Product Name",
      dataIndex: "productname",
      render: (text:any, record:any) => (
        <div className="productimgname">
          <Link href="#" className="product-img" />
          <img alt="img" src={record.img} />
          <Link href="#" className="ms-2">
            {text}
          </Link>
        </div>
      ),
      sorter: (a:any, b:any) => a.productname.length - b.productname.length,
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a:any, b:any) => a.date.length - b.date.length,
    },
    {
      title: "Customer",
      dataIndex: "customer",
      render: (text:any,record:any) => (
        <>
          <div className="d-flex align-items-center">
            <Link href="#" className="avatar avatar-md me-2">
              <img src={record.customer_image} alt="product" />
            </Link>
            <a href="#">{text}</a>
          </div>

        </>
      ),
      sorter: (a:any, b:any) => a.customer.length - b.customer.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text:any) => (
        <div>
          {text === "Received" && (
            <span className="badge badge-success shadow-none">{text}</span>
          )}
          {text === "Pending" && (
            <span className="badge badge-cyan shadow-none">{text}</span>
          )}
          {text === "Ordered" && (
            <span className="badges bg-lightyellow">{text}</span>
          )}
        </div>
      ),
      sorter: (a:any, b:any) => a.status.length - b.status.length,
    },
    {
      title: "Grand Total ($)",
      dataIndex: "grandtotal",
      sorter: (a:any, b:any) => a.grandtotal.length - b.grandtotal.length,
    },
    {
      title: "Paid",
      dataIndex: "paid",
      sorter: (a:any, b:any) => a.paid.length - b.paid.length,
    },
    {
      title: "Due ($)",
      dataIndex: "due",
      sorter: (a:any, b:any) => a.due.length - b.due.length,
    },
    {
      title: "paymentstatus",
      dataIndex: "paymentstatus",
      render: (text:any) => (
        <div>
          {text === "Paid" && (
            <span className="badge badge-soft-success badge-xs shadow-none"><i className="ti ti-point-filled me2"></i>{text}</span>
          )}
          {text === "Unpaid" && (
            <span className="badge badge-soft-danger badge-xs shadow-none"><i className="ti ti-point-filled me2"></i>{text}</span>
          )}
          {text === "Partial" && (
            <span className="badge badge-soft-warning badge-xs shadow-none"><i className="ti ti-point-filled me2"></i>{text}</span>
          )}
        </div>
      ),
      sorter: (a:any, b:any) => a.paymentstatus.length - b.paymentstatus.length,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="me-2 p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-sales-new"
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link className="confirm-text p-2" href="#">
              <i
                data-feather="trash-2"
                className="feather-trash-2" data-bs-toggle="modal" data-bs-target="#delete-modal"
              ></i>
            </Link>
          </div>
        </div>
      ),
    },
  ];
    return(
        <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="page-header">
              <div className="add-item d-flex">
                <div className="page-title">
                  <h4>Sales Return</h4>
                  <h6>Manage your returns</h6>
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
                  <i className='ti ti-circle-plus me-1'></i>
                  Add Sales Return
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
                      Customer
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Carl Evans
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Minerva Rameriz
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Robert Lamon
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
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
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Completed
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
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
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Paid
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Unpaid
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
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
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Recently Added
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Ascending
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Desending
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Last Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Last 7 Days
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="custom-datatable-filter table-responsive">
                  <Table columns={columns} dataSource={data} />
                </div>
              </div>
            </div>
            {/* /product list */}
          </div>
          <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
            <p className="mb-0">2014 - 2026 © DreamsPOS. All Right Reserved</p>
            <p>
              Designed &amp; Developed By{" "}
              <Link href="#" className="text-primary">
                Dreams
              </Link>
            </p>
          </div>
        </div>
  
        <AddSalesReturns />
        <EditSalesRetuens />
        <CommonDeleteModal />
      </div>
    )
}