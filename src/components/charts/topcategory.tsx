"use client"; // Required in Next.js App Router

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { FC } from "react";

// Register required components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
    // labels: ['Lifestyles', 'Sports', 'Electronics'],
    datasets: [
        {
            data: [16, 24, 50],
            backgroundColor: ['#092C4C', '#E04F16', '#FE9F43'],
            borderWidth: 5,
            borderRadius: 10,
            hoverBorderWidth: 0,  // Border radius for curved edges
            cutout: '50%', // Makes it a doughnut chart
        },
    ],
};

const options = {
    responsive: true,
    maintainAspectRatio: false,
};

const TopCategoryChart: FC = () => {
    return (
        <div style={{ width: "200px", height: "230px" }}>
            <Doughnut data={data} options={options} />
        </div>
    );
};

export default TopCategoryChart;
