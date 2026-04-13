"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApexChartWrapper = dynamic(() => import('./apexwrapperschart/apexsRadialchartwrapper'), { ssr: false });

const SRadial: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SRadial;
