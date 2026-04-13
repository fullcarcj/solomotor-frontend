"use client";
/* eslint-disable @next/next/no-img-element */

import React from 'react'
import  Table  from "@/core/common/pagination/datatable";
import Link from 'next/link';
import TooltipIcons from '@/core/common/tooltip-content/tooltipIcons';
import RefreshIcon from '@/core/common/tooltip-content/refresh';
import CollapesIcon from '@/core/common/tooltip-content/collapes';
import { PlusCircle } from "react-feather";
import { all_routes } from '@/data/all_routes';
export default function BlogCategoriesComponent ()  {
  const data = [
    {
      Category: "Evlovution",
      Created_Date: "12 Sep 2024",
      Status: "Active",
    },
    {
      Category: "Guide",
      Created_Date: "24 Oct 2024",
      Status: "Active",
    },
    {
      Category: "Security",
      Created_Date: "18 Feb 2024",
      Status: "Active",
    },
    {
      Category: "Recruitment",
      Created_Date: "17 Oct 2024",
      Status: "Active",
    },
    {
      Category: "Payroll",
      Created_Date: "20 Jul 2024",
      Status: "Active",
    },
    {
      Category: "Benefits",
      Created_Date: "10 Apr 2024",
      Status: "Active",
    },
    {
      Category: "Employee",
      Created_Date: "29 Aug 2024",
      Status: "Active",
    },
    {
      Category: "Onboarding",
      Created_Date: "22 Feb 2024",
      Status: "Active",
    },
    {
      Category: "Implementation",
      Created_Date: "03 Nov 2024",
      Status: "Active",
    },
    {
      Category: "Management",
      Created_Date: "17 Dec 2024",
      Status: "Active",
    },
  ];
  const columns = [
   

    {
      title: "Category",
      dataIndex: "Category",
      sorter: (a:any, b:any) => a.Category.length - b.Category.length,
    },
    {
      title: "Created Date",
      dataIndex: "Created_Date",
      sorter: (a:any, b:any) => a.Created_Date.length - b.Created_Date.length,
    },

   
    {
      title: "Status",
      dataIndex: "Status",
      render: () => (
        <>
          <span className={` badge badge-success d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-point-filled me-1" />
            Active
          </span>

        </>
      ),
      sorter: (a:any, b:any) => a.Status.length - b.Status.length,
    },

    {
      title: "",
      dataIndex: "action",
      render: () => (
        <div className="action-icon d-inline-flex">
          <Link
            href="#"
            className="p-2 d-flex align-items-center border rounded me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_blog-category"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            href="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            className="p-2 d-flex align-items-center border rounded"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>


      ),
      sorter: (a:any, b:any) => a.action.length - b.action.length,
    },
  ];
  return (
    <>
  <div className="page-wrapper">
    <div className="content">
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4>Blogs</h4>
            <h6>Manage your blogs</h6>
          </div>
        </div>
        <ul className="table-top-head">
          <TooltipIcons/>
          <RefreshIcon/>
          <CollapesIcon/>
        </ul>
        <div className="page-btn">
          <Link
            href="#"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#add_blog-category"
          >
            <PlusCircle size={14} data-feather="plus-circle" className="me-1" />
            Add Categories
          </Link>
        </div>
      </div>
      {/* /product list */}
      <div className="card table-list-card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="search-set">
            
          </div>
          <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
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
    <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
      <p className="mb-0 text-gray-9">
        2014 - 2026 © DreamsPOS. All Right Reserved
      </p>
      <p>
        Designed &amp; Developed By{" "}
        <Link href="#" className="text-primary">
          Dreams
        </Link>
      </p>
    </div>
  </div>
  {/* Add Tag */}
  <div className="modal fade" id="add_blog-category">
    <div className="modal-dialog modal-dialog-centered modal-md">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Add Category</h4>
          <button
            type="button"
            className="btn-close custom-btn-close p-0 p-0"
            data-bs-dismiss="modal"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <form >
          <div className="modal-body pb-0">
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">
                    Category<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    className="input-tags form-control"
                    type="text"
                    data-role="tagsinput"
                    name="Label"
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <label className="form-label">Status</label>
                  <label className="switch">
                    <input type="checkbox" checked />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary border me-2"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button type="button" data-bs-dismiss="modal" className="btn btn-primary">
              Add Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  {/* /Add Tag */}
  {/* Edit Tag */}
  <div className="modal fade" id="edit_blog-category">
    <div className="modal-dialog modal-dialog-centered modal-md">
      <div className="modal-content">
        <div className="modal-header">
          <h4 className="modal-title">Edit Category</h4>
          <button
            type="button"
            className="btn-close custom-btn-close p-0 p-0"
            data-bs-dismiss="modal"
            aria-label="Close"
          >
            <i className="ti ti-x" />
          </button>
        </div>
        <form >
          <div className="modal-body pb-0">
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">
                    Category<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    className="input-tags form-control"
                    type="text"
                    data-role="tagsinput"
                    name="Label"
                    defaultValue="Innovations"
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <label className="form-label">Status</label>
                  <label className="switch">
                    <input type="checkbox" checked />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary border me-2"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button type="button" data-bs-dismiss="modal" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  {/* /Edit Tag */}
  {/* Delete Modal */}
  <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content p-5 px-3 text-center">
                  <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                    <i className="ti ti-trash fs-24 text-danger" />
                  </span>
                  <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                    Delete Category
                  </h4>
                  <p className="text-gray-6 mb-0 fs-16">
                    Are you sure you want to delete category?
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
                      className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      data-bs-dismiss="modal"
                    >
                      Yes Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  {/* /Delete Modal */}
</>

  )
}

