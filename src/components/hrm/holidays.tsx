"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { leavedata } from "@/core/json/leavesdata";
import { PlusCircle } from "react-feather";
import Link from "next/link";
import React from "react";
import { useState } from "react";
import  Table  from "@/core/common/pagination/datatable";
import AddHolidays from "@/core/modals/hrm/addholidays";
import EditHolidays from "@/core/modals/hrm/editholidays";

export default function HolidaysComponent () {
  const datas = leavedata;

  const [searchText] = useState("");


  const filteredData = datas.filter((entry:any) => {
    return Object.keys(entry).some((key) => {
      return String(entry[key])
        .toLowerCase()
        .includes(searchText.toLowerCase());
    });
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a:any, b:any) => a.name.length - b.name.length,
    },
    {
      title: "date",
      dataIndex: "date",
      sorter: (a:any, b:any) => a.date.length - b.date.length,
    },
    {
      title: "duration",
      dataIndex: "duration",
      sorter: (a:any, b:any) => a.duration.length - b.duration.length,
    },
    {
      title: "createdon",
      dataIndex: "createdon",
      sorter: (a:any, b:any) => a.createdon.length - b.createdon.length,
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (text:any) => (
        <span className="badge badge-success d-inline-flex align-items-center badge-xs">
          <i className="ti ti-point-filled me-1"></i>{text}
        </span>
      ),
      sorter: (a:any, b:any) => a.status.length - b.status.length,
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
              data-bs-target="#edit-department"
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link className="confirm-text p-2" href="#" data-bs-target="#delete-modal">
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
                <h4>Holiday</h4>
                <h6>Manage your holidays</h6>
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
                className="btn btn-primary custom-btn"
                data-bs-toggle="modal"
                data-bs-target="#add-holiday"
              >
                <PlusCircle size={14} className="me-2 " />
                Add Holiday
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
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        New Joiners
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body pb-0">
              {/* product list */}
              <div className="table-responsive">
                <Table columns={columns} dataSource={filteredData} />
              </div>
              {/* /product list */}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
      <AddHolidays />
      <EditHolidays />
      <>
        {/* Delete Modal */}
        <div className="modal fade" id="delete-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-5">
              <div className="modal-body text-center p-0">
                <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                  <i className="ti ti-trash fs-24 text-danger" />
                </span>
                <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                  Delete Holiday
                </h4>
                <p className="text-gray-6 mb-0 fs-16">
                  Are you sure you want to delete holiday?
                </p>
                <div className="d-flex justify-content-center mt-3">
                  <Link href="#"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    href="#"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3" data-bs-dismiss="modal"
                  >
                    Yes Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
      </>

    </div>
  );
};

