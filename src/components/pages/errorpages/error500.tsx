"use client";
/* eslint-disable @next/next/no-img-element */

import { all_routes } from "@/data/all_routes";
import Link from "next/link";
import React from "react";


export default function  Error500Component() {
  const route = all_routes;
  return (
    <div className="main-wrapper">
      <div className="error-box">
        <div className="error-img">
          <img
            src="assets/img/authentication/error-500.png"
            className="img-fluid"
            alt="img"
          />
        </div>
        <h3 className="h2 mb-3">Oops, something went wrong</h3>
        <p>
          Server Error 500. We apologise and are fixing the problem Please try
          again at a later stage
        </p>
        <Link href={route.dashboard} className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};


