"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Table from "@/core/common/pagination/datatable";
import { deleteaccountdata } from "@/core/json/deleteaccount";
import Link from "next/link";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";

export default function DeleteAccountComponent  ()  {
  const dataSource = deleteaccountdata;

  const columns = [
    {
      title: "User Name",
      dataIndex: "username",
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center">
          <Link href="/profile" className="avatar avatar-md">
            <img alt="" src={record.img} className="product-img" />
          </Link>
          <div>
            <Link href="/profile">{text}</Link>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.username.length - b.username.length,
    },

    {
      title: "Requisition Date",
      dataIndex: "requisitiondate",
      sorter: (a: any, b: any) =>
        a.requisitiondate.length - b.requisitiondate.length,
    },
    {
      title: "Delete Requisition Date",
      dataIndex: "deleterequisitiondate",
      sorter: (a: any, b: any) =>
        a.deleterequisitiondate.length - b.deleterequisitiondate.length,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="confirm-text p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#delete_modal"
            >
              <i data-feather="trash-2" className="feather-trash-2"></i>
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
                <h4>Delete Account Request</h4>
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
                <div className="search-input">
                  <a href="#" className="btn btn-searchset">
                    <i className="ti ti-search fs-14 feather-search" />
                  </a>
                  <div
                    id="DataTables_Table_0_filter"
                    className="dataTables_filter"
                  >
                    <label>
                      {" "}
                      <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Search"
                        aria-controls="DataTables_Table_0"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3"></div>
            </div>
            <div className="card-body pb-0">
              <div className="table-responsive">
                <Table columns={columns} dataSource={dataSource} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      <div className="modal fade modal-default" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body p-0">
              <div className="success-wrap text-center">
                <form>
                  <div className="icon-success bg-danger-transparent text-danger mb-2">
                    <i className="ti ti-trash" />
                  </div>
                  <h3 className="mb-2">Delete Account</h3>
                  <p className="fs-16 mb-3">
                    Are you sure you want to delete account?
                  </p>
                  <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-md btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-md btn-primary"
                      data-bs-dismiss="modal"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
