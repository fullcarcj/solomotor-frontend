"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const ApexChartWrapper = dynamic(() => import('../charts/apexwrapperschart/apexcustomerchartwrapper'), { ssr: false });

const CustomerChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default CustomerChart;