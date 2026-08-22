"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondToEmployeeInvitationDoctor } from "@/actions/doctor/organization";
import { getDoctorOrganizations } from "@/actions/doctor/organization";
import { ScheduleEditor } from "./ScheduleEditor";
import {
  Building,
  Mail,
  CheckCircle,
  XCircle,
  MapPin,
  UserCheck,
  FolderTree,
  ShieldCheck,
} from "lucide-react";

type OrgData = Awaited<ReturnType<typeof getDoctorOrganizations>>;

export function MyOrganizationClient({ data }: { data: OrgData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setLoading(invitationId + accept);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("invitationId", invitationId);
      fd.append("accept", String(accept));
      await respondToEmployeeInvitationDoctor(fd);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Pending Invitations ── */}
      {data.invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
          <h3 className="font-display text-lg text-[var(--teal-900)] font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-500" strokeWidth={1.8} />
            Pending Facility Invitations
            <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-mono rounded-full">
              {data.invitations.length}
            </span>
          </h3>

          <div className="space-y-3">
            {data.invitations.map((inv) => {
              const isActing = loading === inv.id + "true" || loading === inv.id + "false";
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100"
                >
                  <div>
                    <p className="font-body font-semibold text-sm text-[var(--ink)]">
                      {inv.organization.name}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
                      Invited by {inv.invitedBy.name} · Role:{" "}
                      <span className="font-mono font-semibold">{inv.role}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleRespond(inv.id, true)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-body font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(inv.id, false)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-body font-semibold hover:bg-rose-700 transition-colors disabled:opacity-60"
                    >
                      <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600 font-body bg-rose-50 rounded-xl px-4 py-2.5 border border-rose-200">
          {error}
        </p>
      )}

      {/* ── Active Affiliations ── */}
      {data.employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-12 text-center shadow-sm">
          <Building
            className="w-14 h-14 mx-auto text-[var(--ink-soft)] opacity-25 mb-3"
            strokeWidth={1.4}
          />
          <p className="font-body text-[var(--ink-soft)] font-semibold">
            You are not affiliated with any healthcare organization yet.
          </p>
          <p className="text-xs text-[var(--ink-soft)] mt-1 font-body">
            Ask your hospital or clinic administrator to invite you to their facility staff roster.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold flex items-center gap-2">
              <Building className="w-5 h-5 text-[var(--coral)]" strokeWidth={1.8} />
              Your Healthcare Affiliations &amp; Schedules
            </h3>
          </div>

          {data.employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm space-y-6"
            >
              {/* Facility Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--sage-200)]/60">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs">
                    {emp.organization.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-[var(--teal-900)]">
                      {emp.organization.name}
                    </h4>
                    <p className="text-xs text-[var(--ink-soft)] font-body">
                      {emp.organization.organizationType.name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                      emp.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {emp.isActive ? "ACTIVE AFFILIATION" : "INACTIVE"}
                  </span>
                </div>
              </div>

              {/* Badges & Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body">
                <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[var(--ink-soft)] font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                    Assigned Role
                  </span>
                  <p className="font-bold text-[var(--ink)]">
                    {emp.organizationRole?.name || emp.role}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[var(--ink-soft)] font-semibold flex items-center gap-1">
                    <FolderTree className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                    Department
                  </span>
                  <p className="font-bold text-[var(--ink)]">
                    {emp.department?.name || "General Clinical Dept"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[var(--ink-soft)] font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                    Location
                  </span>
                  <p className="text-[var(--ink)] truncate">
                    {emp.organization.address || "Address not provided"}
                  </p>
                </div>
              </div>

              {/* Schedule Editor Integration */}
              <ScheduleEditor
                organizationId={emp.organizationId}
                currentSchedule={emp.activeSchedule as any}
                pendingSchedule={emp.pendingSchedule as any}
                rejectedSchedule={(emp as any).rejectedSchedule as any}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
