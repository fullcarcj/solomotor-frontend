'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the wrapper component
const ApexChartWrapper = dynamic(() => import('../charts/apexwrapperschart/apexsalesdaychartwrapper'), { ssr: false });

const SalesDayChart: React.FC = () => {
  return <ApexChartWrapper />;
};

export default SalesDayChart;
