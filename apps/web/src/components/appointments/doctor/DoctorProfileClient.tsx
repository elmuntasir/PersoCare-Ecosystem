"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Star,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
} from "lucide-react";
import { BookAppointmentModal } from "../BookAppointmentModal";
import { SubmitReviewModal } from "../SubmitReviewModal";
import { ReviewSection } from "../ReviewSection";
import type { DoctorProfileData, DoctorAffiliationDetail } from "@/actions/appointments/getDoctor";

interface DoctorProfileClientProps {
  data: DoctorProfileData;
}

export function DoctorProfileClient({ data }: DoctorProfileClientProps) {
  const [selectedOrg, setSelectedOrg] = useState<DoctorAffiliationDetail | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrgId, setReviewOrgId] = useState<string>(
    data.eligibleOrganizationIdsForReview[0] || (data.organizations[0]?.organizationId || "")
  );

  const reviewingOrg =
    data.organizations.find((o) => o.organizationId === reviewOrgId) || data.organizations[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)]">
        <Link
          href="/dashboard/appointments"
          className="hover:text-[var(--coral)] transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Find Appointments</span>
        </Link>
        <span>/</span>
        <span className="text-[var(--teal-900)] font-medium truncate">Dr. {data.name}</span>
      </div>

      {/* ── Facebook-Style Doctor Professional Header ── */}
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] overflow-hidden shadow-xs">
        {/* Cover Photo */}
        <div className="h-44 md:h-52 bg-gradient-to-r from-[var(--teal-900)] via-[#154a41] to-[#0f3b34] relative p-6 flex items-end">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400/20 via-transparent to-transparent" />
          <div className="relative z-10 text-white/90 text-xs font-mono">
            Verified Healthcare Professional Profile
          </div>
        </div>

        {/* Profile Details Header Bar */}
        <div className="px-6 md:px-8 pb-6 pt-0 relative">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-14 md:-mt-16 mb-4">
            {/* Avatar & Title */}
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[var(--teal-900)] to-[var(--teal-700)] text-white border-4 border-white shadow-md flex items-center justify-center font-bold text-3xl shrink-0">
                {data.name ? data.name.charAt(0).toUpperCase() : "D"}
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--teal-900)]">
                    Dr. {data.name}
                  </h1>
                  <span className="inline-flex items-center text-emerald-600" title="Verified BMDC Medical Doctor">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-body mt-1">
                  <span className="px-3 py-0.5 rounded-full bg-[var(--teal-900)]/10 text-[var(--teal-900)] font-mono font-semibold">
                    {data.specialization}
                  </span>
                  {data.bmdcRegistrationNumber && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] font-mono">
                      BMDC: {data.bmdcRegistrationNumber}
                    </span>
                  )}
                  <div className="flex items-center gap-1 bg-[var(--paper)] px-2.5 py-0.5 rounded-full border border-[var(--sage-200)]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[var(--ink)]">
                      {data.avgRating > 0 ? data.avgRating.toFixed(1) : "New"}
                    </span>
                    <span className="text-[var(--ink-soft)]">({data.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {data.canReview && (
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90 text-xs font-body font-semibold transition-colors shadow-xs"
              >
                Write Review
              </button>
            )}
          </div>

          {/* Academic Degrees & Contact */}
          <div className="space-y-2 pt-3 border-t border-[var(--sage-200)]/60 text-xs font-body text-[var(--ink-soft)]">
            {data.degreeInstitution && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Award className="w-4 h-4 text-[var(--teal-700)] shrink-0" />
                <span className="font-medium">
                  {data.degreeInstitution} {data.graduationYear ? `(${data.graduationYear})` : ""}
                </span>
              </div>
            )}

            {data.bio && (
              <div className="flex items-start gap-2 pt-1">
                <BookOpen className="w-4 h-4 text-[var(--teal-900)] mt-0.5 shrink-0" />
                <p className="italic text-[var(--ink)]">{data.bio}</p>
              </div>
            )}

            {(data.email || data.phone) && (
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {data.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[var(--teal-900)]" />
                    <span>{data.email}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[var(--coral)]" />
                    <span>{data.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Affiliated Hospitals & Chambers in BD ── */}
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center">
            <Building2 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-[var(--teal-900)]">
              Hospital Affiliations &amp; Schedules
            </h2>
            <p className="text-xs font-body text-[var(--ink-soft)]">
              Dr. {data.name} practices at the following healthcare facilities in Bangladesh. Choose a chamber to book.
            </p>
          </div>
        </div>

        {data.organizations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] text-center text-xs text-[var(--ink-soft)] font-body">
            No active chambers registered at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.organizations.map((org) => {
              const daysText =
                org.workingDays && org.workingDays.length > 0
                  ? org.workingDays.join(", ")
                  : "Days on request";
              const timeText =
                org.startTime && org.endTime ? `${org.startTime} – ${org.endTime}` : "Shift hours variable";

              return (
                <div
                  key={org.scheduleId}
                  className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] hover:border-[var(--teal-900)]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/dashboard/appointments/organization/${org.organizationSlug}`}
                          className="font-body font-bold text-base text-[var(--teal-900)] hover:text-[var(--coral)] transition-colors block"
                        >
                          {org.organizationName}
                        </Link>
                        <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                          {org.organizationType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-[var(--sage-200)] text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-[var(--ink)]">
                          {org.organizationRating > 0 ? org.organizationRating.toFixed(1) : "New"}
                        </span>
                      </div>
                    </div>

                    {org.organizationAddress && (
                      <p className="text-xs text-[var(--ink-soft)] font-body line-clamp-2">
                        {org.organizationAddress}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[var(--sage-200)]/60 space-y-1 text-xs font-body text-[var(--ink-soft)]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[var(--teal-700)] shrink-0" />
                        <span className="font-mono text-[11px] font-medium text-[var(--ink)]">
                          {daysText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[var(--coral)] shrink-0" />
                        <span className="font-mono text-[11px] font-medium text-[var(--ink)]">
                          {timeText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--sage-200)]/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--ink-soft)]">
                      {org.approvalMode === "AUTO" ? "⚡ Instant Token" : "Manual Approval"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedOrg(org)}
                      className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90 text-xs font-body font-semibold transition-colors shadow-xs"
                    >
                      Book at this Facility
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reviews Section ── */}
      <ReviewSection
        title={`Reviews for Dr. ${data.name}`}
        avgRating={data.avgRating}
        reviewCount={data.reviewCount}
        reviews={data.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          verified: r.verified,
          authorName: r.authorName,
          secondaryName: r.organizationName,
        }))}
        canReview={data.canReview}
        onOpenReviewModal={() => setIsReviewModalOpen(true)}
      />

      {/* ── Booking Modal ── */}
      {selectedOrg && (
        <BookAppointmentModal
          doctor={{
            id: data.id,
            name: data.name,
            specialization: data.specialization,
          }}
          organization={{
            id: selectedOrg.organizationId,
            name: selectedOrg.organizationName,
          }}
          schedule={{
            workingDays: selectedOrg.workingDays,
            startTime: selectedOrg.startTime,
            endTime: selectedOrg.endTime,
            approvalMode: selectedOrg.approvalMode,
          }}
          onClose={() => setSelectedOrg(null)}
          onSuccess={() => setSelectedOrg(null)}
        />
      )}

      {/* ── Submit Review Modal ── */}
      {isReviewModalOpen && reviewingOrg && (
        <SubmitReviewModal
          organizationId={reviewingOrg.organizationId}
          organizationName={reviewingOrg.organizationName}
          doctorId={data.id}
          doctorName={data.name}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={() => setIsReviewModalOpen(false)}
        />
      )}
    </div>
  );
}
