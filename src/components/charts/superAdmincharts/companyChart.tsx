"use client"; // Needed for Next.js App Router

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues in Next.js
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CompanyChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 240,
      type: "bar",
      toolbar: { show: false },
    },
    colors: ["#212529"], // Bar color
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        borderRadius: 10,
        borderRadiusWhenStacked: "all",
        horizontal: false,
        columnWidth: "50%",
        colors: {
          backgroundBarColors: ["#f3f4f5"],
          backgroundBarOpacity: 0.5,
        //   hover: {
        //     enabled: true,
        //     borderColor: "#F26522", // Hover color
        //   },
        },
      },
    },
    series: [
      {
        name: "Company",
        data: [40, 60, 20, 80, 60, 60, 60], // Data points
      },
    ],
    xaxis: {
      categories: ["M", "T", "W", "T", "F", "S", "S"],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      labels: {
        offsetX: -15,
        show: false, // Hide Y-axis labels
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        left: -8,
      },
    },
    legend: { show: false },
    dataLabels: { enabled: false }, // Hide labels inside bars
    fill: { opacity: 1 },
  };

  return <ApexChart options={options} series={options.series} type="bar" height={240} />;
};

export default CompanyChart;
