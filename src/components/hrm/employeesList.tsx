"use client";
/* eslint-disable @next/next/no-img-element */

import { employeeListData } from "@/core/json/employeeListData";
import { all_routes } from "@/data/all_routes";
import Link from "next/link";
import React from "react";
import  Table  from "@/core/common/pagination/datatable";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import { PlusCircle } from "react-feather";



export default function EmployeesListComponent () {
    const dataSource = employeeListData;

    const columns = [
      {
        title: "ID",
        dataIndex: "ID",
        render: (text:any) => (
            <Link href={all_routes.employeedetails}>{text}</Link>
          ),
        sorter: (a:any, b:any) => a.ID.length - b.ID.length,
      },
  
      {
        title: "Employee",
        dataIndex: "Employee",
        render: (text:any,data:any) => (
            <div className="d-flex align-items-center">
            <Link href={all_routes.employeedetails} className="avatar avatar-md">
              <img src={`assets/img/users/${data.img}`} className="img-fluid" alt="img" />
            </Link>
            <div className="ms-2">
              <p className="text-dark mb-0">
                <Link href={all_routes.employeedetails}>{text}</Link>
              </p>
            </div>
          </div>
          
          ),
        sorter: (a:any, b:any) => a.Employee.length - b.Employee.length,
      },
      {
        title: "Designation",
        dataIndex: "Designation",
        sorter: (a:any, b:any) => a.Designation.length - b.Designation.length,
      },
      {
        title: "Email",
        dataIndex: "Email",
        sorter: (a:any, b:any) => a.Email.length - b.Email.length,
      },
      {
        title: "Phone",
        dataIndex: "Phone",
        sorter: (a:any, b:any) => a.Phone.length - b.Phone.length,
      },
      {
        title: "Shift",
        dataIndex: "Shift",
        sorter: (a:any, b:any) => a.Shift.length - b.Shift.length,
      },
      {
        title: "Status",
        dataIndex: "Status",
        render: (text:any) => (
            <span className={`badge  ${text==='Active' ? 'badge-success':'badge-danger' } d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-point-filled me-1" />
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
            <div className="edit-delete-action d-flex align-items-center">
            <Link
              className="me-2 d-flex align-items-center border rounded p-2"
              href={all_routes.employeedetails}
            >
              <i data-feather="eye" className="feather-eye" />
            </Link>
            <Link
              className="me-2 p-2 d-flex align-items-center border rounded"
              href={all_routes.editemployee}
            >
              <i data-feather="edit" className="feather-edit" />
            </Link>
            <Link
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
              className="p-2 d-flex align-items-center border rounded"
              href="#"
            >
              <i data-feather="trash-2" className="feather-trash-2" />
            </Link>
          </div>
          
        ),
      },
    ];
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Employees</h4>
              <h6>Manage your employees</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <div className="d-flex me-2 pe-2 border-end">
                <Link href={all_routes.employeelist} className="btn-list active  bg-primary me-2">
                  <i data-feather="list" className="feather-list text-white" />
                </Link>
                <Link
                  href={all_routes.employeegrid}
                  className="btn-grid me-2"
                >
                  <i data-feather="grid" className="feather-grid " />
                </Link>
              </div>
            </li>
           <TooltipIcons/>
            <RefreshIcon/>
            <CollapesIcon/>
          </ul>
          <div className="page-btn">
            <Link href={all_routes.addemployee} className="btn btn-primary">
              <PlusCircle  size={14} data-feather="plus-circle" className=" me-2" />
              Add Employee
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-3 col-md-6">
            <div className="card bg-purple border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">Total Employee</p>
                  <h4 className="text-white">1007</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-purple-900">
                    <i className="ti ti-users-group" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-teal border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">Active</p>
                  <h4 className="text-white">1007</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-teal-900">
                    <i className="ti ti-user-star" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-secondary border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">Inactive</p>
                  <h4 className="text-white">1007</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-secondary-900">
                    <i className="ti ti-user-exclamation" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card bg-info border-0">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div>
                  <p className="mb-1 text-white">New Joiners</p>
                  <h4 className="text-white">67</h4>
                </div>
                <div>
                  <span className="avatar avatar-lg bg-info-900">
                    <i className="ti ti-user-check" />
                  </span>
                </div>
              </div>
            </div>
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
          Select Employees
        </Link>
        <ul className="dropdown-menu  dropdown-menu-end p-3">
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Anthony Lewis
            </Link>
          </li>
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Brian Villalobos
            </Link>
          </li>
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Harvey Smith
            </Link>
          </li>
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Stephan Peralt
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
          Designation
        </Link>
        <ul className="dropdown-menu  dropdown-menu-end p-3">
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              System Admin
            </Link>
          </li>
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Designer
            </Link>
          </li>
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Tech Lead
            </Link>
          </li>
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              Database administrator
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
          Select Status
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
          <li>
            <Link href="#" className="dropdown-item rounded-1">
              New Joiners
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
  <div className="card-body pb-0">
    <div className="custom-datatable-filter table-responsive">
    <Table columns={columns} dataSource={dataSource} />
    </div>
  </div>
</div>

        {/* /product list */}
        
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014-2025 © DreamsPOS. All Right Reserved</p>
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
            Delete Employee
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
  );
};

