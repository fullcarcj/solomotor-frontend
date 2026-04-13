"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ProductDetailsComponent = () => {
const sliderRef = useRef<Slider | null>(null);

  const settings = {
    dots: false,
    arrows: false, // hide built-in arrows
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1170, settings: { slidesToShow: 1 } },
      { breakpoint: 800, settings: { slidesToShow: 1 } },
      { breakpoint: 0, settings: { slidesToShow: 1 } },
    ],
  };
  return (
    <div className="page-wrapper">
  <div className="content">
    <div className="page-header">
      <div className="page-title">
        <h4>Product Details</h4>
        <h6>Full details of a product</h6>
      </div>
    </div>
    {/* /add */}
    <div className="row">
      <div className="col-lg-8 col-sm-12">
        <div className="card">
          <div className="card-body">
            <div className="bar-code-view">
              <div className="product-details-barcode">
                <img
                  src="/assets/img/barcode/barcode1.png"
                  className="barcode"
                  alt="barcode"
                />
                <img
                  src="/assets/img/barcode/barcode1-white.png"
                  className="barcode-white"
                  alt="barcode"
                />
              </div>
              <Link href="#" className="printimg">
                <i className="ti ti-printer fs-24 text-dark" />
              </Link>
            </div>
            <div className="productdetails">
              <ul className="product-bar">
                <li>
                  <h4>Product</h4>
                  <h6>Macbook pro </h6>
                </li>
                <li>
                  <h4>Category</h4>
                  <h6>Computers</h6>
                </li>
                <li>
                  <h4>Sub Category</h4>
                  <h6>None</h6>
                </li>
                <li>
                  <h4>Brand</h4>
                  <h6>None</h6>
                </li>
                <li>
                  <h4>Unit</h4>
                  <h6>Piece</h6>
                </li>
                <li>
                  <h4>SKU</h4>
                  <h6>PT0001</h6>
                </li>
                <li>
                  <h4>Minimum Qty</h4>
                  <h6>5</h6>
                </li>
                <li>
                  <h4>Quantity</h4>
                  <h6>50</h6>
                </li>
                <li>
                  <h4>Tax</h4>
                  <h6>0.00 %</h6>
                </li>
                <li>
                  <h4>Discount Type</h4>
                  <h6>Percentage</h6>
                </li>
                <li>
                  <h4>Price</h4>
                  <h6>1500.00</h6>
                </li>
                <li>
                  <h4>Status</h4>
                  <h6>Active</h6>
                </li>
                <li>
                  <h4>Description</h4>
                  <h6>
                    Designed for professionals, it offers smooth multitasking
                    and high-end graphics capability.
                  </h6>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4 col-sm-12">
        <div className="card">
          <div className="card-body">
           <div className="slider-product-details">

      {/* Slider */}
      <Slider ref={sliderRef} {...settings} className="product-slide">
        <div className="slider-product">
          <img src="assets/img/products/product69.jpg" alt="img" />
          <h4 className="text-dark">macbookpro.jpg</h4>
          <h6 className="text-dark">581kb</h6>
        </div>

        <div className="slider-product">
          <img src="assets/img/products/product69.jpg" alt="img" />
          <h4 className="text-dark">macbookpro.jpg</h4>
          <h6 className="text-dark">581kb</h6>
        </div>
      </Slider>

      {/* External Buttons */}
      <div className="product-nav-controls d-flex align-items-center justify-content-between">
        <button
          className="product-prev"
          onClick={() => sliderRef.current?.slickPrev()}
        >
          <i className="fa fa-chevron-left" />
        </button>

        <button
          className="product-next"
          onClick={() => sliderRef.current?.slickNext()}
        >
          <i className="fa fa-chevron-right" />
        </button>
      </div>

    </div>
          </div>
        </div>
      </div>
    </div>
    {/* /add */}
  </div>
</div>

  )
}

export default ProductDetailsComponent