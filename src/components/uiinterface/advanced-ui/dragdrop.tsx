"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useEffect } from "react";
import Link from "next/link";

const DragAndDropComponent = () => {
  const leftContainerRef = useRef<HTMLDivElement | null>(null);
  const rightContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const leftContainer = leftContainerRef.current;
    const rightContainer = rightContainerRef.current;

    if (leftContainer && rightContainer) {
      const containers = [leftContainer, rightContainer];

      containers.forEach((container) => {
        container.addEventListener("dragstart", handleDragStart);
        container.addEventListener("dragover", handleDragOver);
        container.addEventListener("drop", handleDrop);
      });

      return () => {
        containers.forEach((container) => {
          container.removeEventListener("dragstart", handleDragStart);
          container.removeEventListener("dragover", handleDragOver);
          container.removeEventListener("drop", handleDrop);
        });
      };
    }
  }, []);

  const handleDragStart = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains("draggable")) {
      event.dataTransfer?.setData("text/plain", target.id);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault(); // Allow dropping
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const draggedElementId = event.dataTransfer?.getData("text/plain");
    const draggedElement = document.getElementById(draggedElementId || "");

    if (draggedElement && target && target.classList.contains("droppable")) {
      target.appendChild(draggedElement);
    }
  };

  return (
    <div className="page-wrapper cardhead">
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <h3 className="page-title">Drag &amp; Drop</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href="/">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Drag &amp; Drop</li>
              </ul>
            </div>
          </div>
        </div>
        {/* /Page Header */}
        <div className="row">
          {/* Left Container */}
          <div
            className="col-xl-6 droppable"
            id="draggable-left"
            ref={leftContainerRef}
          >
            <div
              className="card custom-card card-bg-primary draggable"
              id="card-1"
              draggable="true"
            >
              <Link href="#" className="card-anchor" />
              <div className="card-body">
                <blockquote className="blockquote mb-0 text-center">
                  <h6 className="text-fixed-white">
                    The best and most beautiful things in the world cannot be
                    seen or even touched — they must be felt with the heart..
                  </h6>
                  <footer className="blockquote-footer mt-3 fs-14 text-fixed-white op-7">
                    Someone famous as{" "}
                    <cite title="Source Title">-Helen Keller</cite>
                  </footer>
                </blockquote>
              </div>
            </div>
            <div
              className="card custom-card draggable"
              id="card-2"
              draggable="true"
            >
              <div className="card-header justify-content-between">
                <div className="card-title">Card With Fullscreen Button</div>
                <Link href="#" data-bs-toggle="card-fullscreen">
                  <i data-feather="maximize" className="feather-zap" />
                </Link>
              </div>
              <div className="card-body">
                <h6 className="card-text fw-semibold">FullScreen Card</h6>
                <p className="card-text mb-0">
                  There are many variations of passages of Lorem Ipsum
                  available, but the majority have suffered alteration in some
                  form, by injected humour, or randomised words
                </p>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary">Read More</button>
              </div>
            </div>
          </div>
          {/* Right Container */}
          <div
            className="col-xl-6 droppable"
            id="draggable-right"
            ref={rightContainerRef}
          >
            <div
              className="card custom-card draggable"
              id="card-3"
              draggable="true"
            >
              <div className="card-header border-bottom-0 justify-content-between">
                <div className="card-title">Card With Collapse Button</div>
                <Link
                  href="#"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapseExample"
                  aria-expanded="false"
                  aria-controls="collapseExample"
                >
                  <i
                    data-feather="chevron-down"
                    className="fs-18 collapse-open"
                  />
                  <i
                    data-feather="chevron-up"
                    className="collapse-close fs-18"
                  />
                </Link>
              </div>
              <div className="collapse show border-top" id="collapseExample">
                <div className="card-body">
                  <h6 className="card-text fw-semibold">Collapsible Card</h6>
                  <p className="card-text mb-0">
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words
                  </p>
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary">Read More</button>
                </div>
              </div>
            </div>
            <div
              className="card custom-card draggable"
              id="card-4"
              draggable="true"
            >
              <div className="card-header justify-content-between">
                <div className="card-title">Card With Close Button</div>
                <Link href="#" data-bs-toggle="card-remove">
                  <i data-feather="x" className="fs-18" />
                </Link>
              </div>
              <div className="card-body">
                <h6 className="card-text fw-semibold">Closed Card</h6>
                <p className="card-text mb-0">
                  There are many variations of passages of Lorem Ipsum
                  available, but the majority have suffered alteration in some
                  form, by injected humour, or randomised words
                </p>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary">Read More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragAndDropComponent;