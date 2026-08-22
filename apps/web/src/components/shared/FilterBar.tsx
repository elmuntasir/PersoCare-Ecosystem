"use client";

import { Search } from "lucide-react";

interface FilterBarProps {
  filter: "day" | "week" | "month" | "year" | "all";
  category?: "all" | "diet" | "exercise" | "medicine";
  searchTerm?: string;
  onFilterChange: (filter: "day" | "week" | "month" | "year" | "all", category?: string) => void;
  onSearchChange?: (term: string) => void;
  hideCategory?: boolean;
  hideSearch?: boolean;
}

export function FilterBar({
  filter,
  category = "all",
  searchTerm = "",
  onFilterChange,
  onSearchChange,
  hideCategory = false,
  hideSearch = false,
}: FilterBarProps) {
  const timeOptions: Array<"day" | "week" | "month" | "year"> = ["day", "week", "month", "year"];

  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Time filter */}
      <div className="flex items-center gap-2">
        <span className="font-body text-sm font-medium text-[var(--ink)]">Timeframe:</span>
        <div className="flex rounded-full overflow-hidden border border-[var(--sage-200)] bg-[var(--paper)] p-0.5">
          {timeOptions.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f, category)}
              className={`px-4 py-1.5 text-xs md:text-sm font-body font-medium rounded-full transition-all capitalize ${
                filter === f
                  ? "bg-[var(--teal-900)] text-white shadow-xs"
                  : "text-[var(--ink-soft)] hover:text-[var(--teal-900)] hover:bg-[var(--sage-200)]/40"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter if not hidden */}
      {!hideCategory && (
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-medium text-[var(--ink)]">Category:</span>
          <div className="flex rounded-full overflow-hidden border border-[var(--sage-200)] bg-[var(--paper)] p-0.5">
            {(["all", "diet", "exercise", "medicine"] as const).map((c) => (
              <button
                key={c}
                onClick={() => onFilterChange(filter, c)}
                className={`px-3 py-1.5 text-xs md:text-sm font-body font-medium rounded-full transition-all capitalize ${
                  category === c
                    ? "bg-[var(--teal-900)] text-white shadow-xs"
                    : "text-[var(--ink-soft)] hover:text-[var(--teal-900)] hover:bg-[var(--sage-200)]/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search if not hidden */}
      {!hideSearch && onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Search items…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-full border border-[var(--sage-200)] bg-[var(--paper)] font-body text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
