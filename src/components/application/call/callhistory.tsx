"use client";
/* eslint-disable @next/next/no-img-element */

import { callhistorydata } from "@/core/json/callhistorydata";
import { all_routes } from "@/data/all_routes";
import {
  Eye,
  MessageSquare,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Trash2,
  Video,
} from "react-feather";
import Link from "next/link";
import Table from "@/core/common/pagination/datatable";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import CommonFooter from "@/core/common/footer/commonFooter";

export default function CallHistoryComponent() {
  const data = callhistorydata;

  const columns = [
    {
      title: "UserName",
      dataIndex: "username",
      render: (text: any, record: any) => (
        <>
          <div className="userimgname">
            <Link href="#" className="product-img">
              <img alt="product" src={record.image_url} />
            </Link>
            <Link href="#">{text}</Link>
          </div>
        </>
      ),
      sorter: (a: any, b: any) => a.username.length - b.username.length,
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      sorter: (a: any, b: any) => a.phone_number.length - b.phone_number.length,
    },

    {
      title: "Call Type",
      dataIndex: "call_type",
      render: (text: any) => (
        <>
          {text === "Incoming Call" ? (
            <PhoneIncoming className="income-success text-success me-2" />
          ) : text === "Outgoing Call" ? (
            <PhoneOutgoing className="outcome-warning text-success me-2" />
          ) : (
            <PhoneMissed className="missed-call text-danger me-2" />
          )}
          {text}
        </>
      ),
      sorter: (a: any, b: any) => a.call_type.length - b.call_type.length,
    },
    {
      title: "Duration",
      dataIndex: "duration",
      sorter: (a: any, b: any) => a.duration.length - b.duration.length,
    },
    {
      title: "Date & Time",
      dataIndex: "date_time",
      sorter: (a: any, b: any) => a.date_time.length - b.date_time.length,
    },

    {
      title: "Action",
      dataIndex: "action",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <div className="input-block add-lists"></div>

            <Link
              className="me-2 p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#user-profile-new"
            >
              <Eye className="feather-view" />
            </Link>

            <Link
              className="confirm-text p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#delete"
            >
              <Trash2 className="feather-trash-2" />
            </Link>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.createdby.length - b.createdby.length,
    },
  ];
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="page-header menu">
              <div className="page-title">
                <h4>Call History</h4>
                <h6>Manage your call history</h6>
              </div>
            </div>
            <div>
              <ul className="table-top-head">
                <TooltipIcons />
                <RefreshIcon />
                <CollapesIcon />
              </ul>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set"></div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Call type
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Incoming
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Outgoing
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Missed Call
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
              <div className="table-responsive product-list">
                <Table columns={columns} dataSource={data} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>

      {/* details popup */}
      <div className="modal fade" id="user-profile-new">
        <div className="modal-dialog history-modal-profile">
          <div className="modal-content">
            <div className="page-wrapper details-blk">
              <div className="content">
                <div className="text-center right-sidebar-profile mb-3">
                  <figure className="avatar">
                    <img
                      className="rounded-circle"
                      src="/assets/img/users/user-08.jpg"
                      alt="image"
                    />
                  </figure>
                  <div className="chat-options chat-option-profile">
                    <ul className="list-inline">
                      <li className="list-inline-item">
                        <Link
                          href={all_routes.videocall}
                          className="bg-secondary-transparent p-2 d-flex align-items-center rounded-circle"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          title=""
                          data-bs-original-title="Video Call"
                        >
                          <Video />
                        </Link>
                      </li>
                      <li className="list-inline-item">
                        <Link
                          href={all_routes.chat}
                          className="bg-primary p-2 d-flex align-items-center rounded-circle"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          title=""
                          data-bs-original-title="Chat"
                        >
                          <MessageSquare />
                        </Link>
                      </li>
                      <li className="list-inline-item ">
                        <Link
                          href={all_routes.audiocall}
                          className="profile-open bg-secondary-transparent p-2 d-flex align-items-center rounded-circle"
                          data-bs-toggle="tooltip"
                          data-bs-placement="bottom"
                          title=""
                          data-bs-original-title="Voice Call"
                        >
                          <PhoneCall/>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="modal-profile-detail">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="modal-userlist">
                        <ul>
                          <li>
                            Name<span>Thomas</span>
                          </li>
                          <li>
                            Phone<span>+1 25182 94528</span>
                          </li>
                          <li>
                            Email<span>thomas@example.com</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="modal-userlist d-flex justify-content-center">
                        <ul>
                          <li>
                            Total Calls<span>20</span>
                          </li>
                          <li>
                            Average Call Timing<span>0.30</span>
                          </li>
                          <li>
                            Average Waiting Time<span>00.5</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /details popup */}
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
                  <h3 className="mb-2">Delete History</h3>
                  <p className="fs-16 mb-3">
                    Are you sure you want to delete contact from call history?
                  </p>
                  <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-md btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      No, Cancel
                    </button>
                    <button type="submit" className="btn btn-md btn-primary">
                      Yes, Delete
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete */}
    </>
  );
}
