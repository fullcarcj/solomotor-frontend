"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Select from "react-select";
import { DatePicker } from "antd";
import { expenselist } from "@/core/json/expenselistdata";
import Link from "next/link";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import { Calendar, PlusCircle } from "react-feather";
import  Table  from "@/core/common/pagination/datatable";
import TextEditor from "@/core/common/texteditor/texteditor";


export default function ExpensesListComponent ()  {
  const data = expenselist;

  const columns = [
    {
      title: "Reference",
      dataIndex: "reference",
      sorter: (a:any, b:any) => a.description.length - b.description.length,
    },  
    {
      title: "CategoryName",
      dataIndex: "categoryName",
      sorter: (a:any, b:any) => a.categoryName.length - b.categoryName.length,
    },
    {
      title: "Description",
      dataIndex: "description",
      sorter: (a:any, b:any) => a.description.length - b.description.length,
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a:any, b:any) => a.date.length - b.date.length,
    },

    {
      title: "Amount",
      dataIndex: "amount",
      sorter: (a:any, b:any) => a.amount.length - b.amount.length,
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (text:any) => (
        <span
          className={`badges status-badge fs-10 p-1 px-2 rounded-1 ${
            text === "Approved" ? "" : "badge-pending"
          }`}
        >
          {text}
        </span>
      ),
      sorter: (a:any, b:any) => a.status.length - b.status.length,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link className="me-2 p-2 mb-0" href="#">
              <i data-feather="eye" className="feather-eye"></i>
           </Link>
            <Link
            href="#"
              className="me-2 p-2 mb-0"
              data-bs-toggle="modal"
              data-bs-target="#edit-units"
            >
              <i data-feather="edit" className="feather-edit"></i>
           </Link>
            <Link
              className="me-3 confirm-text p-2 mb-0"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
            >
              <i data-feather="trash-2" className="feather-trash-2"></i>
           </Link>
          </div>
        </div>
      ),
    },
  ];


  const options = [
    { value: "Active", label: "Approved" },
    { value: "InActive", label: "Pending" },
  ];
  const optionsModalOne = [
    { value: "choose", label: "Choose" },
    { value: "foodsSnacks", label: "Foods & Snacks" },
    { value: "employeeBenefits", label: "Employee Benefits" },
  ];



  
  return (
    <div>
       <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Expenses</h4>
              <h6>Manage your Expenses</h6>
            </div>
          </div>
          <ul className="table-top-head">
           
           <TooltipIcons/>
            <RefreshIcon/>
            <CollapesIcon/>
          </ul>
          <div className="page-btn">
            <Link href="#" data-bs-toggle="modal" data-bs-target="#add-units" className="btn btn-primary">
              <PlusCircle size={14} data-feather="plus-circle" className=" me-2" />
              Add Expenses
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
                Category
              </Link>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <Link href="#" className="dropdown-item rounded-1">
                    Utilities
                  </Link>
                </li>
                <li>
                  <Link href="#" className="dropdown-item rounded-1">
                    Office Supplies
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
                      Approved
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Pending
                    </Link>
                  </li>
                </ul>
              </div>
              
            </div>
          </div>
          <div className="card-body pb-0">
            <div className="table-responsive">
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
    

      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content p-5 px-3 text-center">
                <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                  <i className="ti ti-trash fs-24 text-danger" />
                </span>
                <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                Delete Expense
                </h4>
                <p className="text-gray-6 mb-0 fs-16">
                  Are you sure you want to delete employee?
                </p>
                <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    className="btn btn-submit fs-13 fw-medium p-2 px-3"
                  >
                    Yes Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    <>
  <div className="modal fade" id="add-units">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="page-wrapper-new p-0">
          <div className="content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Expense</h4>
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
              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Expense<span className="text-danger ms-1">*</span>
                    </label>
                    <input type="text" className="form-control" />
                  </div>
                </div>
                <div className="col-lg-12">
                  <div className="mb-3 summer-description-box">
                    <label className="form-label">Description</label>
                    <TextEditor/>
                    <p className="mt-1">Maximum 60 Words</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Category<span className="text-danger ms-1">*</span>
                    </label>
                    
                    <Select
                        classNamePrefix="react-select"
                        options={optionsModalOne}
                        placeholder="Choose"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <label className="form-label">
                    Date<span className="text-danger ms-1">*</span>
                  </label>
                  <div className="mb-3 date-group mt-0">
                    <div className="input-groupicon calender-input">
                      <Calendar className="info-img" />
                      <DatePicker
                        className="datetimepicker form-control p-2"
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Amount<span className="text-danger ms-1">*</span>
                    </label>
                    <input type="text" className="form-control" />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Status<span className="text-danger ms-1">*</span>
                    </label>
                    <Select
                        classNamePrefix="react-select"
                        options={options}
                        placeholder="Choose"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                data-bs-dismiss="modal"
                className="btn btn-primary fs-13 fw-medium p-2 px-3"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="modal fade" id="edit-units">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="page-wrapper-new p-0">
          <div className="content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Expense</h4>
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
              <div className="row">
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label">
                      Expense<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue="Electricity Payment"
                    />
                  </div>
                </div>
                <div className="col-lg-12 mb-3">
                  <div className="mb-3 summer-description-box">
                    <label className="form-label">Description</label>
                    <TextEditor/>
                    <p className="mt-1">Maximum 60 Words</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Category<span className="text-danger ms-1">*</span>
                    </label>
                    <Select
                        classNamePrefix="react-select"
                        options={optionsModalOne}
                        placeholder="Choose"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <label className="form-label">
                    Date<span className="text-danger ms-1">*</span>
                  </label>
                  <div className="mb-3 date-group mt-0">
                    <div className="input-groupicon calender-input">
                      <Calendar className="info-img " />
                      <DatePicker
                        className="datetimepicker form-control p-2"
                        placeholder="24 Dec 2024"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Amount<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue="$200"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Status<span className="text-danger ms-1">*</span>
                    </label>
                    <Select
                        classNamePrefix="react-select"
                        options={options}
                        placeholder="Choose"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                data-bs-dismiss="modal"
                className="btn btn-primary fs-13 fw-medium p-2 px-3"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</>

    </div>
  );
};


