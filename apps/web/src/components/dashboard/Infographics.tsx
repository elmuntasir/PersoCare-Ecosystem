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
import { Activity, CheckCircle, Clock, XCircle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface InfographicsProps {
  data: {
    total: number;
    done: number;
    late: number;
    missed: number;
    chartData: Array<{
      date: string;
      done: number;
      late: number;
      missed: number;
    }>;
  };
}

const statCards = [
  { label: "Total", key: "total", icon: Activity, color: "text-[var(--teal-900)]", bg: "bg-[var(--teal-900)]/10", border: "border-[var(--sage-200)]" },
  { label: "On Time", key: "done", icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { label: "Late", key: "late", icon: Clock, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Missed", key: "missed", icon: XCircle, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
];

export function Infographics({ data }: InfographicsProps) {
  const barChartData = useMemo(() => {
    const labels = data.chartData.map((d) => {
      try {
        return format(parseISO(d.date), "MMM dd");
      } catch {
        return d.date;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Completed",
          data: data.chartData.map((d) => d.done),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Late",
          data: data.chartData.map((d) => d.late),
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "rgb(245, 158, 11)",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Missed",
          data: data.chartData.map((d) => d.missed),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [data.chartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: { family: "Inter, sans-serif", size: 12 },
          color: "#17211e",
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 59, 52, 0.95)",
        titleFont: { family: "Inter, sans-serif" },
        bodyFont: { family: "Inter, sans-serif" },
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Inter, sans-serif", size: 11 }, color: "#4a5852" },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { family: "Inter, sans-serif", size: 11 }, stepSize: 1, color: "#4a5852" },
        grid: { color: "rgba(217, 229, 222, 0.5)" },
      },
    },
  };

  const hasData = data.chartData.some((d) => d.done + d.late + d.missed > 0);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const value = data[card.key as keyof typeof data] as number;
          return (
            <div
              key={card.key}
              className={`${card.bg} rounded-2xl border ${card.border} p-5 shadow-sm transition-transform hover:-translate-y-0.5 duration-200`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.bg} border border-black/5`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} strokeWidth={1.8} />
                </div>
              </div>
              <p className={`text-3xl font-display font-semibold ${card.color}`}>{value}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Canvas */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
        <h4 className="font-display text-lg text-[var(--teal-900)] mb-4">Daily Activity Breakdown</h4>
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[var(--paper)] rounded-xl border border-dashed border-[var(--sage-200)]">
            <p className="font-body text-sm text-[var(--ink-soft)]">No activity logged in this period.</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <Bar options={options} data={barChartData} />
          </div>
        )}
      </div>
    </div>
  );
}
