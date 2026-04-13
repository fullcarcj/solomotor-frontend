"use client";
/* eslint-disable @next/next/no-img-element */

import CollapesIcon from '@/core/common/tooltip-content/collapes';
import RefreshIcon from '@/core/common/tooltip-content/refresh';
import TooltipIcons from '@/core/common/tooltip-content/tooltipIcons';
import { CashFlowData } from '@/core/json/cashFlowData';
import Link from 'next/link';
import React from 'react'
import  Table  from "@/core/common/pagination/datatable";


export default function CashflowComponent ()  {

    const dataSource = CashFlowData;
    const columns = [
        {
            title: "Date",
            dataIndex: "Date",
            sorter: (a:any, b:any) => a.Date.length - b.Date.length,
        },
        {
            title: "Bank & Account Number",
            dataIndex: "Bank_Account",
            sorter: (a:any, b:any) => a.Bank_Account.length - b.Bank_Account.length,
        },
        {
            title: "Credit",
            dataIndex: "Credit",
            sorter: (a:any, b:any) => a.Credit.length - b.Credit.length,
        },
        {
            title: "Description",
            dataIndex: "Description",
            sorter: (a:any, b:any) => a.Description.length - b.Description.length,
        },
        {
            title: "Credit",
            dataIndex: "Credit",
            sorter: (a:any, b:any) => a.Credit.length - b.Credit.length,
        },
        {
            title: "Debit",
            dataIndex: "Debit",
            sorter: (a:any, b:any) => a.Debit.length - b.Debit.length,
        },
        {
            title: "Account balance",
            dataIndex: "Account_balance",
            sorter: (a:any, b:any) => a.Account_balance.length - b.Account_balance.length,
        },
        {
            title: "Total Balance ",
            dataIndex: "Total_Balance",
            sorter: (a:any, b:any) => a.Total_Balance.length - b.Total_Balance.length,
        },
        {
            title: "Payment Method",
            dataIndex: "Payment_Method",
            sorter: (a:any, b:any) => a.Payment_Method.length - b.Payment_Method.length,
        },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4 className="fw-bold">Cash Flow</h4>
                            <h6>View Your Cashflows </h6>
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
                            <div className="dropdown">
                                <Link
                                    href="#"
                                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                                    data-bs-toggle="dropdown"
                                >
                                    Payment Method
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Stripe
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Cash
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Paypal
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

    )
}

