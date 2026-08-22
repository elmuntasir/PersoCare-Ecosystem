"use client";

import { Activity, CheckCircle, Clock, XCircle } from "lucide-react";

interface SummaryCardsProps {
  summary: {
    totalCompletions: number;
    done: number;
    late: number;
    missed: number;
    adherenceRate?: number;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Activities",
      value: summary.totalCompletions,
      subtext: summary.adherenceRate !== undefined ? `${summary.adherenceRate}% Adherence` : "All logged events",
      icon: Activity,
      color: "text-[var(--teal-900)]",
      bg: "bg-[var(--teal-900)]/10",
      border: "border-[var(--sage-200)]",
    },
    {
      label: "On Time",
      value: summary.done,
      subtext: "Completed as scheduled",
      icon: CheckCircle,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Late",
      value: summary.late,
      subtext: "After target window",
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Missed",
      value: summary.missed,
      subtext: "Not completed",
      icon: XCircle,
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-2xl border ${card.border} p-5 shadow-sm transition-transform hover:-translate-y-0.5 duration-200`}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
              {card.label}
            </span>
            <div className={`p-2 rounded-xl ${card.bg} border border-black/5`}>
              <card.icon className={`w-5 h-5 ${card.color}`} strokeWidth={1.8} />
            </div>
          </div>
          <p className={`text-3xl font-display font-semibold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-[var(--ink-soft)] mt-1 font-body">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}
