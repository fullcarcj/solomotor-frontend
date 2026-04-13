"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import { Category, products, SubCategory } from "@/core/common/selectOption/selectOption";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { OrdersData } from "@/core/json/ordersdata";
import { all_routes } from "@/data/all_routes";
import { Eye } from "react-feather";
import Link from "next/link";
import Select from "react-select";
import  Table  from "@/core/common/pagination/datatable";

export default function OrderComponents(){
    const route = all_routes;
    const data = OrdersData;

    const columns = [
        {
          title: "Order ID",
          dataIndex: "Order_ID",
          sorter: (a:any, b:any) => a.Order_ID.length - b.Order_ID.length,
        },
        {
          title: "Customer",
          dataIndex: "Customer",
          render: (text:any, render:any) => (
            <div className="d-flex align-items-center">
              <Link href="#" className="avatar avatar-md">
                <img src={render.image} alt="product" />
              </Link>
              <Link href="#">{text}</Link>
            </div>
    
          ),
          sorter: (a:any, b:any) => a.Customer.length - b.Customer.length,
        },
    
        {
          title: "Payment Type",
          dataIndex: "Payment_Type",
          sorter: (a:any, b:any) => a.Payment_Type.length - b.Payment_Type.length,
        },
    
        {
          title: "Amount",
          dataIndex: "Amount",
          sorter: (a:any, b:any) => a.Amount.length - b.Amount.length,
        },
    
        {
          title: "Date & Time",
          dataIndex: "Date_Time",
          sorter: (a:any, b:any) => a.Date_Time.length - b.Date_Time.length,
        },
        {
          title: "Status",
          dataIndex: "Status",
          render: (text:any) => (
            <>
              <span className={` ${text === 'Completed' ? 'bg-success' : text === 'Pending' ? 'bg-cyan' : 'bg-purple'} fs-10 text-white p-1 rounded`}>
                <i className="ti ti-point-filled me-1" />
                {text}
              </span>
    
            </>
          ),
          sorter: (a:any, b:any) => a.Status.length - b.Status.length,
        },
    
        {
          title: "",
          dataIndex: "action",
          render: () => (
            <div className="edit-delete-action d-flex align-items-center">
              <Link
                className="me-2 edit-icon p-2 border d-flex align-items-center rounded"
                href={route.invoicedetails}
              >
                <Eye className="action-eye" />
              </Link>
              <Link
                className="me-2 p-2 d-flex align-items-center border rounded"
                href={route.editproduct}
              >
                <i data-feather="edit" className="feather-edit" />
              </Link>
              <Link
                className="p-2 d-flex align-items-center border rounded"
                href="#"
                data-bs-toggle="modal"
                data-bs-target="#delete"
              >
                <i data-feather="trash-2" className="feather-trash-2" />
              </Link>
            </div>
    
          ),
          sorter: (a:any, b:any) => a.action.length - b.action.length,
        },
      ];
    return(
        <div>
        <div className="page-wrapper">
          <div className="content">
            <div className="page-header">
              <div className="add-item d-flex">
                <div className="page-title">
                  <h4 className="fw-bold">Order List</h4>
                  <h6>Manage your orders</h6>
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
                      Product
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Lenovo IdeaPad 3
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Beats Pro{" "}
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Nike Jordan
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Apple Series 5 Watch
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
                      Created By
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          James Kirwin
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Francis Chang
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Antonio Engle
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Leo Kelly
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
                      Category
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Computers
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Electronics
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Shoe
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Electronics
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
                      Brand
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Lenovo
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Beats
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Nike
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="#"
                          className="dropdown-item rounded-1"
                        >
                          Apple
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
                <div className=" table-responsive">
                  <Table columns={columns} dataSource={data} />
                </div>
              </div>
            </div>
            {/* /product list */}
          </div>
          <CommonFooter />
        </div>
        <>
          {/* Import Product */}
          <div className="modal fade" id="view-notes">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="page-wrapper-new p-0">
                  <div className="content">
                    <div className="modal-header">
                      <div className="page-title">
                        <h4>Import Product</h4>
                      </div>
                      <button
                        type="button"
                        className="close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <form>
                        <div className="modal-top">
                          <div className="row">
                            <div className="col-12">
                              <div className="input-blocks">
                                <label>
                                  Product<span className="ms-1 text-danger">*</span>
                                </label>
                                <Select
                                  classNamePrefix="react-select"
                                  options={products}
                                  placeholder="Choose"
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="input-blocks">
                                <label>
                                  Category<span className="ms-1 text-danger">*</span>
                                </label>
                                <Select
                                  classNamePrefix="react-select"
                                  options={Category}
                                  placeholder="Choose"
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="input-blocks">
                                <label>
                                  Sub Category
                                  <span className="ms-1 text-danger">*</span>
                                </label>
                                <Select
                                  classNamePrefix="react-select"
                                  options={SubCategory}
                                  placeholder="Choose"
                                />
                              </div>
                            </div>
                            <div className="col-lg-12 col-sm-6 col-12">
                              <div className="row">
                                <div>
                                  <div className="modal-footer-btn download-file">
                                    <Link
                                      href="#"
                                      className="btn btn-submit"
                                    >
                                      Download Sample File
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="input-blocks image-upload-down">
                                <label> Upload CSV File</label>
                                <div className="image-upload download">
                                  <input type="file" />
                                  <div className="image-uploads">
                                    <img src="assets/img/download-img.png" alt="img" />
                                    <h4>
                                      Drag and drop a <span>file to upload</span>
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-12 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Created by<span className="ms-1 text-danger">*</span>
                                </label>
                                <input type="text" className="form-control" />
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="mb-3 input-blocks">
                                <label className="form-label">Description</label>
                                <textarea className="form-control" defaultValue={""} />
                                <p className="mt-1">Maximum 60 Characters</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-btns">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className="modal-footer-btn">
                                <button
                                  type="button"
                                  className="btn btn-cancel me-2 p-2 px-3"
                                  data-bs-dismiss="modal"
                                >
                                  Cancel
                                </button>
                                <Link
                                  href="submit"
                                  className="btn btn-submit p-2 px-3" data-bs-dismiss="modal"
                                >
                                  Submit
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Import Product */}
          {/* Delete */}
          <div className="modal fade modal-default" id="delete">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body p-0">
                  <div className="success-wrap text-center">
                    <form>
                      <div className="icon-success bg-danger-transparent text-danger mb-2">
                        <i className="ti ti-trash" />
                      </div>
                      <h3 className="mb-2">Delete Order</h3>
                      <p className="fs-16 mb-3">
                        Are you sure you want to delete order from order list?
                      </p>
                      <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-md btn-secondary"
                          data-bs-dismiss="modal"
                        >
                          No, Cancel
                        </button>
                        <Link href="#" className="btn btn-md btn-primary" data-bs-dismiss="modal">
                          Yes, Delete
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Delete */}
        </>
  
      </div>
    )
}