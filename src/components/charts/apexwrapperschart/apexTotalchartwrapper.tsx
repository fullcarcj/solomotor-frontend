"use client";

import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ApexTotalChartWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const options = {
      series: [
        {
          name: "Messages",
          data: [25, 66, 41, 12, 36, 9, 21],
        },
      ],
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0, // Start with 0 opacity (transparent)
          opacityTo: 0, // End with 0 opacity (transparent)
        },
      },
      chart: {
        foreColor: "#fff",
        type: "area",
        width: 50,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        dropShadow: {
          enabled: false,
          top: 3,
          left: 14,
          blur: 4,
          opacity: 0.12,
          color: "#fff",
        },
        sparkline: {
          enabled: true,
        },
      },
      markers: {
        size: 0,
        colors: ["#F26522"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 7,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "35%",
          endingShape: "rounded",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2.5,
        curve: "smooth",
      },
      colors: ["#F26522"],
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: false,
        },
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function () {
              return "";
            },
          },
        },
        marker: {
          show: false,
        },
      },
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, []);

  return <div ref={chartRef} id="total-chart"></div>;
};

export default ApexTotalChartWrapper;