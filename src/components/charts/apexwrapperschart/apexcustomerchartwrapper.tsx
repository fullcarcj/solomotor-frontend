'use client';

import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

const ApexCUstomerChartWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: ApexCharts | null = null;

    if (chartRef.current) {
      const radialChart: ApexCharts.ApexOptions = {
        chart: {
          height: 150,
          width: "100%",
          type: "radialBar",
          parentHeightOffset: 0,
          offsetX: 0,
          offsetY: 0,
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          radialBar: {
            hollow: {
              margin: 10,
              size: "30%",
            },
            track: {
              background: "#E6EAED",
              strokeWidth: "100%",
              margin: 5,
            },
            dataLabels: {
              name: {
                offsetY: -5,
              },
              value: {
                offsetY: 5,
              },
            },
          },
        },
        grid: {
          padding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          },
        },
        stroke: {
          lineCap: "round",
        },
        colors: ["#E04F16", "#0E9384"],
        series: [70, 70],
        labels: ["First Time", "Return"],
      };

      chart = new ApexCharts(chartRef.current, radialChart);
      chart.render().then(() => {
        const svg = document.querySelector("#customer-chart .apexcharts-svg");
        if (svg instanceof SVGElement) {
          svg.style.height = "130px";
          svg.style.width = "auto";
        } else {
          console.error("SVG element not found");
        }
      });
    }

    // Cleanup the chart instance on component unmount
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, []);

  return <div id="customer-chart" ref={chartRef}></div>;
};


export default ApexCUstomerChartWrapper;