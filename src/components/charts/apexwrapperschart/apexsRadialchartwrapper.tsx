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
        type: "radialBar",
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: "22px",
            },
            value: {
              fontSize: "16px",
            },
            total: {
              show: true,
              label: "Total",
              formatter: function () {
                return 249;
              },
            },
          },
        },
      },
      series: [44, 55, 67, 83],
      labels: ["Apples", "Oranges", "Bananas", "Berries"],
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