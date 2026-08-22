"use client";

import { useState, useEffect } from "react";
import { getMemberHistory } from "@/actions/admin/employees";
import { format } from "date-fns";
import { Search, Filter, User, Clock } from "lucide-react";

type MemberHistoryData = Awaited<ReturnType<typeof getMemberHistory>>;

interface MemberHistoryClientProps {
  initialData: MemberHistoryData;
  organizationId: string;
}

const actionLabels: Record<string, string> = {
  INVITE_SENT: "Invitation Sent",
  INVITE_ACCEPTED: "Invitation Accepted",
  INVITE_DECLINED: "Invitation Declined",
  MEMBER_ADDED: "Member Added Directly",
  MEMBER_REMOVED: "Member Removed",
  ROLE_CHANGED: "Role Changed",
  DEPARTMENT_CHANGED: "Department Changed",
  REACTIVATED: "Member Reactivated",
};

const actionColors: Record<string, string> = {
  INVITE_SENT: "bg-blue-100 text-blue-800 border-blue-200",
  INVITE_ACCEPTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INVITE_DECLINED: "bg-rose-100 text-rose-800 border-rose-200",
  MEMBER_ADDED: "bg-purple-100 text-purple-800 border-purple-200",
  MEMBER_REMOVED: "bg-rose-100 text-rose-800 border-rose-200",
  ROLE_CHANGED: "bg-amber-100 text-amber-800 border-amber-200",
  DEPARTMENT_CHANGED: "bg-amber-100 text-amber-800 border-amber-200",
  REACTIVATED: "bg-teal-100 text-teal-800 border-teal-200",
};

export function MemberHistoryClient({ initialData, organizationId }: MemberHistoryClientProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    dateFrom: "",
    dateTo: "",
    targetName: "",
    page: 1,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const fd = new FormData();
        fd.append("organizationId", organizationId);
        if (filters.action) fd.append("action", filters.action);
        if (filters.dateFrom) fd.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) fd.append("dateTo", filters.dateTo);
        if (filters.targetName) fd.append("targetName", filters.targetName);
        fd.append("page", String(filters.page));

        const result = await getMemberHistory(fd);
        if (!active) return;
        setData(result);
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load audit history");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [organizationId, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const actionOptions = Object.entries(actionLabels).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-4 md:p-5 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[var(--ink-soft)] font-semibold shrink-0">
          <Filter className="w-4 h-4 text-[var(--teal-900)]" strokeWidth={1.8} />
          Filters:
        </div>

        <select
          value={filters.action}
          onChange={(e) => handleFilterChange("action", e.target.value)}
          aria-label="Filter by action"
          className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)]/50 px-3.5 py-1.5 text-xs font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
        >
          <option value="">All Management Actions</option>
          {actionOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          aria-label="Filter from date"
          className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)]/50 px-3.5 py-1.5 text-xs font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          aria-label="Filter to date"
          className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)]/50 px-3.5 py-1.5 text-xs font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
        />

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search by member name..."
            value={filters.targetName}
            onChange={(e) => handleFilterChange("targetName", e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-[var(--sage-200)] bg-[var(--paper)]/50 text-xs font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
          />
        </div>
      </div>

      {/* State views */}
      {loading && (
        <div className="text-center py-10 font-mono text-xs text-[var(--ink-soft)] animate-pulse bg-white rounded-3xl border border-[var(--sage-200)]">
          Loading member history audit trail…
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-body">
          {error}
        </div>
      )}

      {!loading && data.items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center shadow-sm">
          <Clock className="w-12 h-12 mx-auto text-[var(--ink-soft)] opacity-30 mb-3" strokeWidth={1.4} />
          <p className="font-body text-base font-semibold text-[var(--teal-900)]">No member history events found</p>
          <p className="text-xs text-[var(--ink-soft)] font-body mt-1">
            Actions like invitations, onboardings, role changes, and removals will be audited here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => {
            const actionLabel = actionLabels[item.action] || item.action;
            const color = actionColors[item.action] || "bg-gray-100 text-gray-800 border-gray-200";

            let detailText = "";
            const details = item.details as any;
            if (item.action === "INVITE_SENT" || item.action === "INVITE_ACCEPTED" || item.action === "INVITE_DECLINED") {
              detailText = `Role: ${details?.role || "Staff"}`;
            } else if (item.action === "MEMBER_REMOVED") {
              detailText = `Role: ${details?.role || "Staff"}${
                details?.reason ? ` (${details.reason})` : ""
              }`;
            } else if (item.action === "ROLE_CHANGED") {
              detailText = `${details?.oldRole || "Staff"} → ${details?.newRole || "Staff"}`;
            } else if (item.action === "DEPARTMENT_CHANGED") {
              detailText = "Department reassigned";
            } else if (item.action === "MEMBER_ADDED") {
              detailText = `Role: ${details?.role || "Staff"}`;
            }

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs hover:border-[var(--teal-900)]/30 transition-all space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-teal-50 text-[var(--teal-900)]">
                        <User className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      <span className="font-body font-bold text-sm text-[var(--ink)]">
                        {item.targetUser.name}
                      </span>
                      <span className="text-xs text-[var(--ink-soft)] font-mono">
                        ({item.targetUser.email})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-body text-[var(--ink-soft)]">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold border ${color}`}>
                        {actionLabel}
                      </span>
                      {detailText && <span>• {detailText}</span>}
                    </div>
                  </div>

                  <div className="text-right text-xs font-body text-[var(--ink-soft)] space-y-0.5">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-[var(--coral)]" />
                      {format(new Date(item.createdAt), "MMM dd, yyyy · hh:mm a")}
                    </span>
                    <p className="text-[11px]">
                      Admin: <strong className="text-[var(--teal-900)]">{item.actedByUser.name}</strong>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => handlePageChange(data.pagination.currentPage - 1)}
            disabled={data.pagination.currentPage <= 1}
            className="px-4 py-1.5 rounded-full border border-[var(--sage-200)] bg-white text-xs font-body font-semibold text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-[var(--ink-soft)]">
            Page {data.pagination.currentPage} of {data.pagination.totalPages} ({data.pagination.totalItems} total actions)
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(data.pagination.currentPage + 1)}
            disabled={data.pagination.currentPage >= data.pagination.totalPages}
            className="px-4 py-1.5 rounded-full border border-[var(--sage-200)] bg-white text-xs font-body font-semibold text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
