import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";
import dynamic from "next/dynamic";

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../apexwrapperschart/apexActivechartwrapper'), { ssr: false });

const ActiveCompanyChart: React.FC = () => {
  return <ApexChartWrapper />;
};;

export default ActiveCompanyChart;
