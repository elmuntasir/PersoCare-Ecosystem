"use client";

import Link from "next/link";
import { User, Star, Building2, Calendar, Clock, ArrowRight, Award, ShieldCheck } from "lucide-react";
import type { SearchDoctorResult, DoctorAffiliatedOrg } from "@/actions/appointments/search";

interface DoctorCardProps {
  doctor: SearchDoctorResult;
  onBookAtOrganization: (doctor: SearchDoctorResult, org: DoctorAffiliatedOrg) => void;
}

export function DoctorCard({ doctor, onBookAtOrganization }: DoctorCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 md:p-6 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
      {/* ── Top Header: Doctor Info, Specialty & Ratings ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[var(--teal-900)] to-[var(--teal-700)] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            {doctor.name ? doctor.name.charAt(0).toUpperCase() : "D"}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/dashboard/appointments/doctor/${doctor.id}`}
                className="font-display text-xl font-bold text-[var(--teal-900)] hover:text-[var(--coral)] transition-colors"
              >
                Dr. {doctor.name}
              </Link>
              <span className="inline-flex items-center text-emerald-600" title="Verified BMDC Doctor">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--teal-900)]/10 text-[var(--teal-900)] text-xs font-mono font-medium">
                {doctor.specialization || "General Medicine"}
              </span>

              {doctor.bmdcNumber && (
                <span className="text-xs font-mono text-[var(--ink-soft)]" title="BMDC Registration Number">
                  BMDC: {doctor.bmdcNumber}
                </span>
              )}
            </div>

            {doctor.degreeInstitution && (
              <p className="text-xs font-body text-[var(--ink-soft)] mt-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[var(--teal-700)] shrink-0" />
                <span>{doctor.degreeInstitution}</span>
              </p>
            )}
          </div>
        </div>

        {/* Rating and Profile Link */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 bg-[var(--paper)] px-3 py-1 rounded-full border border-[var(--sage-200)]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-[var(--ink)]">
              {doctor.rating > 0 ? doctor.rating.toFixed(1) : "New"}
            </span>
            <span className="text-xs text-[var(--ink-soft)] font-body">({doctor.reviewCount})</span>
          </div>

          <Link
            href={`/dashboard/appointments/doctor/${doctor.id}`}
            className="text-xs font-body font-semibold text-[var(--coral)] hover:underline inline-flex items-center gap-1 mt-1"
          >
            <span>Doctor Profile</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── BD Multi-Organization Chambers / Hospital Affiliations ── */}
      <div className="space-y-2 pt-2 border-t border-[var(--sage-200)]/70">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[var(--teal-900)]" />
            <span>Practicing Facilities &amp; Schedules ({doctor.organizations.length})</span>
          </p>
        </div>

        {doctor.organizations.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] text-xs text-[var(--ink-soft)] font-body">
            No active hospital chambers currently scheduled. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doctor.organizations.map((org) => {
              const daysText =
                org.workingDays && org.workingDays.length > 0
                  ? org.workingDays.join(", ")
                  : "Days not specified";
              const timeText =
                org.startTime && org.endTime ? `${org.startTime} – ${org.endTime}` : "Shift hours variable";

              return (
                <div
                  key={org.id}
                  className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] flex flex-col justify-between hover:border-[var(--teal-900)]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/dashboard/appointments/organization/${org.slug}`}
                        className="font-body font-semibold text-sm text-[var(--teal-900)] hover:text-[var(--coral)] transition-colors truncate block"
                      >
                        {org.name}
                      </Link>
                    </div>

                    {org.address && (
                      <p className="text-[11px] text-[var(--ink-soft)] font-body line-clamp-1 mt-0.5">
                        {org.address}
                      </p>
                    )}

                    <div className="mt-2 space-y-1 text-xs font-body text-[var(--ink-soft)]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[var(--teal-700)] shrink-0" strokeWidth={1.8} />
                        <span className="font-mono text-[11px] truncate">{daysText}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[var(--coral)] shrink-0" strokeWidth={1.8} />
                        <span className="font-mono text-[11px]">{timeText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Book CTA at this facility */}
                  <div className="mt-3 pt-2 border-t border-[var(--sage-200)]/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                      {org.approvalMode === "AUTO" ? "Instant Serial" : "Requires Approval"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onBookAtOrganization(doctor, org)}
                      className="px-3.5 py-1.5 rounded-full bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90 text-xs font-body font-medium transition-colors shadow-xs"
                    >
                      Book Here
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
