import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../apexwrapperschart/apexTotalchartwrapper'), { ssr: false });

const TotalChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default TotalChart;
