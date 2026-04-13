"use client";

import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const ApexTotalTransactionWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const options = {
      series: [{
        name: "",
        data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
      }],
      fill: {
        type: "solid",
        opacity: 1
      },
      chart: {
        foreColor: '#fff',
        type: "area" as "area",
        width: 80,
        toolbar: {
          show: !1
        },
        zoom: {
          enabled: !1
        },
        dropShadow: {
          enabled: false,
          top: 3,
          left: 14,
          blur: 4,
          opacity: .12,
          color: "#fff"
        },
        sparkline: {
          enabled: !0
        }
      },
      markers: {
        size: 0,
        colors: ["#F7A37A"],
        strokeColors: "#fff",
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      plotOptions: {
        bar: {
          horizontal: !1,
          columnWidth: "35%",
          borderRadius: 5,
        }
      },
      dataLabels: {
        enabled: !1
      },
      // stroke: {
      //   show: !0,
      //   width: 2.5,
      //   curve: "smooth"
      // },
      stroke: {
        width: 0,
        curve: 'monotoneCubic'
      },
      colors: ["#F7A37A"],
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: !1
        },
        x: {
          show: !1
        },
  
        marker: {
          show: !1
        }
      }
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, []);

  return <div ref={chartRef} id="total-chart"></div>;
};

export default ApexTotalTransactionWrapper;