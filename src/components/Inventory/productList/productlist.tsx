"use client";
/* eslint-disable @next/next/no-img-element */
import Table from "@/core/common/pagination/datatable";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { productlistdata } from "@/core/json/productlistdata";
import Brand from "@/core/modals/inventory/brand";
import { all_routes } from "@/data/all_routes";
import { Download, Edit, Eye, Trash2 } from "react-feather";
import Link from "next/link";
import CommonFooter from "@/core/common/footer/commonFooter";

export default function ProductListComponent() {
  const dataSource = productlistdata;
  const route = all_routes;
  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      sorter: (a: any, b: any) => a.sku.length - b.sku.length,
    },
    {
      title: "Product",
      dataIndex: "product",
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center">
          <Link href="#" className="avatar avatar-md me-2">
            <img alt="" src={record.productImage} />
          </Link>
          <Link href="#">{text}</Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.product.length - b.product.length,
    },

    {
      title: "Category",
      dataIndex: "category",
      sorter: (a: any, b: any) => a.category.length - b.category.length,
    },

    {
      title: "Brand",
      dataIndex: "brand",
      sorter: (a: any, b: any) => a.brand.length - b.brand.length,
    },
    {
      title: "Price",
      dataIndex: "price",
      sorter: (a: any, b: any) => a.price.length - b.price.length,
    },
    {
      title: "Unit",
      dataIndex: "unit",
      sorter: (a: any, b: any) => a.unit.length - b.unit.length,
    },
    {
      title: "Qty",
      dataIndex: "qty",
      sorter: (a: any, b: any) => a.qty.length - b.qty.length,
    },

    {
      title: "Created By",
      dataIndex: "createdby",
      render: (text: any, record: any) => (
        <span className="userimgname">
          <Link href="/profile" className="product-img">
            <img alt="" src={record.img} />
          </Link>
          <Link href="/profile">{text}</Link>
        </span>
      ),
      sorter: (a: any, b: any) => a.createdby.length - b.createdby.length,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link className="me-2 p-2" href={route.productdetails}>
              <Eye className="feather-view" />
            </Link>
            <Link className="me-2 p-2" href={route.editproduct}>
              <Edit className="feather-edit" />
            </Link>
            <Link
              className="confirm-text p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
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
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Product List</h4>
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
                <i className="ti ti-circle-plus me-1"></i>
                Add New Product
              </Link>
            </div>
            <div className="page-btn import">
              <Link
                href="#"
                className="btn btn-secondary color"
                data-bs-toggle="modal"
                data-bs-target="#view-notes"
              >
                <Download className="feather me-2" />
                Import Product
              </Link>
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
                    Product
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Lenovo IdeaPad 3
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Beats Pro{" "}
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Nike Jordan
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
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
                      <Link href="#" className="dropdown-item rounded-1">
                        James Kirwin
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Francis Chang
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Antonio Engle
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
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
                      <Link href="#" className="dropdown-item rounded-1">
                        Computers
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Electronics
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Shoe
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
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
                      <Link href="#" className="dropdown-item rounded-1">
                        Lenovo
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Beats
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Nike
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
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
              {/* <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control form-control-sm formsearch"
                  />
                  <Link to className="btn btn-searchset">
                    <i data-feather="search" className="feather-search" />
                  </Link>
                </div>
              </div>
              <div className="search-path">
                <Link
                  className={`btn btn-filter ${
                    isFilterVisible ? "setclose" : ""
                  }`}
                  id="filter_search"
                >
                  <Filter
                    className="filter-icon"
                    onClick={toggleFilterVisibility}
                  />
                  <span onClick={toggleFilterVisibility}>
                    <img
                      src="assets/img/icons/closes.svg"
                      alt="img"
                    />
                  </span>
                </Link>
              </div>
              <div className="form-sort">
                <Sliders className="info-img" />
                <Select
                  className="img-select"
                  classNamePrefix="react-select"
                  options={options}
                  placeholder="14 09 23"
                />
              </div>
            </div> */}
              {/* /Filter */}
              {/* <div
              className={`card${isFilterVisible ? " visible" : ""}`}
              id="filter_inputs"
              style={{ display: isFilterVisible ? "block" : "none" }}
            >
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-12 col-sm-12">
                    <div className="row">
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <Box className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={productlist}
                            placeholder="Choose Product"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <StopCircle className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={categorylist}
                            placeholder="Choose Category"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <GitMerge className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={subcategorylist}
                            placeholder="Choose Sub Category"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <StopCircle className="info-img" />
                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={brandlist}
                            placeholder="Nike"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <i className="fas fa-money-bill info-img" />

                          <Select
                            className="img-select"
                            classNamePrefix="react-select"
                            options={price}
                            placeholder="Price"
                          />
                        </div>
                      </div>
                      <div className="col-lg-2 col-sm-6 col-12">
                        <div className="input-blocks">
                          <Link className="btn btn-filters ms-auto">
                            {" "}
                            <i
                              data-feather="search"
                              className="feather-search"
                            />{" "}
                            Search{" "}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
              {/* /Filter */}
              <div className="table-responsive">
                <Table columns={columns} dataSource={dataSource} />
              </div>
            </div>
          </div>
          {/* /product list */}
          <Brand />
        </div>
        <CommonFooter/>
      </div>
      <>
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
                    Delete Product
                  </h4>
                  <p className="text-gray-6 mb-0 fs-16">
                    Are you sure you want to delete product?
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
      </>
    </>
  );
}
