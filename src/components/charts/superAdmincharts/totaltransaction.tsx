import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../apexwrapperschart/apextotalTransactionchartwrapper'), { ssr: false });

const TotaltransactionChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default TotaltransactionChart;
