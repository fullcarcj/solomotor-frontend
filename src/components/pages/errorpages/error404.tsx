"use client";
/* eslint-disable @next/next/no-img-element */

import { all_routes } from "@/data/all_routes";
import Link from "next/link";
import React from "react";


export default  function Error404Component () {
  const route = all_routes;
  return (
    <div className="main-wrapper">
      <div className="error-box">
        <div className="error-img">
          <img
            src="assets/img/authentication/error-404.png"
            className="img-fluid"
            alt="image"
          />
        </div>
        <h3 className="h2 mb-3">Oops, something went wrong</h3>
        <p>
          Error 404 Page not found. Sorry the page you looking for doesn’t exist
          or has been moved
        </p>
        <Link href={route.dashboard} className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};


