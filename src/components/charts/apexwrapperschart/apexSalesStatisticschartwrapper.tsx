'use client';

import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

const ApexSalesStatisChartWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const options: ApexCharts.ApexOptions = {
        series: [
          {
            name: "Revenue",
            data: [9, 25, 25, 20, 20, 18, 25, 15, 20, 12, 8, 20],
          },
          {
            name: "Expenses",
            data: [-10, -18, -9, -20, -20, -10, -20, -20, -8, -15, -18, -20],
          },
        ],
        grid: {
          padding: {
            top: 5,
            right: 5,
          },
        },
        colors: ["#0E9384", "#E04F16"],
        chart: {
          type: "bar",
          height: 290,
          stacked: true,
          zoom: {
            enabled: true,
          },
        },
        responsive: [
          {
            breakpoint: 280,
            options: {
              legend: {
                position: "bottom",
                offsetY: 0,
              },
            },
          },
        ],
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            borderRadiusApplication: "around",
            borderRadiusWhenStacked: "all",
            columnWidth: "20%",
          },
        },
        dataLabels: {
          enabled: false,
        },
        yaxis: {
          labels: {
            offsetX: -15,
            formatter: (val) => `${val}K`,
          },
          min: -30,
          max: 30,
          tickAmount: 6,
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
            "Oct",
            "Nov",
            "Dec",
          ],
        },
        legend: { show: false },
        fill: {
          opacity: 1,
        },
      };

      const chart = new ApexCharts(chartRef.current, options);
      chart.render();

      return () => {
        chart.destroy();
      };
    }
  }, []);

  return <div id="sales-statistics" ref={chartRef}></div>;
};


export default ApexSalesStatisChartWrapper;