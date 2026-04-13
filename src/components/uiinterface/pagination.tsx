"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faArrowLeftLong,
  faArrowRightLong,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const PaginationComponent = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <h4 className="page-title my-auto">Pagination</h4>
          <div>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link href="#">Ui Elements</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Pagination
              </li>
            </ol>
          </div>
        </div>
        <div className="row">
          {/* Basic Pagination */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title"> Basic Pagination </h5>
              </div>
              <div className="card-body">
                <nav aria-label="Page navigation">
                  <ul className="pagination mb-0">
                    <li className="page-item disabled">
                      <Link className="page-link" href="#">
                        Previous
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Basic Pagination */}
          {/* Basic Pagination with Arrow */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Basic Pagination with Arrow</h5>
              </div>
              <div className="card-body">
                <nav aria-label="Page navigation">
                  <ul className="pagination mb-0">
                    <li className="page-item disabled">
                      <Link className="page-link" href="#">
                        {/* <i className="fas fa-arrow-left-long me-2" /> */}
                        <FontAwesomeIcon
                          icon={faArrowLeftLong}
                          className="me-2"
                        />
                        Previous
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        Next
                        {/* <i className="fas fa-arrow-right-long ms-2" /> */}
                        <FontAwesomeIcon
                          icon={faArrowRightLong}
                          className="ms-2"
                        />
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Basic Pagination with Arrow */}
          {/* Basic Pagination with Icons */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Pagination With Icons</h5>
              </div>
              <div className="card-body">
                <nav aria-label="Page navigation">
                  <ul className="pagination mb-0">
                    <li className="page-item">
                      <Link className="page-link" href="#" aria-label="Previous">
                        <span aria-hidden="true">
                          {/* <i className="fas fa-angle-left" /> */}
                          <FontAwesomeIcon icon={faAngleLeft} />
                        </span>
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        3
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#" aria-label="Next">
                        <span aria-hidden="true">
                          {/* <i className="fas fa-angle-right" /> */}
                          <FontAwesomeIcon icon={faAngleRight} />
                        </span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Basic Pagination with Icons */}
          {/* Pagination Sizing */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Pagination Sizing</h5>
              </div>
              <div className="card-body d-flex flex-wrap justify-content-between gap-2">
                <nav aria-label="...">
                  <ul className="pagination pagination-sm mb-0">
                    <li className="page-item active" aria-current="page">
                      <span className="page-link">1</span>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        3
                      </Link>
                    </li>
                  </ul>
                </nav>
                <nav aria-label="...">
                  <ul className="pagination mb-0">
                    <li className="page-item active" aria-current="page">
                      <span className="page-link">1</span>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        3
                      </Link>
                    </li>
                  </ul>
                </nav>
                <nav aria-label="...">
                  <ul className="pagination pagination-lg mb-0">
                    <li className="page-item active" aria-current="page">
                      <span className="page-link">1</span>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        3
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Pagination Sizing */}
          {/* Center & Right Aligned Pagination */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">
                  Center &amp; Right Aligned Pagination{" "}
                </h5>
              </div>
              <div className="card-body">
                <nav aria-label="Page navigation">
                  <ul className="pagination justify-content-center mb-3">
                    <li className="page-item disabled">
                      <Link href="#" className="page-link">Previous</Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        3
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
                <nav aria-label="Page navigation">
                  <ul className="pagination justify-content-end mb-0">
                    <li className="page-item disabled">
                      <Link href="#" className="page-link">Previous</Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        3
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Center & Right Aligned Pagination */}
          {/* Active and Disabled States */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Active and Disabled States</h5>
              </div>
              <div className="card-body d-flex flex-wrap">
                <nav aria-label="..." className="me-3">
                  <ul className="pagination  mb-3">
                    <li className="page-item disabled">
                      <Link href="#" className="page-link">Previous</Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item active" aria-current="page">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
                <nav aria-label="...">
                  <ul className="pagination">
                    <li className="page-item disabled">
                      <span className="page-link">Previous</span>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item active" aria-current="page">
                      <span className="page-link">2</span>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Active and Disabled States */}
          {/* Pagination Style 1 */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Pagination Style 1</h5>
              </div>
              <div className="card-body">
                <nav
                  aria-label="Page navigation"
                  className="pagination-style-1"
                >
                  <ul className="pagination mb-0">
                    <li className="page-item disabled">
                      <Link className="page-link" href="#">
                        {/* <i className="fas fa-angle-left align-middle" /> */}
                        <FontAwesomeIcon
                          icon={faAngleLeft}
                          className="align-middle"
                        />
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item active">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        {/* <i className="fas fa-ellipsis-h" /> */}
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        21
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        <FontAwesomeIcon
                          icon={faAngleRight}
                          className="align-middle"
                        />
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Pagination Style 1 */}
          {/* Pagination Style 2 */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Pagination Style 2</h5>
              </div>
              <div className="card-body">
                <nav
                  aria-label="Page navigation"
                  className="pagination-style-2"
                >
                  <ul className="pagination mb-0 flex-wrap">
                    <li className="page-item disabled">
                      <Link className="page-link" href="#">
                        Prev
                      </Link>
                    </li>
                    <li className="page-item active">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        {/* <i className="fas fa-ellipsis-h" /> */}
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        17
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link text-primary" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Pagination Style 2 */}
          {/* Pagination Style 3 */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Pagination Style 3</h5>
              </div>
              <div className="card-body">
                <nav
                  aria-label="Page navigation"
                  className="pagination-style-3"
                >
                  <ul className="pagination mb-0 flex-wrap">
                    <li className="page-item disabled">
                      <Link className="page-link" href="#">
                        Prev
                      </Link>
                    </li>
                    <li className="page-item active">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        {/* <i className="fas fa-ellipsis-h" /> */}
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        16
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link text-primary" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Pagination Style 3 */}
          {/* Pagination Style 4 */}
          <div className="col-xl-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Pagination Style 4</h5>
              </div>
              <div className="card-body">
                <nav
                  aria-label="Page navigation"
                  className="pagination-style-4"
                >
                  <ul className="pagination mb-0 flex-wrap">
                    <li className="page-item disabled">
                      <Link className="page-link" href="#">
                        Prev
                      </Link>
                    </li>
                    <li className="page-item active">
                      <Link className="page-link" href="#">
                        1
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        2
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        {/* <i className="fas fa-ellipsis-h" /> */}
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        16
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link" href="#">
                        17
                      </Link>
                    </li>
                    <li className="page-item">
                      <Link className="page-link text-primary" href="#">
                        Next
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* /Pagination Style 4 */}
        </div>
      </div>
    </div>
  );
};

export default PaginationComponent;
