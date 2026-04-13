"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import Link from "next/link";
import { all_routes } from "@/data/all_routes";
import SlineChart from "@/components/charts/slinechart";
import SLineAreaChart from "@/components/charts/slineAreachart";
import SColChart from "@/components/charts/sColchart";
import SColStacked from "@/components/charts/sColStacked";
import SBar from "@/components/charts/sBar";
import SDonut from "@/components/charts/sdonutChart";
import SRadial from "@/components/charts/sradialChart";

const routes = all_routes;
const ApexchartComponent = () => {
 

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        {/* Page Header */}
        <div className="page-header">
          <div className="row">
            <div className="col-sm-12">
              <h3 className="page-title">Charts</h3>
              <ul className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link href={routes.dashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">Charts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* /Page Header */}
        <div className="row">
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Apex Simple</h5>
              </div>
              <div className="card-body">
                <div id="s-line" />
                <SlineChart />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Area Chart</h5>
              </div>
              <div className="card-body">
                <div id="s-line-area" />
                <SLineAreaChart />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Column Chart</h5>
              </div>
              <div className="card-body">
                <div id="s-col" />
                <SColChart />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Column Stacked Chart</h5>
              </div>
              <div className="card-body">
                <div id="s-col-stacked" />
                <SColStacked />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Bar Chart</h5>
              </div>
              <div className="card-body">
                <div id="s-bar" />
                <SBar />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Mixed Chart</h5>
              </div>
              <div className="card-body">
                <div id="mixed-chart" />
                <SDonut />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Donut Chart</h5>
              </div>
              <div className="card-body">
                <div id="donut-chart" />
                <SDonut />
              </div>
            </div>
          </div>
          {/* /Chart */}
          {/* Chart */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Radial Chart</h5>
              </div>
              <div className="card-body">
                <div id="radial-chart" />
               <SRadial/>
              </div>
            </div>
          </div>
          {/* /Chart */}
        </div>
      </div>
    </div>
  );
};

export default ApexchartComponent;
