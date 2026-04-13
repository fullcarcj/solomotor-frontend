"use client"; // Only needed if using Next.js App Router

import React from "react";
import dynamic from "next/dynamic";


// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../charts/apexwrapperschart/apexSalesAnalysischartwrapper'), { ssr: false });

const SalesAnalysisChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SalesAnalysisChart;
