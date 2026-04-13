"use client";
/* eslint-disable @next/next/no-img-element */

import { all_routes } from "@/data/all_routes";
import Link from "next/link";
import React from "react";


export default function UndermaintainenceComponent () {
  const route = all_routes;
  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper">
        <div className="error-box">
          <div className="error-img">
            <img
              src="assets/img/authentication/under-maintenance.png"
              className="img-fluid"
              alt="Img"
            />
          </div>
          <h3 className="h2 mb-3">We are Under Maintenance</h3>
          <p>
            Sorry for any inconvenience caused, we have almost done Will get back
            soon!
          </p>
          <Link href={route.dashboard} className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>

  );
};

 
