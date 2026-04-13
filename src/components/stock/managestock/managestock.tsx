"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import CommonDeleteModal from "@/core/common/modal/commonDeleteModal";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import TooltipIcons from "@/core/common/tooltip-content/tooltipIcons";
import { ManageStocksdata } from "@/core/json/managestocks_data";
import Link from "next/link";
import { useState } from "react";
import Select from "react-select";
import Table from "@/core/common/pagination/datatable";
import {
  Edit,
  MinusCircle,
  PlusCircle,
  Search,
  Trash2,
} from "react-feather";
import {
  ResponsiblePerson,
  Shop,
  Store,
  WareHouse,
} from "@/core/common/selectOption/selectOption";

export default function ManageStockComponent() {
  const data = ManageStocksdata;

  const columns = [
    {
      title: "Warehouse",
      dataIndex: "Warehouse",
      sorter: (a: any, b: any) => a.Warehouse.length - b.Warehouse.length,
    },
    {
      title: "Shop",
      dataIndex: "Shop",
      sorter: (a: any, b: any) => a.Shop.length - b.Shop.length,
    },
    {
      title: "Product",
      dataIndex: "Product",
      render: (text: any, record: any) => (
        <span className="userimgname">
          <Link href="#" className="product-img">
            <img alt="img" src={record.Product.Image} />
          </Link>
          <Link href="#">{record.Product.Name}</Link>
        </span>
      ),
      sorter: (a: any, b: any) => a.Product.Name.length - b.Product.Name.length,
    },

    {
      title: "Date",
      dataIndex: "Date",
      sorter: (a: any, b: any) => a.Email.length - b.Email.length,
    },

    {
      title: "Person",
      dataIndex: "Person",
      render: (text: any, record: any) => (
        <span className="userimgname">
          <Link href="#" className="product-img">
            <img alt="img" src={record.Person.Image} />
          </Link>
          <Link href="#">{record.Person.Name}</Link>
        </span>
      ),
      sorter: (a: any, b: any) => a.Person.Name.length - b.Person.Name.length,
    },

    {
      title: "Qty",
      dataIndex: "Quantity",
      sorter: (a: any, b: any) => a.Quantity.length - b.Quantity.length,
    },

    {
      title: "",
      dataIndex: "action",
      render: () => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <div className="input-block add-lists"></div>

            <Link
              className="me-2 p-2"
              href="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-units"
            >
              <Edit className="feather-edit" />
            </Link>

            <Link
              className="confirm-text p-2"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
              href="#"
            >
              <Trash2 className="feather-trash-2" />
            </Link>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.createdby.length - b.createdby.length,
    },
  ];

  const [quantity, setQuantity] = useState(4);

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Manage Stock</h4>
                <h6>Manage your stock</h6>
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
                data-bs-target="#add-units"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add New
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card  manage-stock">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set"></div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Warehouse
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Lavish Warehouse
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Quaint Warehouse{" "}
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Traditional Warehouse
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Cool Warehouse
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
                    Store
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Electro Mart
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Quantum Gadgets
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Prime Bazaar
                      </Link>
                    </li>
                    <li>
                      <Link href="#" className="dropdown-item rounded-1">
                        Gadget World
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
              </div>
            </div>

            <div className="card-body">
              <div className="custom-datatable-filter table-responsive">
                <Table columns={columns} dataSource={data} />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>
      <CommonDeleteModal />

      {/* Add Stock */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Stock</h4>
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
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse <span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={WareHouse}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Store <span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={Store}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Responsible Person{" "}
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={ResponsiblePerson}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="search-form mb-0">
                      <label className="form-label">
                        Product <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Select Product"
                      />
                      <i data-feather="search" className="feather-search" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <Link
                  href="#"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                >
                  Add Stock
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Stock */}
      {/* Edit Stock */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Stock</h4>
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
            <form>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse<span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={WareHouse}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Shop<span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={Shop}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Responsible Person
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={ResponsiblePerson}
                        placeholder="Choose"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="search-form mb-3">
                      <label className="form-label">
                        Product<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Select Product"
                        defaultValue="Nike Jordan"
                      />
                      <Search className="feather-search" />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="modal-body-table">
                      <div className="table-responsive">
                        <table className="table  datanew">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU</th>
                              <th>Category</th>
                              <th>Qty</th>
                              <th className="no-sort" />
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link href="#" className="avatar avatar-md">
                                    <img
                                      src="assets/img/products/stock-img-02.png"
                                      alt="product"
                                    />
                                  </Link>
                                  <Link href="#">Nike Jordan</Link>
                                </div>
                              </td>
                              <td>PT002</td>
                              <td>Nike</td>
                              <td>
                                <div className="product-quantity bg-gray-transparent border-0">
                                  <span
                                    className="quantity-btn"
                                    onClick={handleDecrement}
                                  >
                                    <MinusCircle size={14} />
                                  </span>
                                  <input
                                    type="text"
                                    className="quntity-input bg-transparent"
                                    defaultValue={2}
                                  />
                                  <span
                                    className="quantity-btn"
                                    onClick={handleIncrement}
                                  >
                                    +
                                    <PlusCircle size={14} className="plus-circle" />
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center justify-content-between edit-delete-action">
                                  <Link
                                    className="d-flex align-items-center border rounded p-2"
                                    href="#"
                                  >
                                    <i
                                      data-feather="trash-2"
                                      className="feather-trash-2"
                                    />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <Link
                  href="#"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                >
                  Save Changes
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Stock */}
    </>
  );
}
