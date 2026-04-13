"use client"; // Needed for Next.js App Router

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues in Next.js
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const RevenueIncomeChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 230,
      type: "bar",
      stacked: true,
      toolbar: { show: false },
    },
    colors: ["#FF6F28", "#F8F9FA"], // Colors for Income and Expenses
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
        borderRadius: 5,
        borderRadiusWhenStacked: "all",
        horizontal: false,
      },
    },
    series: [
      {
        name: "Income",
        data: [40, 30, 45, 80, 85, 90, 80, 80, 80, 85, 20, 80],
      },
      {
        name: "Expenses",
        data: [60, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20],
      },
    ],
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
        formatter: (value) => `${value}K`,
      },
    },
    grid: {
      borderColor: "transparent",
      strokeDashArray: 5,
      padding: {
        left: -8,
      },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val) => `${val / 10} k`,
      },
    },
    fill: { opacity: 1 },
  };

  return <ApexChart options={options} series={options.series} type="bar" height={230} />;
};

export default RevenueIncomeChart;
