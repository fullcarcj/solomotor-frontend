"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsColchartwrapper'), { ssr: false });

const SColChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SColChart;
