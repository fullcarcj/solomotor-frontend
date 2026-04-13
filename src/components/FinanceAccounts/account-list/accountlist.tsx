"use client";
/* eslint-disable @next/next/no-img-element */

import CollapesIcon from '@/core/common/tooltip-content/collapes';
import RefreshIcon from '@/core/common/tooltip-content/refresh';
import TooltipIcons from '@/core/common/tooltip-content/tooltipIcons';
import { account_list } from '@/core/json/accountList';
import { account_type } from '@/core/json/accountType';
import Link from 'next/link';
import React from 'react'
import  Table  from "@/core/common/pagination/datatable";
import { PlusCircle } from "react-feather";
import CommonFooter from '@/core/common/footer/commonFooter';
import AccountListModal from './accountListModal';

export default function AccountlistComponent  () {

    const dataSource = account_list;
    const dataSource2 = account_type;
    const columns = [
        {
            title: "Account Holder Name",
            dataIndex: "accountholder",
            sorter: (a:any, b:any) => a.accountholder.length - b.accountholder.length,
        },
        {
            title: "Account No",
            dataIndex: "accountno",
            sorter: (a:any, b:any) => a.accountno.length - b.accountno.length,
        },
        {
            title: "Type",
            dataIndex: "type",
            sorter: (a:any, b:any) => a.type.length - b.type.length,
        },
        {
            title: "Opening Balance",
            dataIndex: "balance",
            sorter: (a:any, b:any) => a.balance.length - b.balance.length,
        },
        {
            title: "Notes",
            dataIndex: "note",
            sorter: (a:any, b:any) => a.note.length - b.note.length,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text:any) => (
                <div>
                    {text === "Active" && (
                        <span className="badge table-badge bg-success fw-medium fs-10">{text}</span>
                    )}
                    {text === "Closed" && (
                        <span className="badge table-badge bg-danger fw-medium fs-10">{text}</span>
                    )}
                </div>
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
                            data-bs-target="#edit-units"
                        >
                            <i data-feather="edit" className="feather-edit"></i>
                        </Link>
                        <Link
                            className="confirm-text p-2"
                            href="#" data-bs-toggle="modal" data-bs-target="#delete-modal"
                        >
                            <i data-feather="trash-2" className="feather-trash-2"></i>
                        </Link>
                    </div>
                </div>
            ),
        },
    ];
    const column = [
        {
            title: "Type",
            dataIndex: "Type",
            sorter: (a:any, b:any) => a.Type.length - b.Type.length,
        },
        {
            title: "Created Date",
            dataIndex: "Created_Date",
            sorter: (a:any, b:any) => a.Created_Date.length - b.Created_Date.length,
        },
        {
            title: "Status",
            dataIndex: "Status",
            render: (text:any) => (
                <div>
                    {text === "Active" && (
                        <span className="badge table-badge bg-success fw-medium fs-10">{text}</span>
                    )}
                    {text === "Inactive" && (
                        <span className="badge table-badge bg-danger fw-medium fs-10">{text}</span>
                    )}
                </div>
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
                            data-bs-target="#edit-units"
                        >
                            <i data-feather="edit" className="feather-edit"></i>
                        </Link>
                        <Link
                            className="confirm-text p-2"
                            href="#" data-bs-toggle="modal" data-bs-target="#delete-modal"
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
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                        <ul
                            className="nav nav-pills low-stock-tab d-flex me-2 mb-0"
                            id="pills-tab"
                            role="tablist"
                        >
                            <li className="nav-item" role="presentation">
                                <button
                                    className="nav-link active"
                                    id="pills-home-tab"
                                    data-bs-toggle="pill"
                                    data-bs-target="#pills-home"
                                    type="button"
                                    role="tab"
                                    aria-controls="pills-home"
                                    aria-selected="true"
                                >
                                    Accounts List
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className="nav-link"
                                    id="pills-profile-tab"
                                    data-bs-toggle="pill"
                                    data-bs-target="#pills-profile"
                                    type="button"
                                    role="tab"
                                    aria-controls="pills-profile"
                                    aria-selected="false"
                                >
                                    Account Type
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="tab-content" id="pills-tabContent">
                        <div
                            className="tab-pane fade show active"
                            id="pills-home"
                            role="tabpanel"
                            aria-labelledby="pills-home-tab"
                        >
                            <div className="page-header">
                                <div className="add-item d-flex">
                                    <div className="page-title">
                                        <h4 className="fw-bold">Accounts List</h4>
                                        <h6>Manage your Accounts List</h6>
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
                                        className="btn btn-primary text-white"
                                        data-bs-toggle="modal"
                                        data-bs-target="#add-units"
                                    >
                                      <i className='ti ti-circle-plus me-1'></i>
                                        Add Account List

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
                                                    <Link
                                                        href="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Active
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        href="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Inactive
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
                                    <div className="table-responsive">
                                        <Table columns={columns} dataSource={dataSource} />
                                    </div>
                                </div>
                            </div>
                            {/* /product list */}
                        </div>
                        <div
                            className="tab-pane fade"
                            id="pills-profile"
                            role="tabpanel"
                            aria-labelledby="pills-profile-tab"
                        >
                            <div className="page-header">
                                <div className="add-item d-flex">
                                    <div className="page-title">
                                        <h4 className="fw-bold">Accounts Type</h4>
                                        <h6>Manage your Accounts Type</h6>
                                    </div>
                                </div>
                                <ul className="table-top-head">
                                    <RefreshIcon />
                                    <CollapesIcon />
                                </ul>
                                <div className="page-btn">
                                    <Link
                                        href="#"
                                        className="btn btn-primary text-white"
                                        data-bs-toggle="modal"
                                        data-bs-target="#add-units2"
                                    >
                                        <PlusCircle size={14}  className="me-2"/>
                                        Add Account Type
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
                                                    <Link
                                                        href="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Active
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        href="#"
                                                        className="dropdown-item rounded-1"
                                                    >
                                                        Inactive
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
                                    <div className="table-responsive">
                                        <Table columns={column} dataSource={dataSource2} />
                                    </div>
                                </div>
                            </div>
                            {/* /product list */}
                        </div>
                    </div>
                </div>
                <CommonFooter />
            </div>
            <AccountListModal />
        </div>
    )
}


