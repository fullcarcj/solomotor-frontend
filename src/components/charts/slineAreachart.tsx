"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsAreachartwrapper'), { ssr: false });

const SLineAreaChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SLineAreaChart;
