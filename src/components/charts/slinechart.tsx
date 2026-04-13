"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsLinechartwrapper'), { ssr: false });

const SlineChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SlineChart;
