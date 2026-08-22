"use client";

import { Sparkles } from "lucide-react";

export function AISection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--teal-900)] to-[var(--teal-700)] p-7 md:p-8 shadow-md border border-[var(--teal-700)] text-white">
      {/* Decorative gradient blur blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shrink-0">
          <Sparkles className="w-6 h-6 text-emerald-300" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-display text-xl md:text-2xl text-white font-semibold">AI Health Insights</h3>
          <p className="font-body text-emerald-100/80 text-sm mt-0.5 max-w-2xl leading-relaxed">
            Smart recommendations and contextual alerts analyzing your routines, diet split, and recovery consistency.
          </p>
        </div>
      </div>
    </div>
  );
}
