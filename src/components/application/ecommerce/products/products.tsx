"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import { Category, products, SubCategory } from "@/core/common/selectOption/selectOption";
import TextEditor from "@/core/common/texteditor/texteditor";
import { ProductsData } from "@/core/json/productsdata";
import { all_routes } from "@/data/all_routes";
import { Download, Eye } from "react-feather";
import Link from "next/link";
import Select from "react-select";
import  Table  from "@/core/common/pagination/datatable";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";

export default function ProductsComponent(){
    const route = all_routes;
    const data = ProductsData;
    const columns = [
        {
            title: "SKU",
            dataIndex: "SKU",
            sorter: (a:any, b:any) => a.SKU.length - b.SKU.length,
        },
        {
            title: "Product Name",
            dataIndex: "Product_Name",
            render: (text:any, render:any) => (
                <div className="d-flex align-items-center">
                    <Link href="#" className="avatar avatar-md">
                        <img src={render.image} alt="product" />
                    </Link>
                    <Link href="#">{text}</Link>
                </div>

            ),
            sorter: (a:any, b:any) => a.Product_Name.length - b.Product_Name.length,
        },

        {
            title: "Category",
            dataIndex: "Category",
            sorter: (a:any, b:any) => a.Category.length - b.Category.length,
        },

        {
            title: "Brand",
            dataIndex: "Brand",
            sorter: (a:any, b:any) => a.Email.length - b.Email.length,
        },

        {
            title: "Price",
            dataIndex: "Price",
            sorter: (a:any, b:any) => a.Price.length - b.Price.length,
        },
        {
            title: "Unit",
            dataIndex: "Unit",
            sorter: (a:any, b:any) => a.Unit.length - b.Unit.length,
        },
        {
            title: "Qty",
            dataIndex: "Qty",
            sorter: (a:any, b:any) => a.Qty.length - b.Qty.length,
        },

        {
            title: "Created By",
            dataIndex: "Created_By",
            render: (text:any, render:any) => (
                <div className="d-flex align-items-center">
                    <span >
                        <Link href="#" className="avatar avatar-md me-2">
                            <img src={render.profile_image} alt="product" />
                        </Link>
                    </span>
                    <Link href="#">{text}</Link>
                </div>
            ),
            sorter: (a:any, b:any) => a.Created_By.length - b.Created_By.length,
        },

        {
            title: "",
            dataIndex: "action",
            render: () => (
                <div className="edit-delete-action">
                    <Link className="me-2 edit-icon p-2" href={route.productdetails}>
                        <Eye className="action-eye"/>
                    </Link>
                    <Link className="me-2 p-2" href={route.editproduct}>
                        <i data-feather="edit" className="feather-edit" />
                    </Link>
                    <Link className="p-2" href="#">
                        <i data-feather="trash-2" className="feather-trash-2" />
                    </Link>
                </div>

            ),
            sorter: (a:any, b:any) => a.action.length - b.action.length,
        },
    ];
    return(
        <div>
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4 className="fw-bold">Product List</h4>
                            <h6>Manage your products</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <TooltipIcons />
                        <RefreshIcon />
                        <CollapesIcon />
                    </ul>
                    <div className="page-btn">
                        <Link href={route.addproduct} className="btn btn-primary">
                          <i className='ti ti-circle-plus me-1'></i>
                            Add Product
                        </Link>
                    </div>
                    <div className="page-btn import">
                        <Link
                            href="#"
                            className="btn btn-primary color"
                            data-bs-toggle="modal"
                            data-bs-target="#view-notes"
                        >
                            <Download className="me-2" />
                            Import Product
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
                                    Product
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Lenovo IdeaPad 3
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Beats Pro{" "}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Nike Jordan
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Apple Series 5 Watch
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
                                    Created By
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            James Kirwin
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Francis Chang
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Antonio Engle
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Leo Kelly
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
                                    Category
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Computers
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Electronics
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Shoe
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Electronics
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
                                    Brand
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Lenovo
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Beats
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Nike
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className="dropdown-item rounded-1"
                                        >
                                            Apple
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
                        <div className=" table-responsive">
                            <Table columns={columns} dataSource={data} />
                        </div>
                    </div>
                </div>
                {/* /product list */}
            </div>
            <CommonFooter />
        </div>
        <>
            {/* Import Product */}
            <div className="modal fade" id="view-notes">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="page-wrapper-new p-0">
                            <div className="content">
                                <div className="modal-header">
                                    <div className="page-title">
                                        <h4>Import Product</h4>
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
                                    <form >
                                        <div className="modal-top">
                                            <div className="row">
                                                <div className="col-12">
                                                    <div className="input-blocks">
                                                        <label>
                                                            Product<span className="ms-1 text-danger">*</span>
                                                        </label>
                                                        <Select
                                                            classNamePrefix="react-select"
                                                            options={products}
                                                            placeholder="Choose"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-sm-6 col-12">
                                                    <div className="input-blocks">
                                                        <label>
                                                            Category<span className="ms-1 text-danger">*</span>
                                                        </label>
                                                        <Select
                                                            classNamePrefix="react-select"
                                                            options={Category}
                                                            placeholder="Choose"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-sm-6 col-12">
                                                    <div className="input-blocks">
                                                        <label>
                                                            Sub Category
                                                            <span className="ms-1 text-danger">*</span>
                                                        </label>
                                                        <Select
                                                            classNamePrefix="react-select"
                                                            options={SubCategory}
                                                            placeholder="Choose"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-lg-12 col-sm-6 col-12">
                                                    <div className="row">
                                                        <div>
                                                            <div className="modal-footer-btn download-file">
                                                                <Link
                                                                    href="#"
                                                                    className="btn btn-submit"
                                                                >
                                                                    Download Sample File
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-12">
                                                    <div className="input-blocks image-upload-down">
                                                        <label> Upload CSV File</label>
                                                        <div className="image-upload download">
                                                            <input type="file" />
                                                            <div className="image-uploads">
                                                                <img src="assets/img/download-img.png" alt="img" />
                                                                <h4>
                                                                    Drag and drop a <span>file to upload</span>
                                                                </h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-12 col-sm-6 col-12">
                                                    <div className="mb-3">
                                                        <label className="form-label">
                                                            Created by<span className="ms-1 text-danger">*</span>
                                                        </label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-lg-12">
                                                    <div className="mb-3 input-blocks">
                                                        <label className="form-label">Description</label>
                                                        <TextEditor />
                                                        <p className="mt-1">Maximum 60 Characters</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-btns">
                                            <div className="row">
                                                <div className="col-lg-12">
                                                    <div className="modal-footer-btn">
                                                        <button
                                                            type="button"
                                                            className="btn btn-cancel me-2 p-2 px-3"
                                                            data-bs-dismiss="modal"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <Link
                                                            href="#"
                                                            className="btn btn-submit p-2 px-3" data-bs-dismiss="modal"
                                                        >
                                                            Submit
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Import Product */}
        </>

    </div>
    )
}