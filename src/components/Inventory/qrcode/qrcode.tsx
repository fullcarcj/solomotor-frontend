"use client";
/* eslint-disable @next/next/no-img-element */

import CommonFooter from "@/core/common/footer/commonFooter";
import { PaperSize, Store, WareHouse } from "@/core/common/selectOption/selectOption";
import CollapesIcon from "@/core/common/tooltip-content/collapes";
import RefreshIcon from "@/core/common/tooltip-content/refresh";
import QRcodeModelPopup from "@/core/modals/inventory/qrcode";
import { MinusCircle, PlusCircle } from "react-feather";
import Link from "next/link";
import { useState } from "react";
import Select from "react-select";


export default function QrcodeComponent(){
    const [quantity, setQuantity] = useState(4);

    const handleDecrement = () => {
      if (quantity > 1) {
        setQuantity(quantity - 1);
      }
    };
  
    const handleIncrement = () => {
      setQuantity(quantity + 1);
    };
    return(
        <div>
        <div className="page-wrapper notes-page-wrapper">
          <div className="content">
            <div className="page-header">
              <div className="add-item d-flex">
                <div className="page-title">
                  <h4 className="fw-bold">Print QR Code</h4>
                  <h6>Manage your QR code</h6>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <ul className="table-top-head">
                  <RefreshIcon />
                  <CollapesIcon />
                </ul>
              </div>
            </div>
            <div className="barcode-content-list">
              <form>
                <div className="row">
                  <div className="col-lg-6 col-12">
                    <div className="row seacrh-barcode-item">
                      <div className="col-sm-6 seacrh-barcode-item-one">
                        <label className="form-label">
                          Warehouse<span className="text-danger ms-1">*</span>
                        </label>
                        <Select
                          classNamePrefix="react-select"
                          options={WareHouse}
                          placeholder="Choose"
                        />
                      </div>
                      <div className="col-sm-6 seacrh-barcode-item-one">
                        <label className="form-label">
                          Store<span className="text-danger ms-1">*</span>
                        </label>
                        <Select
                          classNamePrefix="react-select"
                          options={Store}
                          placeholder="Choose"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="search-form  seacrh-barcode-item">
                      <div className="searchInput">
                        <label className="form-label">
                          Product<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          id="dropdownsearchClickable"
                          data-bs-toggle="dropdown"
                          data-bs-auto-close="outside"
                          className="form-control"
                          placeholder="Search Product by Code"
                        />
                        <div className="resultBox"></div>
                        <div className="icon">
                          <i className="fas fa-search" />
                        </div>
                        <div
                          className="dropdown-menu search-dropdown w-100 h-auto rounded-1 mt-2"
                          aria-labelledby="dropdownsearchClickable"
                        >
                          <ul>
                            <li className="fs-14 text-gray-9 mb-2">Amazon Echo Dot</li>
                            <li className="fs-14 text-gray-9 mb-2">Armani Belt</li>
                            <li className="fs-14 text-gray-9 mb-2">Apple Watch</li>
                            <li className="fs-14 text-gray-9">Apple Iphone 14 Pro</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <div className="col-lg-12">
                <div className="modal-body-table search-modal-header bg-light p-2 p-sm-4">
                  <div className="table-responsive rounded-1 qrcode-table">
                    <table className="table  datatable">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Code</th>
                          <th>Reference Number</th>
                          <th>Qty</th>
                          <th className="text-center no-sort bg-secondary-transparent" />
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href="#"
                                className="avatar avatar-md me-2"
                              >
                                <img
                                  src="assets/img/products/stock-img-02.png"
                                  alt="product"
                                />
                              </Link>
                              <Link href="#">Nike Jordan</Link>
                            </div>
                          </td>
                          <td>PT002</td>
                          <td>HG3FK</td>
                          <td>32RRR554</td>
                          <td>
                            <div className="product-quantity">
                              <span className="quantity-btn" onClick={handleDecrement}>
                                <MinusCircle size={14} />
                              </span>
                              <input
                                type="text"
                                className="quntity-input"
                                defaultValue={4}
                              />
                              <span className="quantity-btn" onClick={handleIncrement}>
                                +
                                <PlusCircle size={14} className="plus-circle" />
                              </span>
                            </div>
                          </td>
                          <td className="action-table-data justify-content-center">
                            <div className="edit-delete-action">
                              <Link
                                data-bs-toggle="modal"
                                data-bs-target="#delete-modal"
                                className="barcode-delete-icon"
                                href="#"
                              >
                                <i data-feather="trash-2" className="feather-trash-2" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="paper-search-size">
                <div className="row align-items-center">
                  <div className="col-lg-6">
                    <form>
                      <label className="form-label">
                        Paper Size<span className="text-danger ms-1">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={PaperSize}
                        placeholder="Choose"
                      />
                    </form>
                  </div>
                  <div className="col-lg-6 pt-3">
                    <div className="row">
                      <div className="col-sm-4">
                        <div className="search-toggle-list">
                          <p>Reference Number</p>
                          <div className="m-0">
                            <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                              <input
                                type="checkbox"
                                id="user7"
                                className="check"
                                defaultChecked
                              />
                              <label htmlFor="user7" className="checktoggle mb-0">
                                {" "}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="search-barcode-button">
                <Link
                  href="#"
                  className="btn btn-submit me-2 mt-0 fs-13 btn-primary shadow-none"
                  data-bs-toggle="modal"
                  data-bs-target="#prints-barcode"
                >
                  <span>
                    <i className="fas fa-eye me-2" />
                  </span>
                  Generate QR Code
                </Link>
                <Link
                  href="#"
                  className="btn btn-cancel me-2 fs-13 btn-secondary shadow-none"
                >
                  <span>
                    <i className="fas fa-power-off me-2" />
                  </span>
                  Reset
                </Link>
                <Link
                  href="#"
                  className="btn btn-cancel close-btn fs-13 btn-danger shadow-none"
                >
                  <span>
                    <i className="fas fa-print me-2" />
                  </span>
                  Print QRcode
                </Link>
              </div>
            </div>
          </div>
          <CommonFooter />
        </div>
  
        <QRcodeModelPopup />
      </div>
    )
}