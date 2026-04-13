"use client"; // Needed for Next.js App Router

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CompanyBarChartProps {
  color: string; // Accepts color as a prop
}

const CompanyBarChart: React.FC<CompanyBarChartProps> = ({ color }) => {
  const options: ApexOptions = {
    series: [{ data: [10, 20, 15, 25, 30, 10, 5] }], // Example data
    chart: {
      type: "bar",
      height: 40,
      width: 52,
      sparkline: { enabled: true }, // Removes axes and labels
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "100%",
        borderRadius: 0,
      },
    },
    colors: [color], // Dynamic color
  };

  return <ApexChart options={options} series={options.series} type="bar" height={40} width={52} />;
};

export default CompanyBarChart;
