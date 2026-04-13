"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('../charts/apexwrapperschart/apexHeartchartwrapper'), { ssr: false });

const HeatmapChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default HeatmapChart;
