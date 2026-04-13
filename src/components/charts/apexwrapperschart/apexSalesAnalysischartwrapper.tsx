"use client";

import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ApexSalesAnalysisChartWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const options: ApexCharts.ApexOptions = {
        series: [
          {
            name: "Sales Analysis",
            data: [25, 50, 55, 30, 40, 50, 30, 20, 40, 35, 40, 20],
          },
        ],
        chart: {
          height: 310,
          type: "area",
          zoom: { enabled: false },
        },
        colors: ["#FF9F43"],
        dataLabels: { enabled: false },
        stroke: { curve: "straight" },
        title: { text: "", align: "left" },
        xaxis: {
          categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
        },
        yaxis: {
          min: 10,
          max: 60,
          tickAmount: 5,
          labels: {
            offsetX: -15,
            formatter: (val: any) => `${val}K`, // Converts values to "K" format
          },
        },
        legend: {
          position: "top",
          horizontalAlign: "left",
        },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      // Cleanup the chart instance on component unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);

  return <div id="sales-analysis" ref={chartRef}></div>;
};

export default ApexSalesAnalysisChartWrapper;