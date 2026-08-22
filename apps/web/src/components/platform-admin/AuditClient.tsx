"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "@/actions/platform-admin/audit";
import { format } from "date-fns";
import { Search, Filter, RotateCw, Activity } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  } | null;
}

export function AuditClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    fromDate: "",
    toDate: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      if (filters.action) fd.append("action", filters.action);
      if (filters.userId) fd.append("userId", filters.userId);
      if (filters.fromDate) fd.append("fromDate", filters.fromDate);
      if (filters.toDate) fd.append("toDate", filters.toDate);

      const data = await getAuditLogs(fd);
      setLogs(data as AuditLogEntry[]);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="bg-white rounded-3xl border border-[var(--sage-200)] overflow-hidden shadow-xs">
      {/* Filters Header */}
      <div className="p-4 border-b border-[var(--sage-200)] bg-[var(--paper)]/50 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider mr-2">
          <Filter className="w-4 h-4 text-[var(--teal-900)]" />
          <span>Filters:</span>
        </div>

        <input
          type="text"
          placeholder="Filter by action (e.g. ORG_)"
          value={filters.action}
          onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
          className="rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 text-xs font-body text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--teal-900)]"
        />

        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
          className="rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 text-xs font-mono text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-900)]"
          title="From date"
        />

        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          className="rounded-xl border border-[var(--sage-200)] bg-white px-3 py-1.5 text-xs font-mono text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-900)]"
          title="To date"
        />

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--teal-900)] text-white text-xs font-body font-semibold hover:bg-[var(--teal-900)]/90 transition-colors disabled:opacity-60"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>

        {(filters.action || filters.fromDate || filters.toDate) && (
          <button
            type="button"
            onClick={() => setFilters({ action: "", userId: "", fromDate: "", toDate: "" })}
            className="text-xs font-body text-[var(--coral)] hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[var(--paper)]/80 border-b border-[var(--sage-200)] text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Actor</th>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sage-200)] font-body">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[var(--ink-soft)] text-sm">
                  Loading system audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[var(--ink-soft)] text-sm">
                  No system audit logs found matching the filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--paper)]/40 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-[var(--ink-soft)] whitespace-nowrap">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>

                  <td className="px-5 py-3.5">
                    {log.user ? (
                      <div>
                        <p className="font-semibold text-[var(--ink)] text-xs">{log.user.name}</p>
                        <p className="text-[11px] font-mono text-[var(--ink-soft)]">
                          {log.user.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[var(--ink-soft)]">System</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--teal-900)]/10 text-[var(--teal-900)] text-[11px] font-mono font-medium">
                      <Activity className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)] max-w-md break-words font-mono">
                    {log.details ? (
                      typeof log.details === "object" ? (
                        <pre className="p-2 rounded-lg bg-[var(--paper)] text-[11px] text-[var(--ink)] overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        String(log.details)
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
