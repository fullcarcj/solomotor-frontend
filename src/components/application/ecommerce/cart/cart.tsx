"use client";
/* eslint-disable @next/next/no-img-element */

import CounterThree from '@/core/common/counter/counterThree';
import CommonFooter from '@/core/common/footer/commonFooter';
import CollapesIcon from '@/core/common/tooltip-content/collapes';
import RefreshIcon from '@/core/common/tooltip-content/refresh';
import TooltipIcons from '@/core/common/tooltip-content/tooltipIcons';
import Link from 'next/link';
import React from 'react'

export default function CartComponent  () {
    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4 className="fw-bold">Cart</h4>
                                <h6>Manage your cart</h6>
                            </div>
                        </div>
                        <ul className="table-top-head">
                            <TooltipIcons />
                            <RefreshIcon />
                            <CollapesIcon />
                        </ul>
                    </div>
                    <table className="table mb-4">
                        <thead>
                            <tr>
                                <th className="no-sort">
                                    <label className="checkboxs">
                                        <input type="checkbox" id="select-all" />
                                        <span className="checkmarks" />
                                    </label>
                                </th>
                                <th>
                                    Code <i className="ti ti-arrows-up-down fs-11 fw-medium ms-1" />
                                </th>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th className="no-sort" />
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <label className="checkboxs">
                                        <input type="checkbox" />
                                        <span className="checkmarks" />
                                    </label>
                                </td>
                                <td>CU001 </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Link href="#" className="avatar avatar-md me-2">
                                            <img src="assets/img/products/stock-img-01.png" alt="product" />
                                        </Link>
                                        <Link href="#">Lenovo IdeaPad 3</Link>
                                    </div>
                                </td>
                                <td>$600</td>
                                <td>
                                    <div className="product-quantity border-0 bg-secondary-transparent">
                                        <CounterThree />
                                    </div>
                                </td>
                                <td>$160</td>
                                <td>
                                    <div className="edit-delete-action d-flex align-items-center">
                                        <Link
                                            className="p-2 d-flex align-items-center border rounded"
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#delete_modal"
                                        >
                                            <i data-feather="trash-2" className="feather-trash-2" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label className="checkboxs">
                                        <input type="checkbox" />
                                        <span className="checkmarks" />
                                    </label>
                                </td>
                                <td>CU002 </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Link href="#" className="avatar avatar-md me-2">
                                            <img src="assets/img/products/stock-img-06.png" alt="product" />
                                        </Link>
                                        <Link href="#">Beats Pro</Link>
                                    </div>
                                </td>
                                <td>$160</td>
                                <td>
                                    <div className="product-quantity border-0 bg-secondary-transparent">
                                    <CounterThree />
                                    </div>
                                </td>
                                <td>$1200</td>
                                <td>
                                    <div className="edit-delete-action d-flex align-items-center">
                                        <Link
                                            className="p-2 d-flex align-items-center border rounded"
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#delete_modal"
                                        >
                                            <i data-feather="trash-2" className="feather-trash-2" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label className="checkboxs">
                                        <input type="checkbox" />
                                        <span className="checkmarks" />
                                    </label>
                                </td>
                                <td>CU003 </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Link href="#" className="avatar avatar-md me-2">
                                            <img src="assets/img/products/stock-img-02.png" alt="product" />
                                        </Link>
                                        <Link href="#">Nike Jordan</Link>
                                    </div>
                                </td>
                                <td>$110</td>
                                <td>
                                    <div className="product-quantity border-0 bg-secondary-transparent">
                                    <CounterThree />
                                    </div>
                                </td>
                                <td>$330</td>
                                <td>
                                    <div className="edit-delete-action d-flex align-items-center">
                                        <Link
                                            className="p-2 d-flex align-items-center border rounded"
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#delete_modal"
                                            
                                        >
                                            <i data-feather="trash-2" className="feather-trash-2" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label className="checkboxs">
                                        <input type="checkbox" />
                                        <span className="checkmarks" />
                                    </label>
                                </td>
                                <td>CU004 </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Link href="#" className="avatar avatar-md me-2">
                                            <img src="assets/img/products/stock-img-03.png" alt="product" />
                                        </Link>
                                        <Link href="#">Apple Series 5 Watch</Link>
                                    </div>
                                </td>
                                <td>$120</td>
                                <td>
                                    <div className="product-quantity border-0 bg-secondary-transparent">
                                    <CounterThree />
                                    </div>
                                </td>
                                <td>$1420</td>
                                <td>
                                    <div className="edit-delete-action d-flex align-items-center">
                                        <Link
                                            className="p-2 d-flex align-items-center border rounded "
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#delete_modal"
                                            
                                        >
                                            <i data-feather="trash-2" className="feather-trash-2" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label className="checkboxs">
                                        <input type="checkbox" />
                                        <span className="checkmarks" />
                                    </label>
                                </td>
                                <td>CU005 </td>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <Link href="#" className="avatar avatar-md me-2">
                                            <img src="assets/img/products/stock-img-04.png" alt="product" />
                                        </Link>
                                        <Link href="#">Amazon Echo Dot</Link>
                                    </div>
                                </td>
                                <td>$80</td>
                                <td>
                                    <div className="product-quantity border-0 bg-secondary-transparent">
                                    <CounterThree />
                                    </div>
                                </td>
                                <td>$1200</td>
                                <td>
                                    <div className="edit-delete-action d-flex align-items-center">
                                        <Link
                                            className="p-2 d-flex align-items-center border rounded"
                                            href="#"
                                            
                                        >
                                            <i data-feather="trash-2" className="feather-trash-2" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="d-flex align-items-center justify-content-between bg-white rounded border-gray p-4 mb-4">
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control me-2"
                                placeholder="Enter Coupon Code"
                            />
                            <Link href="#" className="btn btn-primary">
                                Apply
                            </Link>
                        </div>
                        <div className="d-flex align-items-center">
                            <p className="mb-0 me-2">Total Price : </p>
                            <p className="text-gray-9">Total 2230</p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-end mb-4">
                        <Link href="#" className="btn btn-secondary me-2">
                            Checkout
                        </Link>
                        <Link href="#" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
                <CommonFooter />
            </div>
            <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content p-5 px-3 text-center">
                  <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                    <i className="ti ti-trash fs-24 text-danger" />
                  </span>
                  <h4 className="fs-20 text-gray-9 fw-bold mb-2 mt-1">
                    Delete Cart
                  </h4>
                  <p className="text-gray-6 mb-0 fs-16">
                    Are you sure you want to delete cart?
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
        </div>
    )
}

