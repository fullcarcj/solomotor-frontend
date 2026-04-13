"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsDonutchartwrapper'), { ssr: false });

const SDonut: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SDonut;
