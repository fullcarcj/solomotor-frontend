"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Select from "react-select";
import { file } from "@/core/common/selectOption/selectOption";
// Dynamically import heavy libraries
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
const Slider = dynamic(() => import("react-slick"), { ssr: false });

export default function FileManagerComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const video = {
    dots: false,
    autoplay: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    margin: 24,
    speed: 500,
    arrows: true,
    infinite: true,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
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
          slidesToShow: 2,
        },
      },
    ],
  };

  const chartOptions = {
    chart: {
      height: 200,
      type: "donut",
      toolbar: {
        show: false,
      },
      offsetY: -10,
    },
    plotOptions: {
      pie: {
        startAngle: -100,
        endAngle: 100,
        donut: {
          size: "80%",
          labels: {
            show: true,
            name: {
              show: true,
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      show: false,
    },
    colors: ["#0C4B5E", "#FFC107", "#1B84FF", "#AB47BC", "#FD3995"],
    series: [20, 20, 20, 20, 20],
    labels: ["Documents", "Video", "Music", "Photos", "Other"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
    grid: {
      padding: {
        bottom: -60,
      },
    },
  };

  return (
    <>
      <div className="page-wrapper file-manager">
        <div className="content">
          <div className="page-header page-add-notes border-0 flex-sm-row flex-column">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>File Manager</h4>
                <h6 className="mb-0">Manage your files</h6>
              </div>
            </div>
            <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
              <ul className="table-top-head me-2">
                <li>
                  <a
                    href="notes.html"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Refresh"
                  >
                    <i className="ti ti-refresh" />
                  </a>
                </li>
                <li>
                  <a
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Collapse"
                    id="collapse-header"
                  >
                    <i className="ti ti-chevron-up" />
                  </a>
                </li>
              </ul>
              <div className="search-set me-2">
                <div className="search-input">
                  <span className="btn-searchset ms-2">
                    <i className="ti ti-search fs-14 feather-search" />
                  </span>
                  <div
                    id="DataTables_Table_0_filter"
                    className="dataTables_filter"
                  >
                    <label>
                      {" "}
                      <input
                        type="search"
                        className="form-control form-control-sm py-0"
                        placeholder="Search"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-sort me-2">
                <Select
                  classNamePrefix="react-select"
                  options={file}
                  placeholder="Choose"
                />
              </div>
              <div className="page-btn ms-0">
                <a
                  href="#"
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_folder"
                >
                  <i className="ti ti-circle-plus me-1" />
                  Create Folder
                </a>
              </div>
            </div>
          </div>
          <div className="row">
            {/* Dropbox */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <img src="assets/img/icons/dropbox.svg" alt="img" />
                      <h5 className="ms-2">Dropbox</h5>
                    </div>
                    <div className="dropdown">
                      <a
                        href="javascript:void(0);"
                        className="d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-dots" />
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-folder-open me-2" />
                            Open
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-trash me-1" />
                            Delete All
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-status-change me-1" />
                            Reset
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="progress progress-xs flex-grow-1 mb-2">
                    <div
                      className="progress-bar bg-pink rounded"
                      role="progressbar"
                      style={{ width: "20%" }}
                      aria-valuenow={30}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">200 Files</p>
                    <p className="text-title mb-0">28GB</p>
                  </div>
                </div>
              </div>
            </div>
            {/* /Dropbox */}
            {/* Google Drive */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <img src="assets/img/icons/drive.svg" alt="img" />
                      <h5 className="ms-2">Google Drive</h5>
                    </div>
                    <div className="dropdown">
                      <a
                        href="javascript:void(0);"
                        className="d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-dots" />
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-folder-open me-2" />
                            Open
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-trash me-1" />
                            Delete All
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-status-change me-1" />
                            Reset
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="progress progress-xs flex-grow-1 mb-2">
                    <div
                      className="progress-bar bg-pink rounded"
                      role="progressbar"
                      style={{ width: "80%" }}
                      aria-valuenow={30}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">144 Files</p>
                    <p className="text-title mb-0">54GB</p>
                  </div>
                </div>
              </div>
            </div>
            {/* /Google Drive */}
            {/* Cloud Storage */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <img src="assets/img/icons/cloud.svg" alt="img" />
                      <h5 className="ms-2">Cloud Storage</h5>
                    </div>
                    <div className="dropdown">
                      <a
                        href="javascript:void(0);"
                        className="d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-dots" />
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-folder-open me-2" />
                            Open
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-trash me-1" />
                            Delete All
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-status-change me-1" />
                            Reset
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="progress progress-xs flex-grow-1 mb-2">
                    <div
                      className="progress-bar bg-purple rounded"
                      role="progressbar"
                      style={{ width: "50%" }}
                      aria-valuenow={30}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">144 Files</p>
                    <p className="text-title mb-0">54GB</p>
                  </div>
                </div>
              </div>
            </div>
            {/* /Cloud Storage */}
            {/* Internal Storage */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <img src="assets/img/icons/storage.svg" alt="img" />
                      <h5 className="ms-2">Internal Storage</h5>
                    </div>
                    <div className="dropdown">
                      <a
                        href="javascript:void(0);"
                        className="d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-dots" />
                      </a>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-folder-open me-2" />
                            Open
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-trash me-1" />
                            Delete All
                          </a>
                        </li>
                        <li>
                          <a
                            href="javascript:void(0);"
                            className="dropdown-item rounded-1"
                          >
                            <i className="ti ti-status-change me-1" />
                            Reset
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="progress progress-xs flex-grow-1 mb-2">
                    <div
                      className="progress-bar bg-purple rounded"
                      role="progressbar"
                      style={{ width: "20%" }}
                      aria-valuenow={30}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">144 Files</p>
                    <p className="text-title mb-0">54GB</p>
                  </div>
                </div>
              </div>
            </div>
            {/* /Internal Storage */}
          </div>
          <div className="row">
            {/* Sidebar */}
            <div className="col-xl-3  theiaStickySidebar">
              <div className="card">
                <div className="card-body p-3">
                  <div className="shadow-xs p-2 mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center overflow-hidden">
                        <span className="avatar avatar-md rounded-circle">
                          <img
                            src="assets/img/profiles/avatar-29.jpg"
                            alt="img"
                            className="rounded-circle"
                          />
                        </span>
                        <div className="overflow-hidden ms-2">
                          <h5 className="text-truncate">James Hong</h5>
                          <p className="fs-12 text-truncate">
                            Jnh343@example.com
                          </p>
                        </div>
                      </div>
                      <div className="dropdown ms-2">
                        <a
                          href="javascript:void(0);"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </a>
                        <ul className="dropdown-menu  dropdown-menu-end p-3">
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-edit me-1" />
                              Edit
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="file-drop mb-3 text-center">
                    <span className="avatar avatar-sm bg-primary text-white mb-2">
                      <i className="ti ti-upload fs-16" />
                    </span>
                    <h6 className="mb-2">Drop files here</h6>
                    <p className="fs-12 mb-0">
                      Browse and chose the files you want to upload from your
                      computer
                    </p>
                    <input type="file" />
                  </div>
                  <div className="files-list nav d-block">
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2 active"
                    >
                      <i className="ti ti-folder-up me-2" />
                      All Folder / Files
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-star me-2" />
                      Drive
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-octahedron me-2" />
                      Dropbox
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-share-2 me-2" />
                      Shared with Me
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-file me-2" />
                      Document
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-clock-hour-11 me-2" />
                      Recent File
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-star me-2" />
                      Important
                    </a>
                    <a
                      href="#"
                      className="d-flex align-items-center fw-medium p-2"
                    >
                      <i className="ti ti-music me-2" />
                      Media
                    </a>
                  </div>
                </div>
              </div>
              {/* Storage Details */}
              <div className="card">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h4 className="mb-2">Storage Details</h4>
                    <span className="badge badge-success mb-2">Used 77%</span>
                  </div>
                  <div id="storage-chart" />
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center overflow-hidden">
                      <span className="avatar avatar-md bg-info-transparent">
                        <i className="ti ti-music fs-20 text-info" />
                      </span>
                      <div className="overflow-hidden ms-2">
                        <h6 className="text-truncate">Music</h6>
                        <p className="text-truncate">35 Files</p>
                      </div>
                    </div>
                    <p className="text-title">8.5 GB</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center overflow-hidden">
                      <span className="avatar avatar-md bg-warning-transparent">
                        <i className="fa-regular fa-file-audio fs-20 text-warning" />
                      </span>
                      <div className="overflow-hidden ms-2">
                        <h6 className="text-truncate">Video</h6>
                        <p className="text-truncate">145 Files</p>
                      </div>
                    </div>
                    <p className="text-title">2 GB</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center overflow-hidden">
                      <span className="avatar avatar-md bg-secondary-transparent">
                        <i className="ti ti-file-description fs-20 text-secondary" />
                      </span>
                      <div className="overflow-hidden ms-2">
                        <h6 className="text-truncate">Documents</h6>
                        <p className="text-truncate">487 Files</p>
                      </div>
                    </div>
                    <p className="text-title">24.5 GB</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center overflow-hidden">
                      <span className="avatar avatar-md bg-purple-transparent">
                        <i className="ti ti-photo fs-20 text-purple" />
                      </span>
                      <div className="overflow-hidden ms-2">
                        <h6 className="text-truncate">Photos</h6>
                        <p className="text-truncate">35 Files</p>
                      </div>
                    </div>
                    <p className="text-title">8.5 GB</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-0">
                    <div className="d-flex align-items-center overflow-hidden">
                      <span className="avatar avatar-md bg-purple-transparent">
                        <i className="ti ti-file-type-doc fs-20 text-pink" />
                      </span>
                      <div className="overflow-hidden ms-2">
                        <h6 className="text-truncate">Other</h6>
                        <p className="text-truncate">487 Files</p>
                      </div>
                    </div>
                    <p className="text-title">16.2 GB</p>
                  </div>
                </div>
              </div>
              {/* /Storage Details */}
              {/* Upgrade Details */}
              <div className="card bg-black bg-01">
                <div className="card-body text-center">
                  <img
                    src="assets/img/icons/upgrade.svg"
                    alt="img"
                    className="mb-3"
                  />
                  <h6 className="mb-3 text-white">
                    Upgrade to Pro for Unlimited Storage
                  </h6>
                  <a
                    href="javascript:void(0);"
                    className="btn btn-white btn-sm"
                  >
                    Upgrade Now
                    <i className="ti ti-arrow-right ms-1" />
                  </a>
                </div>
              </div>
              {/* /Upgrade Details */}
            </div>
            {/* /Sidebar */}
            <div className="col-xl-9">
              {/* Quick Access */}
              <div className="border-bottom mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h4 className="mb-2">Quick Access</h4>
                  <div>
                    <a
                      href="javascript:void(0);"
                      className="mb-2 me-3 fw-medium link-default"
                    >
                      Close
                    </a>
                    <a
                      href="javascript:void(0);"
                      className="mb-2 fw-medium link-default"
                    >
                      View All
                    </a>
                  </div>
                </div>
                <div className="row row-cols-xxl-5 row-cols-xl-3 row-cols-sm-3 row-cols-1 justify-content-center">
                  <div className="col d-flex">
                    <div className="card access-wrap flex-fill">
                      <div className="card-body text-center">
                        <img
                          src="assets/img/icons/file.svg"
                          alt="img"
                          className="mb-3"
                        />
                        <h6 className="mb-2 fw-medium">
                          <a
                            href="javascript:void(0);"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Final.doc
                          </a>
                        </h6>
                        <span className="badge badge-dark-transparent">
                          2.4 GB
                        </span>
                      </div>
                      <span className="access-rate rating-select">
                        <i className="ti ti-star-filled filled" />
                      </span>
                    </div>
                  </div>
                  <div className="col d-flex">
                    <div className="card access-wrap flex-fill">
                      <div className="card-body text-center">
                        <img
                          src="assets/img/icons/pdf-icon.svg"
                          alt="img"
                          className="mb-3"
                        />
                        <h6 className="mb-2 fw-medium">
                          <a
                            href="javascript:void(0);"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Marklist.pdf
                          </a>
                        </h6>
                        <span className="badge badge-dark-transparent">
                          2.4 GB
                        </span>
                      </div>
                      <span className="access-rate rating-select">
                        <i className="ti ti-star" />
                      </span>
                    </div>
                  </div>
                  <div className="col d-flex">
                    <div className="card access-wrap flex-fill">
                      <div className="card-body text-center">
                        <img
                          src="assets/img/icons/image.svg"
                          alt="img"
                          className="mb-3"
                        />
                        <h6 className="mb-2 fw-medium">
                          <a
                            href="javascript:void(0);"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Nature.png
                          </a>
                        </h6>
                        <span className="badge badge-dark-transparent">
                          2.4 GB
                        </span>
                      </div>
                      <span className="access-rate rating-select">
                        <i className="ti ti-star-filled filled" />
                      </span>
                    </div>
                  </div>
                  <div className="col d-flex">
                    <div className="card access-wrap flex-fill">
                      <div className="card-body text-center">
                        <img
                          src="assets/img/icons/xls-icon.svg"
                          alt="img"
                          className="mb-3"
                        />
                        <h6 className="mb-2 fw-medium">
                          <a
                            href="javascript:void(0);"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            List.xlsx
                          </a>
                        </h6>
                        <span className="badge badge-dark-transparent">
                          2.4 GB
                        </span>
                      </div>
                      <span className="access-rate rating-select">
                        <i className="ti ti-star" />
                      </span>
                    </div>
                  </div>
                  <div className="col d-flex">
                    <div className="card access-wrap flex-fill">
                      <div className="card-body text-center">
                        <img
                          src="assets/img/icons/folder-icon.svg"
                          alt="img"
                          className="mb-3"
                        />
                        <h6 className="mb-2 fw-medium">
                          <a
                            href="javascript:void(0);"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Group Photos
                          </a>
                        </h6>
                        <span className="badge badge-dark-transparent">
                          2.4 GB
                        </span>
                      </div>
                      <span className="access-rate rating-select">
                        <i className="ti ti-star" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Quick Access */}
              {/* Recent Folders */}
              <div className="border-bottom mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h4 className="mb-2">Recent Folders</h4>
                  <div className="dropdown mb-2">
                    <a
                      href="javascript:void(0);"
                      className="dropdown-toggle btn btn-white"
                      data-bs-toggle="dropdown"
                    >
                      Last 7 Days
                    </a>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Last 7 Days
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Last 1 month
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Last 1 year
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="owl-carousel folders-carousel">
                  <div className="folder-wrap bg-white d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="text-warning fs-30">
                        <i className="ti ti-folder-filled" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1">
                          <a
                            href="#"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Personal Assets
                          </a>
                        </h6>
                        <div className="d-flex align-items-center">
                          <p className="fs-12 mb-0 me-2">2.4 GB</p>
                          <p className="fs-12 mb-0 d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-6 me-2 text-title" />
                            135&nbsp;files
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="avatar-list-stacked avatar-group-sm">
                        <span className="avatar avatar-rounded">
                          <img
                            className="border border-white"
                            src="assets/img/profiles/avatar-19.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <img
                            className="border border-white"
                            src="assets/img/profiles/avatar-29.jpg"
                            alt="img"
                          />
                        </span>
                      </div>
                      <div className="dropdown ms-2">
                        <a
                          href="javascript:void(0);"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <a
                              href="javascript:void(0);"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </a>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-eye me-2" />
                              View Details
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-download me-2" />
                              Download
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="folder-wrap bg-white d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="text-warning fs-30">
                        <i className="ti ti-folder-filled" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1">
                          <a
                            href="#"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Document
                          </a>
                        </h6>
                        <div className="d-flex align-items-center">
                          <p className="fs-12 mb-0 me-2">4 GB</p>
                          <p className="fs-12 mb-0 d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-6 me-2 text-title" />
                            15&nbsp;files
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="avatar-list-stacked avatar-group-sm">
                        <span className="avatar avatar-rounded">
                          <img
                            className="border border-white"
                            src="assets/img/profiles/avatar-05.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <img
                            className="border border-white"
                            src="assets/img/profiles/avatar-02.jpg"
                            alt="img"
                          />
                        </span>
                      </div>
                      <div className="dropdown ms-2">
                        <a
                          href="javascript:void(0);"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <a
                              href="javascript:void(0);"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </a>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-eye me-2" />
                              View Details
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-download me-2" />
                              Download
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="folder-wrap bg-white d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="text-warning fs-30">
                        <i className="ti ti-folder-filled" />
                      </span>
                      <div className="ms-2">
                        <h6 className="mb-1">
                          <a
                            href="#"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            Handyimages
                          </a>
                        </h6>
                        <div className="d-flex align-items-center">
                          <p className="fs-12 mb-0 me-2">1.4 GB</p>
                          <p className="fs-12 mb-0 d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-6 me-2 text-title" />
                            115&nbsp;files
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="dropdown ms-2">
                        <a
                          href="javascript:void(0);"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <a
                              href="javascript:void(0);"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </a>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-eye me-2" />
                              View Details
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-download me-2" />
                              Download
                            </a>
                          </li>
                          <li>
                            <a
                              href="javascript:void(0);"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Recent Folders */}
              {/* Recent Files */}
              <div className="border-bottom mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h4 className="mb-2">
                    <Link
                      href="#"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#preview"
                    >
                      Recent Files
                    </Link>
                  </h4>
                  <div className="dropdown mb-2">
                    <Link
                      href="#"
                      className="dropdown-toggle btn btn-white"
                      data-bs-toggle="dropdown"
                    >
                      Last Modified
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link href="#" className="dropdown-item rounded-1">
                          Newest to Oldest
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="dropdown-item rounded-1">
                          Last Modified
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="dropdown-item rounded-1">
                          Oldest to Newest
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <Slider {...video} className="owl-carousel files-carousel">
                  <div className="files-wrap">
                    <div className="bg-transparent-dark p-5 d-flex align-items-center justify-content-center  files-icon">
                      <i className="ti ti-file-description fs-24 text-title" />
                    </div>
                    <div className="bg-white d-flex align-items-center justify-content-between p-3 files-content">
                      <h6 className="fw-medium">customer_data.txt</h6>
                      <div className="dropdown ms-2">
                        <Link
                          href="#"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              href="#"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-eye me-2" />
                              View Details
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-download me-2" />
                              Download
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="files-wrap">
                    <div className="bg-secondary-transparent p-5 d-flex align-items-center justify-content-center files-icon">
                      <i className="ti ti-file-type-pdf fs-24 text-title" />
                    </div>
                    <div className="bg-white d-flex align-items-center justify-content-between p-3 files-content">
                      <h6 className="fw-medium text-truncate">
                        <Link
                          href="#"
                          data-bs-toggle="offcanvas"
                          data-bs-target="#preview"
                        >
                          video_player_installer_setup.rar
                        </Link>
                      </h6>
                      <div className="dropdown ms-2">
                        <Link
                          href="#"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              href="#"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-eye me-2" />
                              View Details
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-download me-2" />
                              Download
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="files-wrap">
                    <div className="bg-secondary-transparent p-5 d-flex align-items-center justify-content-center files-icon">
                      <i className="fa-regular fa-file-audio fs-24 text-title" />
                    </div>
                    <div className="bg-white d-flex align-items-center justify-content-between p-3 files-content">
                      <h6 className="fw-medium text-truncate">
                        <Link
                          href="#"
                          data-bs-toggle="offcanvas"
                          data-bs-target="#preview"
                        >
                          recording.mp3
                        </Link>
                      </h6>
                      <div className="dropdown ms-2">
                        <Link
                          href="#"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              href="#"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-eye me-2" />
                              View Details
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-download me-2" />
                              Download
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="files-wrap">
                    <div className="bg-secondary-transparent p-5 d-flex align-items-center justify-content-center files-icon">
                      <i className="fa-solid fa-file-zipper fs-24 text-title" />
                    </div>
                    <div className="bg-white d-flex align-items-center justify-content-between p-3 files-content">
                      <h6 className="fw-medium">
                        <Link
                          href="#"
                          data-bs-toggle="offcanvas"
                          data-bs-target="#preview"
                        >
                          header_file.zip
                        </Link>
                      </h6>
                      <div className="dropdown ms-2">
                        <Link
                          href="#"
                          className="d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-dots" />
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              href="#"
                              data-bs-toggle="offcanvas"
                              data-bs-target="#preview"
                              className="dropdown-item rounded-1"
                            >
                              <i className="ti ti-folder-open me-2" />
                              Preview
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-copy me-2" />
                              Duplicate
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-arrow-left-right me-2" />
                              Move
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-user-plus me-2" />
                              Invite
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-share-3 me-2" />
                              Share Link
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-eye me-2" />
                              View Details
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-download me-2" />
                              Download
                            </Link>
                          </li>
                          <li>
                            <Link href="#" className="dropdown-item rounded-1">
                              <i className="ti ti-trash-x me-2" />
                              Delete
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Slider>
              </div>
              {/* /Recent Files */}
              {/* Student List */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h4 className="mb-2">Files</h4>
                <div className="d-flex align-items-center">
                  <div className="dropdown mb-2 me-2">
                    <a
                      href="javascript:void(0);"
                      className="dropdown-toggle btn btn-white"
                      data-bs-toggle="dropdown"
                    >
                      Sort By : Docs Type
                    </a>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Docs
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Pdf
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Image
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Folder
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Xml
                        </a>
                      </li>
                    </ul>
                  </div>
                  <a
                    href="javascript:void(0);"
                    className="link-primary fw-medium mb-2"
                  >
                    View All
                  </a>
                </div>
              </div>
              <div className="table-responsive mb-4">
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="select-all"
                          />
                        </div>
                      </th>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Type</th>
                      <th>Modified</th>
                      <th>Share</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <a
                            href="#"
                            className="avatar avatar-md bg-light"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            <img
                              src="assets/img/icons/file-01.svg"
                              className="img-fluid"
                              alt="img"
                            />
                          </a>
                          <div className="ms-2">
                            <p className="text-title fw-medium  mb-0">
                              <a
                                href="#"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#preview"
                              >
                                Secret
                              </a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>7.6 MB</td>
                      <td>Doc</td>
                      <td>
                        <p className="text-title mb-0">Mar 15, 2025</p>
                        <span>05:00:14 PM</span>
                      </td>
                      <td>
                        <div className="avatar-list-stacked avatar-group-sm">
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-27.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-29.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-12.jpg"
                              alt="img"
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rating-select me-2">
                            <a href="javascript:void(0);">
                              <i className="ti ti-star" />
                            </a>
                          </div>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="d-flex align-items-center justify-content-center"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots fs-14" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-trash me-2" />
                                  Permanent Delete
                                </a>
                              </li>
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-edit-circle me-2" />
                                  Restore File
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <a
                            href="#"
                            className="avatar avatar-md bg-light"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            <img
                              src="assets/img/icons/file-02.svg"
                              className="img-fluid"
                              alt="img"
                            />
                          </a>
                          <div className="ms-2">
                            <p className="text-title fw-medium  mb-0">
                              <a
                                href="#"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#preview"
                              >
                                Sophie Headrick
                              </a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>7.4 MB</td>
                      <td>PDF</td>
                      <td>
                        <p className="text-title mb-0">Jan 8, 2025</p>
                        <span>08:20:13 PM</span>
                      </td>
                      <td>
                        <div className="avatar-list-stacked avatar-group-sm">
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-15.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-16.jpg"
                              alt="img"
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rating-select me-2">
                            <a href="javascript:void(0);">
                              <i className="ti ti-star" />
                            </a>
                          </div>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="d-flex align-items-center justify-content-center"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots fs-14" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-trash me-2" />
                                  Permanent Delete
                                </a>
                              </li>
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-edit-circle me-2" />
                                  Restore File
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <a
                            href="#"
                            className="avatar avatar-md bg-light"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            <img
                              src="assets/img/icons/file-03.svg"
                              className="img-fluid"
                              alt="img"
                            />
                          </a>
                          <div className="ms-2">
                            <p className="text-title fw-medium  mb-0">
                              <a
                                href="#"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#preview"
                              >
                                Gallery
                              </a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>6.1 MB</td>
                      <td>Image</td>
                      <td>
                        <p className="text-title mb-0">Aug 6, 2025</p>
                        <span>04:10:12 PM</span>
                      </td>
                      <td>
                        <div className="avatar-list-stacked avatar-group-sm">
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-02.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-03.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-05.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-06.jpg"
                              alt="img"
                            />
                          </span>
                          <a
                            className="avatar bg-primary avatar-rounded text-fixed-white"
                            href="javascript:void(0);"
                          >
                            +1
                          </a>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rating-select me-2">
                            <a href="javascript:void(0);">
                              <i className="ti ti-star" />
                            </a>
                          </div>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="d-flex align-items-center justify-content-center"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots fs-14" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-trash me-2" />
                                  Permanent Delete
                                </a>
                              </li>
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-edit-circle me-2" />
                                  Restore File
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <a
                            href="#"
                            className="avatar avatar-md bg-light"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            <img
                              src="assets/img/icons/file-04.svg"
                              className="img-fluid"
                              alt="img"
                            />
                          </a>
                          <div className="ms-2">
                            <p className="text-title fw-medium  mb-0">
                              <a
                                href="#"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#preview"
                              >
                                Doris Crowley
                              </a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>5.2 MB</td>
                      <td>Folder</td>
                      <td>
                        <p className="text-title mb-0">Jan 6, 2025</p>
                        <span>03:40:14 PM</span>
                      </td>
                      <td>
                        <div className="avatar-list-stacked avatar-group-sm">
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-06.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-10.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-15.jpg"
                              alt="img"
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rating-select me-2">
                            <a href="javascript:void(0);">
                              <i className="ti ti-star" />
                            </a>
                          </div>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="d-flex align-items-center justify-content-center"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots fs-14" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-trash me-2" />
                                  Permanent Delete
                                </a>
                              </li>
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-edit-circle me-2" />
                                  Restore File
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <a
                            href="#"
                            className="avatar avatar-md bg-light"
                            data-bs-toggle="offcanvas"
                            data-bs-target="#preview"
                          >
                            <img
                              src="assets/img/icons/file-05.svg"
                              className="img-fluid"
                              alt="img"
                            />
                          </a>
                          <div className="ms-2">
                            <p className="text-title fw-medium  mb-0">
                              <a
                                href="#"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#preview"
                              >
                                Cheat_codez
                              </a>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>8 MB</td>
                      <td>Xml</td>
                      <td>
                        <p className="text-title mb-0">Oct 12, 2025</p>
                        <span>05:00:14 PM</span>
                      </td>
                      <td>
                        <div className="avatar-list-stacked avatar-group-sm">
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-04.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-28.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-14.jpg"
                              alt="img"
                            />
                          </span>
                          <span className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src="assets/img/profiles/avatar-15.jpg"
                              alt="img"
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rating-select me-2">
                            <a href="javascript:void(0);">
                              <i className="ti ti-star" />
                            </a>
                          </div>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="d-flex align-items-center justify-content-center"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i className="ti ti-dots fs-14" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-right p-3">
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-trash me-2" />
                                  Permanent Delete
                                </a>
                              </li>
                              <li>
                                <a className="dropdown-item rounded-1" href="#">
                                  <i className="ti ti-edit-circle me-2" />
                                  Restore File
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* /Student List */}
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div
        className="sidebar-themesettings offcanvas offcanvas-end"
        id="preview"
      >
        <div className="offcanvas-header d-flex align-items-center justify-content-between bg-dark">
          <div>
            <h4 className="mb-1 text-white">Preview</h4>
          </div>
          <div className="d-flex align-items-center">
            <a
              href="#"
              className="d-flex align-items-center justify-content-center me-3"
            >
              <i className="ti ti-star-filled filled text-warning" />
            </a>
            <a
              href="#"
              className="d-flex align-items-center justify-content-center text-white me-3"
            >
              <i className="ti ti-trash" />
            </a>
            <a
              href="#"
              className="custom-btn-close d-flex align-items-center justify-content-center text-white"
              data-bs-dismiss="offcanvas"
            >
              <i className="ti ti-x" />
            </a>
          </div>
        </div>
        <div className="offcanvas-body p-0">
          <div className="bg-light document-wrap text-center">
            <div className="mb-2">
              <img src="assets/img/icons/pdf-icon.svg" alt="icon" />
            </div>
            <h4 className="mb-1">
              Document Final Proof Read
              <span className="badge badge-secondary-transparent fw-normal fs-12 ms-2">
                2.4 GB
              </span>
            </h4>
            <p>Last Accessed on 15 Mar 2025, 08:15:23 PM</p>
          </div>
          <div className="preview-content">
            <h4 className="mb-3">File Info</h4>
            <div className="file-type p-2 pb-0 gx-2 mb-2">
              <div className="text-center mb-2 border-end me-2">
                <p className="fs-12 mb-0">File Type</p>
                <p className="text-title">PDF</p>
              </div>
              <div className="text-center mb-2 border-end me-2 pe-2">
                <p className="fs-12 mb-0">Created on</p>
                <p className="text-title text-nowrap">22 July 2025, 08:30 PM</p>
              </div>
              <div className="text-center mb-2 border-0">
                <p className="fs-12 mb-0">Location</p>
                <p className="text-title">Drive</p>
              </div>
            </div>
            <div className="mb-4">
              <h6 className="mb-2 fw-medium">Description</h6>
              <div className="editor pages-editor" />
            </div>
            <h4 className="mb-3">Recent Activity</h4>
            <div className="card shadow-none">
              <div className="card-body p-3 pb-0">
                <h6 className="mb-3">Today</h6>
                <ul className="recent-activity mb-3">
                  <li className="d-flex">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-01.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2 flex-grow-1">
                      <p className="mb-0">
                        <span className="text-title">Mercy</span> Added New File
                        in <span className="text-title">Drive</span>
                      </p>
                      <p className="mb-0">05:22 PM</p>
                      <div className="bg-light rounded p-2 d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-video text-title fs-16" />
                          <p className="ms-2">All_files.mp4</p>
                        </div>
                        <span className="fs-12">8.2 MB</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-15.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2 flex-grow-1">
                      <p className="mb-0">
                        <span className="text-title">Druman</span> Added New
                        File in <span className="text-title">ROOT FOLDER</span>
                      </p>
                      <p className="mb-0">05:23 PM</p>
                      <div className="bg-light rounded p-2 d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-photo text-title fs-16" />
                          <p className="ms-2">WebsiteBackupScreen.png</p>
                        </div>
                        <span className="fs-12">3.2 MB</span>
                      </div>
                      <div className="bg-light rounded p-2 d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-file-zip text-title fs-16" />
                          <p className="ms-2">Finaldraft.zip</p>
                        </div>
                        <span className="fs-12">4 MB</span>
                      </div>
                      <div className="bg-light rounded p-2 d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-photo text-title fs-16" />
                          <p className="ms-2">Photo.jpg</p>
                        </div>
                        <span className="fs-12">6.5 MB</span>
                      </div>
                    </div>
                  </li>
                </ul>
                <h6 className="mb-3">28 Jan 2025</h6>
                <ul className="recent-activity mb-3">
                  <li className="d-flex">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-29.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2 flex-grow-1">
                      <p className="mb-0">
                        <span className="text-title">Mercy</span> Added New File
                        in <span className="text-title">Personal Assets</span>
                      </p>
                      <p className="mb-0">05:22 PM</p>
                      <div className="bg-light rounded p-2 d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-photo text-title fs-16" />
                          <p className="ms-2">Photo_12.jpg</p>
                        </div>
                        <span className="fs-12">6.2 MB</span>
                      </div>
                    </div>
                  </li>
                  <li className="d-flex">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-03.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2 flex-grow-1">
                      <p className="mb-0">
                        <span className="text-title">Jackson</span> Added New
                        File in <span className="text-title">Drive</span>
                      </p>
                      <p className="mb-0">05:23 PM</p>
                      <div className="bg-light rounded p-2 d-flex align-items-center justify-content-between mt-1">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-photo text-title fs-16" />
                          <p className="ms-2">Photo.jpg</p>
                        </div>
                        <span className="fs-12">15.5 MB</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="mb-3">Members</h4>
              <a
                href="javascript:void(0);"
                className="fs-12 mb-3"
                data-bs-toggle="modal"
                data-bs-target="#add_member"
              >
                Add Members
              </a>
            </div>
            <div className="card shadow-none mb-0">
              <div className="card-body p-3 pb-0">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-29.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2">
                      <h6 className="fw-medium">Anthony Lewis</h6>
                      <p className="fs-12">Finance</p>
                    </div>
                  </div>
                  <a href="javascript:void(0);" className="user-icon mb-2">
                    <i className="ti ti-user-x fs-16" />
                  </a>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-06.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2">
                      <h6 className="fw-medium">Harvey Smith</h6>
                      <p className="fs-12">Developer</p>
                    </div>
                  </div>
                  <a href="javascript:void(0);" className="user-icon mb-2">
                    <i className="ti ti-user-x fs-16" />
                  </a>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-02.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2">
                      <h6 className="fw-medium">Stephan Peralt</h6>
                      <p className="fs-12">Executive Officer</p>
                    </div>
                  </div>
                  <a href="javascript:void(0);" className="user-icon mb-2">
                    <i className="ti ti-user-x fs-16" />
                  </a>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-26.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2">
                      <h6 className="fw-medium">Doglas Martini</h6>
                      <p className="fs-12">Manager</p>
                    </div>
                  </div>
                  <a href="javascript:void(0);" className="user-icon mb-2">
                    <i className="ti ti-user-x fs-16" />
                  </a>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar avatar-md">
                      <img
                        src="assets/img/profiles/avatar-01.jpg"
                        className="rounded-circle"
                        alt="img"
                      />
                    </span>
                    <div className="ms-2">
                      <h6 className="fw-medium">Linda Ray</h6>
                      <p className="fs-12">Finance</p>
                    </div>
                  </div>
                  <a href="javascript:void(0);" className="user-icon mb-2">
                    <i className="ti ti-user-x fs-16" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Preview */}
      <>
        {/* Create Folder */}
        <div className="modal fade" id="add_folder">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Create Folder</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form action="file-manager.html">
                <div className="modal-body">
                  <div className="mb-0">
                    <label className="form-label">Folder Name</label>
                    <input type="text" className="form-control" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add New Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Create Folder */}
        <>
          {/* Add Customer */}
          <div className="modal fade" id="add_member">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Add Members</h4>
                  <button
                    type="button"
                    className="btn-close custom-btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <i className="ti ti-x" />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="position-relative input-icon mb-3">
                    <span className="input-icon-addon">
                      <i className="ti ti-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search"
                    />
                  </div>
                  <div className="form-check ps-0">
                    <label className="form-check-label member-check-list activate d-flex align-items-center justify-content-between p-2 rounded mb-1">
                      <span className="d-flex align-items-center text-dark">
                        <span className="avatar avatar-md avatar-rounded">
                          <img
                            src="assets/img/profiles/avatar-01.jpg"
                            className="me-2"
                            alt="Img"
                          />
                        </span>
                        Sophie
                      </span>
                      <input
                        type="checkbox"
                        className="form-check-input"
                      />
                    </label>
                    <label className="form-check-label member-check-list d-flex align-items-center justify-content-between p-2 rounded mb-1">
                      <span className="d-flex align-items-center text-dark">
                        <span className="avatar avatar-md avatar-rounded">
                          <img
                            src="assets/img/profiles/avatar-02.jpg"
                            className="me-2"
                            alt="Img"
                          />
                        </span>
                        Cameron
                      </span>
                      <input type="checkbox" className="form-check-input" />
                    </label>
                    <label className="form-check-label member-check-list d-flex align-items-center justify-content-between p-2 rounded mb-1">
                      <span className="d-flex align-items-center text-dark">
                        <span className="avatar avatar-md avatar-rounded">
                          <img
                            src="assets/img/profiles/avatar-03.jpg"
                            className="me-2"
                            alt="Img"
                          />
                        </span>
                        Doris
                      </span>
                      <input type="checkbox" className="form-check-input" />
                    </label>
                    <label className="form-check-label member-check-list d-flex align-items-center justify-content-between p-2 rounded mb-1">
                      <span className="d-flex align-items-center text-dark">
                        <span className="avatar avatar-md avatar-rounded">
                          <img
                            src="assets/img/profiles/avatar-04.jpg"
                            className="me-2"
                            alt="Img"
                          />
                        </span>
                        Rufana
                      </span>
                      <input type="checkbox" className="form-check-input" />
                    </label>
                    <label className="form-check-label member-check-list d-flex align-items-center justify-content-between p-2 rounded mb-1">
                      <span className="d-flex align-items-center text-dark">
                        <span className="avatar avatar-md avatar-rounded">
                          <img
                            src="assets/img/profiles/avatar-04.jpg"
                            className="me-2"
                            alt="Img"
                          />
                        </span>
                        Michael
                      </span>
                      <input type="checkbox" className="form-check-input" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Add Customer */}
        </>
      </>
    </>
  );
}
