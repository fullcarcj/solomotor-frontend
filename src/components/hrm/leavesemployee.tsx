"use client";
/* eslint-disable @next/next/no-img-element */

import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { leavesEmployee } from "@/core/json/leavesemployee";
import Link from "next/link";
import React, { useState } from "react";
import  Table  from "@/core/common/pagination/datatable";
import { Calendar } from "react-feather";
import { DatePicker } from "antd";
import CommonFooter from "@/core/common/footer/commonFooter";
import AddLeaveEmployee from "@/core/modals/hrm/addleaveemployee";
import EditLeaveEmployee from "@/core/modals/hrm/editleaveemployee";


export default  function LeavesEmployeeComponent() {
  const leavesEmployeedata = leavesEmployee;

  const columns = [
    {
      title: "EmpId",
      dataIndex: "empId",
      // sorter: (a:any, b:any) => a.empId.length - b.empId.length,
      sorter: (a:any, b:any) => a.empId.localeCompare(b.empId)

    },
    {
      title: "Type",
      dataIndex: "type",
      sorter: (a:any, b:any) => a.type.length - b.type.length,
    },

    {
      title: "Date",
      dataIndex: "date",
      sorter: (a:any, b:any) => a.date.length - b.date.length,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      sorter: (a:any, b:any) => a.duration.length - b.duration.length,
    },
    {
      title: "AppliedOn",
      dataIndex: "appliedOn",
      sorter: (a:any, b:any) => a.appliedOn.length - b.appliedOn.length,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      sorter: (a:any, b:any) => a.reason.length - b.reason.length,
    },
    {
      title: "Status",
      dataIndex: "approval",
      sorter: (a:any, b:any) => a.approval.length - b.approval.length,
      render: (text:any) => (
        <span
          className={`badge  d-inline-flex align-items-center badge-xs ${text === "Applied" ? "badge-purple" : text === "Approved" ? "badge-success" : "badge-danger"
            }`}
        >
          <i className="ti ti-point-filled me-1"></i>{text}
        </span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "action",
      sorter: (a:any, b:any) => a.action.length - b.action.length,
      render: (text:any) => (
        <td className="action-table-data justify-content-end">
          <div className="edit-delete-action">
            <Link
              href=""
              className={`me-2 p-2 ${text !== 'Rejected' && text !== 'Applied' ? 'd-none' : ''}`}
            >
              <i
                data-feather={`${text === 'Rejected' ? 'x-circle' : 'info'}`}
                className={`${text === 'Rejected' ? 'feather-x-circle' : text === 'Applied' ? 'feather-info' : ''}`}
              ></i>
            </Link>
            <Link className="me-2 p-2" href="#" data-bs-toggle="modal" data-bs-target="#edit-leave">
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link className="confirm-text p-2" href="#" data-bs-toggle="modal" data-bs-target="#delete-modal">
              <i data-feather="trash-2" className="feather-trash-2"></i>
            </Link>
          </div>

        </td>
      ),
    },

  ];

  const [searchText] = useState("");
  const filteredData = leavesEmployeedata.filter((entry) => {
    return (Object.keys(entry) as Array<keyof typeof entry>).some((key) => {
      return String(entry[key])
        .toLowerCase()
        .includes(searchText.toLowerCase());
    });
  });


  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Leaves</h4>
                <h6>Manage your Leaves</h6>
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
                data-bs-target="#add-leave"
              >
                Apply Leave
              </Link>
            </div>
          </div>

          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set">
              </div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-2 date-select-small">
                  <div className="input-groupicon trail-balance">
                    <Calendar className="info-img" />
                    <DatePicker
                      className="form-control datetimepicker"
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                </div>
                <div className="dropdown">
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
                        Approved
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Rejected
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <Table columns={columns} dataSource={filteredData} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>
      <AddLeaveEmployee />
      <EditLeaveEmployee />

      {/* delete modal */}
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content p-5 px-3 text-center">
                <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                  <i className="ti ti-trash fs-24 text-danger" />
                </span>
                <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                  Delete Leave
                </h4>
                <p className="text-gray-6 mb-0 fs-16">
                  Are you sure you want to delete leave?
                </p>
                <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <Link
                    href="#"
                    className="btn btn-submit fs-13 fw-medium p-2 px-3" data-bs-dismiss="modal"
                  >
                    Yes Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /delete modal */}


    </div>
  );
};

