import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../apexwrapperschart/apextotalSubscriptionchartwrapper'), { ssr: false });

const TotalsubscriptionChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default TotalsubscriptionChart;
