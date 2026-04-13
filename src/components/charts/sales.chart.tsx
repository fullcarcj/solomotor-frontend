"use client"; // Only needed if using Next.js App Router

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to prevent SSR issues
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesChart: React.FC = () => {
  const options: ApexOptions = {
    series: [
      {
        name: "Sales",
        data: [130, 210, 300, 290, 150, 50, 210, 280, 105],
      },
      {
        name: "Purchase",
        data: [-150, -90, -50, -180, -50, -70, -100, -90, -105],
      },
    ],
    colors: ["#28C76F", "#EA5455"],
    chart: {
      type: "bar",
      height: 310,
      stacked: true,
      zoom: { enabled: true },
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "end", // "around" / "end"
        borderRadiusWhenStacked: "all", // "all"/"last"
        columnWidth: "20%",
      },
    },
    dataLabels: { enabled: false },
    yaxis: {
      min: -200,
      max: 300,
      tickAmount: 5,
      labels: { offsetX: -15 }, // Adjust horizontal alignment
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    },
    legend: { show: false },
    fill: { opacity: 1 },
  };

  return (
    <div id="sales_charts">
      <ApexChart options={options} series={options.series} type="bar" height={310} />
    </div>
  );
};

export default SalesChart;
