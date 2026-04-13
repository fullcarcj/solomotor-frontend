'use client';

import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';
import Chart from 'react-apexcharts'; // Ensure this is the correct library for your project

const ApexHeartChartWrapper = () => {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "heatmap",
      height: 370,
    },
    plotOptions: {
      heatmap: {
        radius: 4,
        enableShades: false,
        colorScale: {
          ranges: [
            { from: 0, to: 99, color: "#FFE3CB" },
            { from: 100, to: 200, color: "#FE9F43" },
          ],
        },
      },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: {
      padding: { top: -20, bottom: 0, left: 0, right: 0 },
    },
    yaxis: {
      labels: { offsetX: -15 },
    },
  };

  const series = [
    { name: "2 Am", data: [{ x: "Mon", y: 100 }, { x: "Tue", y: 100 }, { x: "Wed", y: 100 }, { x: "Thu", y: 32 }, { x: "Fri", y: 32 }, { x: "Sat", y: 32 }, { x: "Sun", y: 32 }] },
    { name: "4 Am", data: [{ x: "Mon", y: 100, color: "#ff5722" }, { x: "Tue", y: 100 }, { x: "Wed", y: 100 }, { x: "Thu", y: 120 }, { x: "Fri", y: 32 }, { x: "Sat", y: 50 }, { x: "Sun", y: 40 }] },
    { name: "6 Am", data: [{ x: "Mon", y: 22 }, { x: "Tue", y: 29 }, { x: "Wed", y: 13 }, { x: "Thu", y: 32 }, { x: "Fri", y: 32 }, { x: "Sat", y: 32 }, { x: "Sun", y: 32 }] },
    { name: "8 Am", data: [{ x: "Mon", y: 0 }, { x: "Tue", y: 29 }, { x: "Wed", y: 13 }, { x: "Thu", y: 32 }, { x: "Fri", y: 30 }, { x: "Sat", y: 100 }, { x: "Sun", y: 100 }] },
    { name: "10 Am", data: [{ x: "Mon", y: 200 }, { x: "Tue", y: 200 }, { x: "Wed", y: 200 }, { x: "Thu", y: 32 }, { x: "Fri", y: 0 }, { x: "Sat", y: 0 }, { x: "Sun", y: 32 }] },
    { name: "12 Am", data: [{ x: "Mon", y: 0 }, { x: "Tue", y: 0 }, { x: "Wed", y: 75 }, { x: "Thu", y: 0 }, { x: "Fri", y: 0 }, { x: "Sat", y: 0 }, { x: "Sun", y: 0 }] },
    { name: "14 Pm", data: [{ x: "Mon", y: 0 }, { x: "Tue", y: 20 }, { x: "Wed", y: 13 }, { x: "Thu", y: 32 }, { x: "Fri", y: 0 }, { x: "Sat", y: 0 }, { x: "Sun", y: 32 }] },
    { name: "16 Pm", data: [{ x: "Mon", y: 13 }, { x: "Tue", y: 20 }, { x: "Wed", y: 13 }, { x: "Thu", y: 32 }, { x: "Fri", y: 200 }, { x: "Sat", y: 13 }, { x: "Sun", y: 32 }] },
    { name: "18 Am", data: [{ x: "Mon", y: 0 }, { x: "Tue", y: 20 }, { x: "Wed", y: 13 }, { x: "Thu", y: 32 }, { x: "Fri", y: 0 }, { x: "Sat", y: 200 }, { x: "Sun", y: 200 }] },
  ];

  return (
    <div id="heat_chart">
      <Chart options={options} series={series} type="heatmap" height={370} />
    </div>
  );
};


export default ApexHeartChartWrapper;