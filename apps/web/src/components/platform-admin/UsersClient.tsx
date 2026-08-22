"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, UserCheck, Shield, Users as UsersIcon } from "lucide-react";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  createdAt: string;
  platformOwner: { id: string } | null;
  professions: Array<{ professionType: { name: string }; status: string }>;
}

export function UsersClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const [search, setSearch] = useState("");
  const [users] = useState<UserItem[]>(initialUsers);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="bg-white rounded-3xl border border-[var(--sage-200)] overflow-hidden shadow-xs">
      {/* Search Header */}
      <div className="p-4 border-b border-[var(--sage-200)] bg-[var(--paper)]/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-[var(--sage-200)] w-full sm:w-80 shadow-2xs">
          <Search className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-body text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)]">
          <UsersIcon className="w-4 h-4 text-[var(--teal-900)]" />
          <span>
            Showing <strong className="text-[var(--ink)]">{filtered.length}</strong> of{" "}
            {users.length} users
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[var(--paper)]/80 border-b border-[var(--sage-200)] text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Contact</th>
              <th className="px-5 py-3.5">Gender / DOB</th>
              <th className="px-5 py-3.5">Joined Date</th>
              <th className="px-5 py-3.5">Platform Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sage-200)] font-body">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[var(--ink-soft)] text-sm">
                  No users matched your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--paper)]/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--ink)] truncate">{u.name}</p>
                        <p className="text-xs text-[var(--ink-soft)] truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)] font-mono">
                    {u.phone || "—"}
                  </td>

                  <td className="px-5 py-3.5 text-xs text-[var(--ink-soft)]">
                    {u.gender ? (
                      <span className="capitalize">{u.gender.toLowerCase()}</span>
                    ) : (
                      "—"
                    )}
                    {u.dob && (
                      <span className="block text-[11px] font-mono mt-0.5">
                        {format(new Date(u.dob), "MMM d, yyyy")}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-xs font-mono text-[var(--ink-soft)]">
                    {format(new Date(u.createdAt), "MMM d, yyyy")}
                  </td>

                  <td className="px-5 py-3.5">
                    {u.platformOwner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--teal-900)] text-white text-[11px] font-mono font-medium shadow-2xs">
                        <Shield className="w-3 h-3" />
                        Platform Owner
                      </span>
                    ) : u.professions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.professions.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-medium"
                          >
                            <UserCheck className="w-3 h-3" />
                            {p.professionType.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-mono">
                        Patient / User
                      </span>
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
