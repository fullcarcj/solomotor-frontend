"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsOptionchartwrapper'), { ssr: false });

const SOption: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SOption;
