"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { SupplierData } from "@/core/json/supplier_data";
import  Table  from "@/core/common/pagination/datatable";
import Link from "next/link";
import { Edit, Eye, Trash2 } from "react-feather";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import SupplierModal from "@/core/modals/peoples/supplierModal";

export default function SuppliersComponent  ()  {
  const data = SupplierData;


  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      sorter: (a:any, b:any) => a.code.length - b.code.length,
    },
    {
      title: "Supplier Name",
      dataIndex: "supplierName",
      render: (text:any, record:any) => (
        <span className="productimgname">
          <Link href="#" className="avatar avatar-md me-2">
            <img alt="" src={record.image} className="img-fluid rounded-2" />
          </Link>
          <Link href="#">{text}</Link>
        </span>
      ),
      sorter: (a:any, b:any) => a.supplierName.length - b.supplierName.length,
    },


    {
      title: "Email",
      dataIndex: "email",
      sorter: (a:any, b:any) => a.email.length - b.email.length,
    },

    {
      title: "Phone",
      dataIndex: "phone",
      sorter: (a:any, b:any) => a.phone.length - b.phone.length,
    },

    {
      title: "Country",
      dataIndex: "country",
      sorter: (a:any, b:any) => a.country.length - b.country.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text:any) => (
        <>
          <span className={`badge  d-inline-flex align-items-center badge-xs ${text === 'Active' ? 'badge-success' : 'badge-danger'}`}>
            <i className="ti ti-point-filled me-1" />
            {text}
          </span>
        </>
      ),
      sorter: (a:any, b:any) => a.status.length - b.status.length,
    },

    {
      title: "",
      dataIndex: "action",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <div className="input-block add-lists"></div>

            <Link className="me-2 p-2" href="#">
              <Eye className="feather-view" />
            </Link>

            <Link
              className="me-2 p-2"
              href="#"
              data-bs-toggle="modal" data-bs-target="#edit-supplier"
            >
              <Edit className="feather-edit" />
            </Link>

            <Link
              className="confirm-text p-2"
              href="#" data-bs-toggle="modal" data-bs-target="#delete-modal"
            >
              <Trash2 className="feather-trash-2" />
            </Link>
          </div>
        </div>
      ),
      sorter: (a:any, b:any) => a.createdby.length - b.createdby.length,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Suppliers</h4>
                <h6>Manage your suppliers</h6>
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
                data-bs-target="#add-supplier"
              >
              <i className='ti ti-circle-plus me-1'></i>
                Add Supplier
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

            <div className="card-body">
              <div className="table-responsive">
                <Table
                  className="table datanew"
                  columns={columns}
                  dataSource={data}
                  rowKey={(record:any) => record.id}
                />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>d
      </div>
      <SupplierModal />
    </>

  );
};

