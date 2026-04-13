"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexSalesStatisticschartwrapper'), { ssr: false });

const SalesStatisticsChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SalesStatisticsChart;