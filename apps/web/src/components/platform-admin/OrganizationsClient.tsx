"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganizationStatus } from "@/actions/platform-admin/organizations";
import { Search, Building, Users, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  organizationType: { name: string };
  admins: Array<{ user: { name: string; email: string } }>;
  _count: { memberships: number; appointments: number };
}

export function OrganizationsClient({ initialOrgs }: { initialOrgs: OrganizationItem[] }) {
  const router = useRouter();
  const [orgs, setOrgs] = useState(initialOrgs);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.organizationType.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (orgId: string, status: string) => {
    if (!confirm(`Are you sure you want to change organization status to ${status}?`)) {
      return;
    }

    setLoadingId(orgId);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("orgId", orgId);
      fd.append("status", status);

      await updateOrganizationStatus(fd);
      setOrgs((prev) => prev.map((o) => (o.id === orgId ? { ...o, status } : o)));
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update organization status");
    } finally {
      setLoadingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "SUSPENDED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ARCHIVED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-body flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[var(--sage-200)] overflow-hidden shadow-xs">
        {/* Search Header */}
        <div className="p-4 border-b border-[var(--sage-200)] bg-[var(--paper)]/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-[var(--sage-200)] w-full sm:w-80 shadow-2xs">
            <Search className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Search by facility name, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm font-body text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)]">
            <Building className="w-4 h-4 text-[var(--teal-900)]" />
            <span>
              Showing <strong className="text-[var(--ink)]">{filtered.length}</strong> of{" "}
              {orgs.length} organizations
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[var(--paper)]/80 border-b border-[var(--sage-200)] text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">
                <th className="px-5 py-3.5">Facility Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Verified</th>
                <th className="px-5 py-3.5">Admins</th>
                <th className="px-5 py-3.5">Staff</th>
                <th className="px-5 py-3.5">Appts</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sage-200)] font-body">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-[var(--ink-soft)] text-sm">
                    No organizations matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-[var(--paper)]/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{org.name}</p>
                        <p className="text-xs font-mono text-[var(--ink-soft)]">/{org.slug}</p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)] font-mono">
                      {org.organizationType.name}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${statusBadge(
                          org.status
                        )}`}
                      >
                        {org.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {org.verificationStatus === "verified" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-amber-700 text-xs font-medium capitalize">
                          {org.verificationStatus}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)]">
                      {org.admins.length > 0
                        ? org.admins.map((a) => a.user.name).join(", ")
                        : "—"}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-[var(--ink-soft)]">
                      {org._count.memberships}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-[var(--ink-soft)]">
                      {org._count.appointments}
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={org.status}
                        onChange={(e) => handleStatusChange(org.id, e.target.value)}
                        disabled={loadingId === org.id}
                        className="rounded-xl border border-[var(--sage-200)] bg-white px-2.5 py-1 text-xs font-body font-medium text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-900)] shadow-2xs"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspend</option>
                        <option value="ARCHIVED">Archive</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
