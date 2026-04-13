'use client';

import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

const ApexSalesdayChartWrapper: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) {
      console.error('Chart container is not available.');
      return;
    }

    const sColStacked: ApexCharts.ApexOptions = {
      chart: {
        height: 245,
        type: 'bar',
        stacked: true,
        toolbar: {
          show: false,
        },
      },
      colors: ['#FE9F43', '#FFE3CB'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
              offsetX: -10,
              offsetY: 0,
            },
          },
        },
      ],
      plotOptions: {
        bar: {
          borderRadius: 8,
          horizontal: false,
        },
      },
      series: [
        {
          name: 'Sales',
          data: [18, 20, 10, 18, 25, 18, 10, 20, 40, 8, 30, 20],
        },
        {
          name: 'Purchase',
          data: [40, 30, 30, 50, 40, 50, 30, 30, 50, 30, 40, 30],
        },
      ],
      xaxis: {
        categories: [
          '2 am', '4 am', '6 am', '8 am', '10 am', '12 am', '14 pm', '16 pm', '18 pm', '20 pm', '22 pm', '24 pm',
        ],
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '13px',
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: any) => `${val}K`,
          offsetX: -15,
          style: {
            colors: '#6B7280',
            fontSize: '13px',
          },
        },
      },
      grid: {
        borderColor: '#E5E7EB',
        strokeDashArray: 5,
        padding: {
          left: -16,
          top: 0,
          bottom: 0,
          right: 0,
        },
      },
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        opacity: 1,
      },
    };

    const chart = new ApexCharts(chartRef.current, sColStacked);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, []);

  return <div id="sales-daychart" ref={chartRef}></div>;
};

export default ApexSalesdayChartWrapper;