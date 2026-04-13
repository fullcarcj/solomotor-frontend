"use client"; // Needed for Next.js App Router

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to prevent SSR issues in Next.js
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PlanOverviewChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      height: 240,
      type: "donut",
      toolbar: { show: false },
    },
    colors: ["#FFC107", "#1B84FF", "#F26522"],
    series: [20, 60, 20],
    labels: ["Enterprise", "Premium", "Basic"],
    plotOptions: {
      pie: {
        donut: {
          size: "50%",
          labels: { show: false },
        },
      },
    },
    stroke: {
      lineCap: "round",
      show: true,
      width: 0, // Space between donut sections
      colors: ["#fff"],
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { height: 180 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  return (
    <ApexChart
      options={options}
      series={options.series as number[]} // Type assertion to avoid type errors
      type="donut"
      height={240}
    />
  );
};

export default PlanOverviewChart;
