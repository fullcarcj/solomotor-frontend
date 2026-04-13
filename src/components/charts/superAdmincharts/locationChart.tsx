import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../apexwrapperschart/apexLocationchartwrapper'), { ssr: false });

const LocationChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default LocationChart;
