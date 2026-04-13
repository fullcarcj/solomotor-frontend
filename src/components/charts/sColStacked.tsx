"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsColStackchartwrapper'), { ssr: false });

const SColStacked: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SColStacked;
