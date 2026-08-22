"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { format, parseISO } from "date-fns";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartSectionProps {
  chartData: Array<{ date: string; booked: number; completed: number }>;
}

export function ChartSection({ chartData }: ChartSectionProps) {
  const barData = useMemo(() => {
    const labels = chartData.map((d) => {
      try {
        return format(parseISO(d.date), "MMM d");
      } catch {
        return d.date;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Booked / Scheduled",
          data: chartData.map((d) => d.booked),
          backgroundColor: "rgba(59, 130, 246, 0.75)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Completed (Prescribed)",
          data: chartData.map((d) => d.completed),
          backgroundColor: "rgba(16, 185, 129, 0.75)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          font: { family: "inherit", size: 12 },
        },
      },
      tooltip: {
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "inherit", size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          font: { family: "inherit", size: 11 },
        },
      },
    },
  };

  return (
    <div className="h-64 sm:h-72 w-full">
      <Bar data={barData} options={options} />
    </div>
  );
}
