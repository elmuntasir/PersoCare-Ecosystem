"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getApprovalHistory,
  type ApprovalHistoryData,
} from "@/actions/admin/approvalHistory";
import { format } from "date-fns";
import {
  Building,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Utensils,
  AlertCircle,
} from "lucide-react";

export function ApprovalHistoryClient({
  initialData,
}: {
  initialData: ApprovalHistoryData;
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    organizationId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    doctorName: "",
    page: 1,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      if (filters.organizationId) fd.append("organizationId", filters.organizationId);
      if (filters.status) fd.append("status", filters.status);
      if (filters.dateFrom) fd.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) fd.append("dateTo", filters.dateTo);
      if (filters.doctorName) fd.append("doctorName", filters.doctorName);
      fd.append("page", String(filters.page));
      setData(await getApprovalHistory(fd));
    } catch (err: any) {
      setError(err.message ?? "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setFilter = (key: string, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="space-y-5">
      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-[var(--ink-soft)] shrink-0" strokeWidth={1.6} />

        {data.organizations.length > 1 && (
          <select
            value={filters.organizationId}
            onChange={(e) => setFilter("organizationId", e.target.value)}
            className="rounded-full border border-[var(--sage-200)] px-3 py-1.5 text-xs font-mono bg-white"
          >
            <option value="">All Organizations</option>
            {data.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
          className="rounded-full border border-[var(--sage-200)] px-3 py-1.5 text-xs font-mono bg-white"
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter("dateFrom", e.target.value)}
          className="rounded-full border border-[var(--sage-200)] px-3 py-1.5 text-xs font-mono bg-white"
          title="Reviewed from"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter("dateTo", e.target.value)}
          className="rounded-full border border-[var(--sage-200)] px-3 py-1.5 text-xs font-mono bg-white"
          title="Reviewed to"
        />

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-soft)]"
            strokeWidth={1.6}
          />
          <input
            type="text"
            placeholder="Search by doctor name…"
            value={filters.doctorName}
            onChange={(e) => setFilter("doctorName", e.target.value)}
            className="pl-8 pr-4 py-1.5 rounded-full border border-[var(--sage-200)] text-xs font-body bg-white focus:outline-none focus:ring-1 focus:ring-[var(--coral)] w-48"
          />
        </div>

        {loading && (
          <span className="ml-auto text-xs font-mono text-[var(--ink-soft)] animate-pulse">
            Loading…
          </span>
        )}
        {error && (
          <span className="ml-auto text-xs text-rose-600 font-body flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </span>
        )}
      </div>

      {/* ── Results ── */}
      {data.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-10 text-center shadow-xs">
          <CheckCircle className="w-10 h-10 mx-auto text-[var(--ink-soft)] opacity-30 mb-3" strokeWidth={1.6} />
          <p className="font-body text-sm text-[var(--ink-soft)]">
            No approval history matches your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => {
            const isApproved = item.status === "APPROVED";
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: doctor & org info */}
                  <div className="space-y-2 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {item.doctor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm text-[var(--teal-900)]">
                          Dr. {item.doctor.name}
                        </p>
                        <p className="text-[11px] font-mono text-[var(--ink-soft)]">
                          {item.doctor.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-body text-[var(--ink-soft)]">
                      <Building className="w-3.5 h-3.5 text-[var(--teal-700)]" strokeWidth={1.6} />
                      <span>{item.organization.name}</span>
                    </div>

                    {/* Schedule summary */}
                    <div className="p-3 bg-[var(--paper)] rounded-xl border border-[var(--sage-200)] text-[11px] font-mono space-y-1.5">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--ink)]">
                        <span>⏱ {item.assumedVisitDurationMinutes} min/slot</span>
                        <span>🕐 {item.startTime} – {item.endTime}</span>
                        <span>📋 {item.approvalMode}</span>
                      </div>
                      {item.lunchBreakStart && item.lunchBreakEnd && (
                        <div className="flex items-center gap-1.5 text-amber-800">
                          <Utensils className="w-3 h-3 text-amber-600" />
                          Lunch: {item.lunchBreakStart} – {item.lunchBreakEnd}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.workingDays.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 rounded bg-white border border-[var(--sage-200)] text-[10px]"
                          >
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="text-[11px] font-mono text-[var(--ink-soft)] space-y-0.5 pt-0.5">
                      {item.requestedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--coral)]" />
                          Requested:{" "}
                          {format(new Date(item.requestedAt), "MMM dd, yyyy · hh:mm a")}
                        </div>
                      )}
                      {item.reviewedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {isApproved ? "Approved" : "Rejected"}:{" "}
                          {format(new Date(item.reviewedAt), "MMM dd, yyyy · hh:mm a")}
                          {item.reviewedByName && (
                            <span className="text-[var(--ink)]">
                              {" "}by <strong>{item.reviewedByName}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: status badge */}
                  <div className="shrink-0">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-semibold">
                        <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-[var(--ink-soft)]">
            {data.pagination.totalItems} total ·{" "}
            Page {data.pagination.currentPage} of {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={data.pagination.currentPage <= 1}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[var(--sage-200)] text-xs font-mono disabled:opacity-40 hover:bg-[var(--sage-200)] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={data.pagination.currentPage >= data.pagination.totalPages}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[var(--sage-200)] text-xs font-mono disabled:opacity-40 hover:bg-[var(--sage-200)] transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
