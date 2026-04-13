import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../apexwrapperschart/apexactiveSubscriptionchartwrapper'), { ssr: false });

const ActivesubscriptionChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default ActivesubscriptionChart;
