"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Select from "react-select";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Link from "next/link";
import { Check, Edit, Trash2, UserPlus, X } from "react-feather";
import CounterTwo from "@/core/common/counter/counterTwo";
import PosModals from "@/core/modals/pos-modal/posModals";

export default function Pos3Component() {
  const [activeTab, setActiveTab] = useState("all");
  const [showAlert1, setShowAlert1] = useState(false);

  const settings = {
    dots: false,
    autoplay: false,
    slidesToShow: 6,
    margin: 0,
    speed: 500,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 6,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 5,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const options = [
    { value: 'walkInCustomer', label: 'Walk in Customer' },
    { value: 'john', label: 'John' },
    { value: 'smith', label: 'Smith' },
    { value: 'ana', label: 'Ana' },
    { value: 'elza', label: 'Elza' },
  ];
  const productOptions = [
    { value: "search", label: "Search Products" },
    { value: "iphone", label: "IPhone 14 64GB" },
    { value: "macbook", label: "MacBook Pro" },
    { value: "rolex", label: "Rolex Tribute V3" },
    { value: "nike", label: "Red Nike Angelo" },
    { value: "airpod", label: "Airpod 2" },
    { value: "oldest", label: "Oldest" },
  ];
  
  const gstOptions = [
    { value: "choose", label: "Choose" },
    { value: "gst5", label: "GST 5%" },
    { value: "gst10", label: "GST 10%" },
    { value: "gst15", label: "GST 15%" },
    { value: "gst20", label: "GST 20%" },
    { value: "gst25", label: "GST 25%" },
    { value: "gst30", label: "GST 30%" },
  ];
  const numericOptions = [
    { value: "0", label: "0" },
    { value: "15", label: "15" },
    { value: "20", label: "20" },
    { value: "25", label: "25" },
    { value: "30", label: "30" },
  ];
  
  const percentageOptions = [
    { value: "0%", label: "0%" },
    { value: "10%", label: "10%" },
    { value: "15%", label: "15%" },
    { value: "20%", label: "20%" },
    { value: "25%", label: "25%" },
    { value: "30%", label: "30%" },
  ];

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const productInfo = target.closest(".product-info");

      if (productInfo) {
        productInfo.classList.toggle("active");

        const emptyCart = document.querySelector(".product-wrap .empty-cart");
        const productList = document.querySelector(".product-wrap .product-list");

        if (document.querySelectorAll(".product-info.active").length > 0) {
          // If "active" exists, hide .empty-cart and show .product-list
          if (emptyCart) (emptyCart as HTMLElement).style.display = "none";
          if (productList) (productList as HTMLElement).style.display = "flex";
        } else {
          // If not "active", reverse the behavior
          if (emptyCart) (emptyCart as HTMLElement).style.display = "flex";
          if (productList) (productList as HTMLElement).style.display = "none";
        }
      }
    };

    document.addEventListener("click", handleClick);
    document.body.classList.add("pos-page");

    return () => {
      document.removeEventListener("click", handleClick);
      document.body.classList.remove("pos-page");
    };
  }, []);

  return (
    <div className="main-wrapper pos-two">
    <div className="page-wrapper pos-pg-wrapper ms-0">
      <div className="content pos-design p-0">
        <div className="row align-items-start pos-wrapper">
          
          {/* Order Details */}
          <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar">
            <aside className="product-order-list">
              <div className="order-head bg-light d-flex align-items-center justify-content-between w-100">
                <div>
                  <h3>Order List</h3>
                  <span>Transaction ID : #65565</span>
                </div>
                <div>
                  <Link href="#" className="link-danger fs-16" >
                    <i className="ti ti-trash-x-filled" />
                  </Link>
                </div>
              </div>
              <div className="customer-info block-section">
                <h4 className="mb-3">Customer Information</h4>
                <div className="input-block d-flex align-items-center">
                  <div className="flex-grow-1">
                  <Select
                    options={options}
                    classNamePrefix="react-select select"
                    placeholder="Choose a Name"
                    defaultValue={options[0]}
                    />
                  </div>
                  <Link
                    href="#"
                    className="btn btn-primary btn-icon"
                    data-bs-toggle="modal"
                    data-bs-target="#create"
                  >
                    <UserPlus className="feather-16" />
                  </Link>
                </div>
                <div className="input-block">
                <Select
                    options={productOptions}
                    classNamePrefix="react-select select"
                    placeholder="Select"
                    defaultValue={productOptions[0]}
                    />
                </div>
              </div>
              <div className="product-added block-section">
                <div className="head-text d-flex align-items-center justify-content-between">
                  <h5 className="d-flex align-items-center mb-0">
                    Product Added<span className="count">2</span>
                  </h5>
                  <Link
                    href="#"
                    className="d-flex align-items-center link-danger"
                  >
                    <span className="me-2">
                      <X className="feather-16" />
                    </span>
                    Clear all
                  </Link>
                </div>
                <div className="product-wrap">
                  <div className="empty-cart">
                    <div className="fs-24 mb-1">
                      <i className="ti ti-shopping-cart" />
                    </div>
                    <p className="fw-bold">No Products Selected</p>
                  </div>
                  <div className="product-list align-items-center justify-content-between">
                    <div
                      className="d-flex align-items-center product-info"
                      data-bs-toggle="modal"
                      data-bs-target="#products"
                    >
                      <Link href="#" className="pro-img">
                        <img
                          src="assets/img/products/pos-product-16.png"
                          alt="Products"
                        />
                      </Link>
                      <div className="info">
                        <span>PT0005</span>
                        <h6>
                          <Link href="#">Red Nike Laser</Link>
                        </h6>
                        <p className="fw-bold text-teal">$2000</p>
                      </div>
                    </div>
                    <div className="qty-item text-center">
                      <CounterTwo />
                    </div>
                    <div className="d-flex align-items-center action">
                      <Link
                        className="btn-icon edit-icon me-1"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-product"
                      >
                        <Edit className="feather-14" />
                      </Link>
                      <Link
                        className="btn-icon delete-icon"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete"
                      >
                        <Trash2 className="feather-14" />
                      </Link>
                    </div>
                  </div>
                  <div className="product-list align-items-center justify-content-between">
                    <div
                      className="d-flex align-items-center product-info"
                      data-bs-toggle="modal"
                      data-bs-target="#products"
                    >
                      <Link href="#" className="pro-img">
                        <img
                          src="assets/img/products/pos-product-17.png"
                          alt="Products"
                        />
                      </Link>
                      <div className="info">
                        <span>PT0235</span>
                        <h6>
                          <Link href="#">Iphone 14</Link>
                        </h6>
                        <p className="fw-bold text-teal">$3000</p>
                      </div>
                    </div>
                    <div className="qty-item text-center">
                      <CounterTwo />
                    </div>
                    <div className="d-flex align-items-center action">
                      <Link
                        className="btn-icon edit-icon me-1"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-product"
                      >
                        <Edit className="feather-14" />
                      </Link>
                      <Link
                        className="btn-icon delete-icon"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete"
                      >
                        <Trash2 className="feather-14" />
                      </Link>
                    </div>
                  </div>
                  <div className="product-list align-items-center justify-content-between">
                    <div
                      className="d-flex align-items-center product-info"
                      data-bs-toggle="modal"
                      data-bs-target="#products"
                    >
                      <Link href="#" className="pro-img">
                        <img
                          src="assets/img/products/pos-product-09.svg"
                          alt="Products"
                        />
                      </Link>
                      <div className="info">
                        <span>PT0242</span>
                        <h6>
                          <Link href="#">Timex Black Silver</Link>
                        </h6>
                        <p className="fw-bold text-teal">$1457</p>
                      </div>
                    </div>
                    <div className="qty-item text-center">
                    <CounterTwo />
                    </div>
                    <div className="d-flex align-items-center action">
                      <Link
                        className="btn-icon edit-icon me-1"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-product"
                      >
                        <Edit className="feather-14" />
                      </Link>
                      <Link
                        className="btn-icon delete-icon"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete"
                      >
                        <Trash2 className="feather-14" />
                      </Link>
                    </div>
                  </div>
                  <div className="product-list align-items-center justify-content-between">
                    <div
                      className="d-flex align-items-center product-info"
                      data-bs-toggle="modal"
                      data-bs-target="#products"
                    >
                      <Link href="#" className="pro-img">
                        <img
                          src="assets/img/products/pos-product-08.svg"
                          alt="Products"
                        />
                      </Link>
                      <div className="info">
                        <span>PT0005</span>
                        <h6>
                          <Link href="#">SWAGME</Link>
                        </h6>
                        <p className="fw-bold text-teal">$6587</p>
                      </div>
                    </div>
                    <div className="qty-item text-center">
                    <CounterTwo />
                    </div>
                    <div className="d-flex align-items-center action">
                      <Link
                        className="btn-icon edit-icon me-1"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-product"
                      >
                        <Edit className="feather-14" />
                      </Link>
                      <Link
                        className="btn-icon delete-icon"
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete"
                      >
                        <Trash2 className="feather-14" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="block-section">
                <div className="selling-info">
                  <div className="row g-3">
                    <div className="col-12 col-sm-4">
                      <div>
                        <label className="form-label">Order Tax</label>
                        <Select
                    options={gstOptions}
                    classNamePrefix="react-select select"
                    placeholder="Select"
                    defaultValue={gstOptions[0]}
                    />
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div>
                        <label className="form-label">Shipping</label>
                        <Select
                    options={numericOptions}
                    classNamePrefix="react-select select"
                    placeholder="Select"
                    defaultValue={numericOptions[0]}
                    />
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div>
                        <label className="form-label">Discount</label>
                        <Select
                    options={percentageOptions}
                    classNamePrefix="react-select select"
                    placeholder="Select"
                    defaultValue={percentageOptions[0]}
                    />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-total">
                  <table className="table table-responsive table-borderless">
                    <tbody>
                      <tr>
                        <td>Sub Total</td>
                        <td className="text-end">$60,454</td>
                      </tr>
                      <tr>
                        <td>Tax (GST 5%)</td>
                        <td className="text-end">$40.21</td>
                      </tr>
                      <tr>
                        <td>Shipping</td>
                        <td className="text-end">$40.21</td>
                      </tr>
                      <tr>
                        <td>Sub Total</td>
                        <td className="text-end">$60,454</td>
                      </tr>
                      <tr>
                        <td className="text-danger">Discount (10%)</td>
                        <td className="text-danger text-end">$15.21</td>
                      </tr>
                      <tr>
                        <td>Total</td>
                        <td className="text-end">$64,024.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="block-section payment-method">
                <h4>Payment Method</h4>
                <div className="row align-items-center justify-content-center methods g-3">
                  <div className="col-sm-6 col-md-4">
                    <Link
                      href="#"
                      className="payment-item text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#payment-cash"
                    >
                      <i className="ti ti-cash-banknote fs-18" />
                      <span>Cash</span>
                    </Link>
                  </div>
                  <div className="col-sm-6 col-md-4">
                    <Link
                      href="#"
                      className="payment-item text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#payment-card"
                    >
                      <i className="ti ti-credit-card fs-18" />
                      <span>Debit Card</span>
                    </Link>
                  </div>
                  <div className="col-sm-6 col-md-4">
                    <Link
                      href="#"
                      className="payment-item text-dark"
                      data-bs-toggle="modal"
                      data-bs-target="#scan-payment"
                    >
                      <i className="ti ti-scan fs-18" />
                      <span>Scan</span>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="btn-block">
                <Link
                  className="btn btn-secondary w-100"
                  href="#"
                >
                  Grand Total : $64,024.5
                </Link>
              </div>
              <div className="btn-row d-sm-flex align-items-center justify-content-between">
                <Link
                  href="#"
                  className="btn btn-purple d-flex align-items-center justify-content-center flex-fill"
                  data-bs-toggle="modal"
                  data-bs-target="#hold-order"
                >
                  <i className="ti ti-player-pause me-1" />
                  Hold
                </Link>
                <Link
                  href="#"
                  className="btn btn-danger d-flex align-items-center justify-content-center flex-fill"
                >
                  <i className="ti ti-trash me-1" />
                  Void
                </Link>
                <Link
                  href="#"
                  className="btn btn-success d-flex align-items-center justify-content-center flex-fill"
                  data-bs-toggle="modal"
                  data-bs-target="#payment-completed"
                >
                  <i className="ti ti-cash-banknote me-1" />
                  Payment
                </Link>
              </div>
            </aside>
          </div>
          {/* /Order Details */}
          {/* Products */}
          <div className="col-md-12 col-lg-7 col-xl-8">
            <div className="pos-categories tabs_wrapper pb-0">
              <div className="card pos-button">
                <div className="d-flex align-items-center flex-wrap">
                  <Link
                    href="#"
                    className="btn btn-teal btn-md mb-xs-3"
                    data-bs-toggle="modal"
                    data-bs-target="#orders"
                  >
                    <i className="ti ti-shopping-cart me-1" />
                    View Orders
                  </Link>
                  <Link
                    href="#"
                    className="btn btn-md btn-indigo"
                    data-bs-toggle="modal"
                    data-bs-target="#reset"
                  >
                    <i className="ti ti-reload me-1" />
                    Reset
                  </Link>
                  <Link
                    href="#"
                    className="btn btn-md btn-info"
                    data-bs-toggle="modal"
                    data-bs-target="#recents"
                  >
                    <i className="ti ti-refresh-dot me-1" />
                    Transaction
                  </Link>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <h4 className="mb-3">Categories</h4>
              </div>
              <Slider {...settings} className="tabs owl-carousel pos-category">
                <div onClick={()=>setActiveTab('all')} className={`owl-item ${activeTab === 'all' ? 'active' : ''}`}  id="all">
                  <Link href="#">
                    <img
                      src="assets/img/categories/category-01.svg"
                      alt="Categories"
                    />
                  </Link>
                  <h6>
                    <Link href="#">All Categories</Link>
                  </h6>
                  <span>80 Items</span>
                </div>
                <div onClick={()=>setActiveTab('headphones')} className={`owl-item ${activeTab === 'headphones' ? 'active' : ''}`} id="headphones">
                  <Link href="#">
                    <img
                      src="assets/img/categories/category-02.svg"
                      alt="Categories"
                    />
                  </Link>
                  <h6>
                    <Link href="#">Headphones</Link>
                  </h6>
                  <span>4 Items</span>
                </div>
                <div onClick={()=>setActiveTab('shoes')} className={`owl-item ${activeTab === 'shoes' ? 'active' : ''}`} id="shoes">
                  <Link href="#">
                    <img
                      src="assets/img/categories/category-03.svg"
                      alt="Categories"
                    />
                  </Link>
                  <h6>
                    <Link href="#">Shoes</Link>
                  </h6>
                  <span>14 Items</span>
                </div>
                <div onClick={()=>setActiveTab('mobiles')} className={`owl-item ${activeTab === 'mobiles' ? 'active' : ''}`} id="mobiles">
                  <Link href="#">
                    <img
                      src="assets/img/categories/category-04.svg"
                      alt="Categories"
                    />
                  </Link>
                  <h6>
                    <Link href="#">Mobiles</Link>
                  </h6>
                  <span>7 Items</span>
                </div>
                <div onClick={()=>setActiveTab('watches')} className={`owl-item ${activeTab === 'watches' ? 'active' : ''}`} id="watches">
                  <Link href="#">
                    <img
                      src="assets/img/categories/category-05.svg"
                      alt="Categories"
                    />
                  </Link>
                  <h6>
                    <Link href="#">Watches</Link>
                  </h6>
                  <span>16 Items</span>
                </div>
                <div onClick={()=>setActiveTab('laptops')} className={`owl-item ${activeTab === 'laptops' ? 'active' : ''}`} id="laptops">
                  <Link href="#">
                    <img
                      src="assets/img/categories/category-06.svg"
                      alt="Categories"
                    />
                  </Link>
                  <h6>
                    <Link href="#">Laptops</Link>
                  </h6>
                  <span>18 Items</span>
                </div>

                
              </Slider>
              <div className="pos-products">
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-3">Products</h4>
                  <div className="input-icon-start pos-search position-relative mb-3">
                    <span className="input-icon-addon">
                      <i className="ti ti-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Product"
                    />
                  </div>
                </div>
                <div className="tabs_container">
                  <div className={`tab_content ${activeTab === 'all' ? 'active' : ''} `} data-tab="all">
                    <div className="row">
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-01.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Mobiles</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">IPhone 14 64GB</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>30 Pcs</span>
                            <p>$15800</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-02.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Computer</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">MacBook Pro</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>140 Pcs</span>
                            <p>$1000</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-03.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Watches</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Rolex Tribute V3</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>220 Pcs</span>
                            <p>$6800</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-04.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Shoes</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Red Nike Angelo</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>78 Pcs</span>
                            <p>$7800</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card active" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-05.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Headphones</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Airpod 2</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>47 Pcs</span>
                            <p>$5478</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-06.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Shoes</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Blue White OGR</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>54 Pcs</span>
                            <p>$987</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-07.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Laptop</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">
                              IdeaPad Slim 5 Gen 7
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>74 Pcs</span>
                            <p>$1454</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-08.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Headphones</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">SWAGME</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>14 Pcs</span>
                            <p>$6587</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-09.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Watches</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">
                              Timex Black Silver
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>24 Pcs</span>
                            <p>$1457</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-10.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Computer</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Tablet 1.02 inch</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>14 Pcs</span>
                            <p>$4744</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-11.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Watches</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">
                              Fossil Pair Of 3 in 1{" "}
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>40 Pcs</span>
                            <p>$789</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-18.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Shoes</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Green Nike Fe</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>78 Pcs</span>
                            <p>$7847</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`tab_content ${activeTab === 'headphones' ? 'active' : ''} `} data-tab="headphones">
                    <div className="row">
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-05.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Headphones</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Airpod 2</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>47 Pcs</span>
                            <p>$5478</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-08.svg"
                              alt="Products"
                            />
                            <span>
                              <Check className="feather-16"/>
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Headphones</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">SWAGME</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>14 Pcs</span>
                            <p>$6587</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`tab_content ${activeTab === 'shoes' ? 'active' : ''} `} data-tab="shoes">
                    <div className="row">
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-04.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Shoes</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Red Nike Angelo</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>78 Pcs</span>
                            <p>$7800</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-06.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Shoes</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Blue White OGR</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>54 Pcs</span>
                            <p>$987</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-18.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Shoes</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Green Nike Fe</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>78 Pcs</span>
                            <p>$7847</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`tab_content ${activeTab === 'mobiles' ? 'active' : ''} `} data-tab="mobiles">
                    <div className="row">
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-01.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Mobiles</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">IPhone 14 64GB</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>30 Pcs</span>
                            <p>$15800</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-14.png"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Mobiles</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Iphone 11</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>14 Pcs</span>
                            <p>$3654</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`tab_content ${activeTab === 'watches' ? 'active' : ''} `} data-tab="watches">
                    <div className="row">
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-03.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Watches</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Rolex Tribute V3</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>220 Pcs</span>
                            <p>$6800</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-09.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Watches</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">
                              Timex Black Silver
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>24 Pcs</span>
                            <p>$1457</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-11.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Watches</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">
                              Fossil Pair Of 3 in 1{" "}
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>40 Pcs</span>
                            <p>$789</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`tab_content ${activeTab === 'laptops' ? 'active' : ''} `} data-tab="laptops">
                    <div className="row">
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-02.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Computer</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">MacBook Pro</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>140 Pcs</span>
                            <p>$1000</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-07.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Laptop</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">
                              IdeaPad Slim 5 Gen 7
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>74 Pcs</span>
                            <p>$1454</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-10.svg"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Computer</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Tablet 1.02 inch</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>14 Pcs</span>
                            <p>$4744</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-13.png"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Laptop</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">Yoga Book 9i</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>65 Pcs</span>
                            <p>$4784</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 col-md-6 col-lg-4 col-xl-3">
                        <div className="product-info card" onClick={()=>setShowAlert1(!showAlert1)} tabIndex={0}>
                          <Link href="#" className="pro-img">
                            <img
                              src="assets/img/products/pos-product-14.png"
                              alt="Products"
                            />
                            <span>
                              <i className="ti ti-circle-check-filled" />
                            </span>
                          </Link>
                          <h6 className="cat-name">
                            <Link href="#">Laptop</Link>
                          </h6>
                          <h6 className="product-name">
                            <Link href="#">IdeaPad Slim 3i</Link>
                          </h6>
                          <div className="d-flex align-items-center justify-content-between price">
                            <span>47 Pcs</span>
                            <p>$1245</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
          {/* /Products */}
        </div>
      </div>
    </div>
    <PosModals/>
  </div>
  );
}