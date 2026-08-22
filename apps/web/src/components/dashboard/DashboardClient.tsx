"use client";

import { useState, useEffect } from "react";
import { getDashboardData, type DashboardData, type DashboardRange } from "@/actions/dashboard";
import { UpcomingCards } from "./UpcomingCards";
import { AISection } from "./AISection";
import { Infographics } from "./Infographics";
import { FilterBar } from "@/components/shared/FilterBar";

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DashboardRange>("week");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("range", range);
        const result = await getDashboardData(formData);
        if (isMounted) {
          setData(result);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load dashboard";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const handleFilterChange = (newFilter: "day" | "week" | "month" | "year" | "all") => {
    if (newFilter !== "all") {
      setRange(newFilter);
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── Latest Upcoming Cards (4 cards: Diet, Exercise, Medicine, Appointment) ─── */}
      {data ? (
        <UpcomingCards items={data.upcoming} appointment={data.appointment} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : null}

      {/* ─── AI Suggestions (Minimalist Placeholder) ────────────────── */}
      <AISection />

      {/* ─── Infographics + Filter ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl text-[var(--teal-900)]">Activity Overview</h3>
            <p className="text-xs text-[var(--ink-soft)] font-body">Routine tracking &amp; adherence trends</p>
          </div>
          <FilterBar
            filter={range}
            category="all"
            searchTerm=""
            onFilterChange={handleFilterChange}
            hideCategory
            hideSearch
          />
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center min-h-[300px] bg-white rounded-2xl border border-[var(--sage-200)] shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[var(--teal-900)] border-t-transparent rounded-full animate-spin" />
              <p className="text-[var(--ink-soft)] font-body text-sm">Loading activity infographics...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-rose-700 font-body text-sm font-medium">{error}</p>
          </div>
        )}

        {data && <Infographics data={data.infographics} />}
      </div>
    </div>
  );
}
