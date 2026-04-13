"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsBarchartwrapper'), { ssr: false });

const SBar: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SBar;
