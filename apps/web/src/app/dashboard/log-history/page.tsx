"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, Clock, XCircle, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import type { LogFilter, LogCategory, LogHistoryResponse } from "@/app/api/log-history/route";

// ─────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  DONE: "bg-emerald-100 text-emerald-800",
  LATE: "bg-amber-100 text-amber-800",
  MISSED: "bg-rose-100 text-rose-800",
};

const CATEGORY_ICON: Record<string, string> = {
  Diet: "🥗",
  Exercise: "🏃",
  Medicine: "💊",
  "Health Diary": "📝",
};

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function LogHistoryPage() {
  const [data, setData] = useState<LogHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<LogFilter>("week");
  const [category, setCategory] = useState<LogCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Debounce search ────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        filter,
        category,
        search: debouncedSearch,
        page: String(page),
      });
      const res = await fetch(`/api/log-history?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: LogHistoryResponse = await res.json();
      setData(json);
    } catch (e) {
      setError("Could not load history. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [filter, category, debouncedSearch, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (f: LogFilter, c: LogCategory) => {
    setFilter(f);
    setCategory(c);
    setPage(1);
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Clean Header ── */}
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--coral)] mb-1">
            Activity History
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)]">Log History</h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
            Review and track all your health activity — diet, exercise, and medicine.
          </p>
        </div>

        {/* ── Filter + Search Bar ── */}
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm flex flex-wrap items-center gap-4">
          {/* Time filter */}
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-medium text-[var(--ink)]">Time:</span>
            <div className="flex rounded-full overflow-hidden border border-[var(--sage-200)]">
              {(["week", "month", "year"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f, category)}
                  className={`px-4 py-1.5 text-sm font-body transition-colors capitalize ${
                    filter === f ? "bg-[var(--teal-900)] text-white" : "bg-white text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-medium text-[var(--ink)]">Category:</span>
            <div className="flex rounded-full overflow-hidden border border-[var(--sage-200)] flex-wrap">
              {(["all", "diet", "exercise", "medicine", "health_diary"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => handleFilterChange(filter, c)}
                  className={`px-4 py-1.5 text-sm font-body transition-colors capitalize ${
                    category === c ? "bg-[var(--teal-900)] text-white" : "bg-white text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  }`}
                >
                  {c === "health_diary" ? "Health Diary" : c}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
            <input
              type="text"
              placeholder="Search by item name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-full border border-[var(--sage-200)] bg-[var(--paper)] font-body text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors font-mono text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="ml-auto text-xs font-mono text-[var(--ink-soft)] whitespace-nowrap">
            {filter === "week" ? "This Week" : filter === "month" ? "This Month" : "This Year"}
            {debouncedSearch && <span className="ml-1 text-[var(--coral)]">· "{debouncedSearch}"</span>}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-700 font-body text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Entries", value: data?.summary.total ?? 0, Icon: Activity, color: "text-[var(--teal-900)]", bg: "bg-[var(--teal-900)]/8" },
            { label: "Completed", value: data?.summary.done ?? 0, Icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Late", value: data?.summary.late ?? 0, Icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Missed", value: data?.summary.missed ?? 0, Icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm`}>
              {isLoading ? (
                <div className="h-12 animate-pulse bg-[var(--sage-200)] rounded-xl" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${card.bg}`}>
                    <card.Icon className={`w-5 h-5 ${card.color}`} strokeWidth={1.6} />
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">{card.label}</p>
                    <p className={`text-2xl font-display ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Data Table ── */}
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-[var(--sage-200)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (data?.tableData || []).length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl mb-3 opacity-40">📭</div>
              <p className="font-display text-lg text-[var(--teal-900)] mb-1">No entries found</p>
              <p className="font-body text-sm text-[var(--ink-soft)]">
                {debouncedSearch ? `No results for "${debouncedSearch}"` : "No activity logged for this period."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--sage-200)]">
                      {["Date", "Category", "Item", "Time Window", "Status", "Completed At"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--sage-200)]">
                    {(data?.tableData || []).map((row) => (
                      <tr key={row.id} className="hover:bg-[var(--paper)] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--ink-soft)] whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-[var(--sage-200)] text-xs font-mono">
                            {CATEGORY_ICON[row.category] || "📌"} {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-body text-[var(--ink)] max-w-[200px] truncate">{row.itemLabel}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--ink-soft)] whitespace-nowrap">{row.timeWindow}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase ${STATUS_STYLE[row.status] || "bg-gray-100 text-gray-700"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--ink-soft)]">{row.completedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-[var(--sage-200)] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-sm text-[var(--ink-soft)]">
                  Showing {(data?.tableData || []).length} of {data?.pagination.totalItems ?? 0} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="p-2 rounded-full border border-[var(--sage-200)] hover:bg-[var(--sage-200)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                  <span className="font-mono text-sm text-[var(--ink-soft)]">
                    {data?.pagination.currentPage ?? 1} / {data?.pagination.totalPages ?? 1}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data?.pagination.totalPages ?? 1, p + 1))}
                    disabled={page >= (data?.pagination.totalPages ?? 1)}
                    aria-label="Next page"
                    className="p-2 rounded-full border border-[var(--sage-200)] hover:bg-[var(--sage-200)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
