"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ApexActiveChartWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const options = {
      chart: {
        height: 350,
        type: "line",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      // colors: ['#4361ee'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
      },
      series: [
        {
          name: "Desktops",
          data: [10, 41, 35, 51, 49, 62, 69, 91, 148],
        },
      ],
  
      grid: {
        row: {
          colors: ["#f1f2f3", "transparent"], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
        ],
      },
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, []);

  return <div ref={chartRef} id="active-chart"></div>;
};

export default ApexActiveChartWrapper;