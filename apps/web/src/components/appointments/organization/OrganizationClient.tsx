"use client";

import { useState } from "react";
import {
  Building,
  MapPin,
  Star,
  Users,
  Clock,
  Calendar,
  ExternalLink,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { BookAppointmentModal } from "../BookAppointmentModal";
import { ReviewSection } from "../ReviewSection";
import type { OrganizationShowcaseData, OrgShowcaseDoctor } from "@/actions/appointments/getOrganization";

interface OrganizationClientProps {
  data: OrganizationShowcaseData;
}

export function OrganizationClient({ data }: OrganizationClientProps) {
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedDoctor, setSelectedDoctor] = useState<OrgShowcaseDoctor | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get unique departments based on doctors' specializations
  const departments = [
    "All Departments",
    ...Array.from(new Set(data.doctors.map((d) => d.specialization).filter(Boolean))),
  ];

  const filteredDoctors =
    selectedDepartment === "All Departments"
      ? data.doctors
      : data.doctors.filter(
          (d) => d.specialization.toLowerCase() === selectedDepartment.toLowerCase()
        );

  const handleBook = (doctor: OrgShowcaseDoctor) => {
    setSelectedDoctor(doctor);
    setIsBookingModalOpen(true);
  };

  const googleMapsUrl =
    data.latitude && data.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
      : data.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
      : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Organization Header */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {data.logo ? (
              <img
                src={data.logo}
                alt={`${data.name} logo`}
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--sage-200)]"
              />
            ) : (
              <div className="p-3 rounded-xl bg-[var(--sage-200)]">
                <Building className="w-8 h-8 text-[var(--teal-900)]" strokeWidth={1.6} />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl text-[var(--teal-900)]">{data.name}</h1>
              {data.motto && <p className="text-sm text-[var(--ink-soft)] italic mt-1">{data.motto}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-[var(--sage-200)] text-xs font-mono text-[var(--ink-soft)]">
                  {data.organizationType.name}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[var(--coral)] text-[var(--coral)]" strokeWidth={1.6} />
                  <span className="font-body text-sm font-medium text-[var(--ink)]">
                    {data.avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    ({data.reviews.length} reviews)
                  </span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    data.verificationStatus === "verified"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {data.verificationStatus}
                </span>
              </div>
            </div>
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] transition-colors text-sm font-body"
            >
              <MapPin className="w-4 h-4" strokeWidth={1.6} />
              Directions
              <ExternalLink className="w-3 h-3" strokeWidth={1.6} />
            </a>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data.vision && (
            <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4">
              <div className="flex items-center gap-2 mb-2 text-[var(--teal-900)]">
                <Sparkles className="w-4 h-4 text-[var(--coral)]" />
                <span className="text-xs font-mono uppercase tracking-wider">Vision</span>
              </div>
              <p className="text-sm text-[var(--ink)] leading-relaxed font-body">{data.vision}</p>
            </div>
          )}
          {data.mission && (
            <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4">
              <div className="flex items-center gap-2 mb-2 text-[var(--teal-900)]">
                <HeartPulse className="w-4 h-4 text-[var(--coral)]" />
                <span className="text-xs font-mono uppercase tracking-wider">Mission</span>
              </div>
              <p className="text-sm text-[var(--ink)] leading-relaxed font-body">{data.mission}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {data.establishedYear && (
            <span className="px-3 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-body text-[var(--ink-soft)]">
              Established {data.establishedYear}
            </span>
          )}
          {typeof data.patientServedCount === "number" && (
            <span className="px-3 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-body text-[var(--ink-soft)]">
              {data.patientServedCount.toLocaleString()} patients served
            </span>
          )}
        </div>

        {data.address && (
          <div className="mt-3 flex items-start gap-2 text-sm text-[var(--ink-soft)] font-body">
            <MapPin className="w-4 h-4 mt-0.5" strokeWidth={1.6} />
            <span>{data.address}</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {data.specialties && data.specialties.length > 0 &&
            data.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-2 py-0.5 rounded-full bg-[var(--sage-200)] text-xs font-body text-[var(--ink-soft)]"
              >
                {specialty}
              </span>
            ))}

          {typeof data.patientServedCount === "number" && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--paper)] text-xs font-body text-[var(--ink-soft)]">
              {data.patientServedCount.toLocaleString()} patients served
            </span>
          )}
        </div>
      </div>

      {/* Departments */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Building className="w-5 h-5 text-[var(--teal-900)]" strokeWidth={1.6} />
          <h2 className="font-display text-xl text-[var(--teal-900)]">Departments</h2>
          <span className="text-sm text-[var(--ink-soft)] font-body">({data.departments.length})</span>
        </div>
        {data.departments.length === 0 ? (
          <div className="rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] p-5 text-sm text-[var(--ink-soft)] font-body">
            No departments have been published yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.departments.map((department) => (
              <div
                key={department.id}
                className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4 hover:border-[var(--teal-900)]/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--sage-200)] flex items-center justify-center text-xl shrink-0">
                    {department.icon || "🏥"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-body font-semibold text-[var(--ink)] truncate">
                      {department.name}
                    </h3>
                    <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
                      {department.doctorCount} doctor{department.doctorCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                {department.description && (
                  <p className="mt-3 text-sm text-[var(--ink-soft)] font-body leading-relaxed">
                    {department.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctors Section with Department Filter */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[var(--teal-900)]" strokeWidth={1.6} />
            <h2 className="font-display text-xl text-[var(--teal-900)]">
              Practicing Specialists &amp; Doctors
            </h2>
            <span className="text-sm text-[var(--ink-soft)] font-body">
              ({data.doctors.length} doctors)
            </span>
          </div>
        </div>

        {/* Department Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {departments.map((dept) => {
            const count =
              dept === "All Departments"
                ? data.doctors.length
                : data.doctors.filter(
                    (d) => d.specialization.toLowerCase() === dept.toLowerCase()
                  ).length;

            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDepartment(dept)}
                className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${
                  selectedDepartment.toLowerCase() === dept.toLowerCase()
                    ? "bg-[var(--teal-900)] text-white"
                    : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                }`}
              >
                {dept} ({count})
              </button>
            );
          })}
        </div>

        {/* Doctors List */}
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-8 bg-[var(--paper)] rounded-xl border border-[var(--sage-200)]">
            <p className="font-body text-[var(--ink-soft)]">
              No doctors found matching the selected department filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDoctors.map((doctor) => {
              const schedule = doctor.schedules[0];
              const days =
                schedule?.workingDays && schedule.workingDays.length > 0
                  ? schedule.workingDays.join(", ")
                  : "Schedule not set";
              const hours =
                schedule?.startTime && schedule?.endTime
                  ? `${schedule.startTime} – ${schedule.endTime}`
                  : "Hours not set";

              return (
                <div
                  key={doctor.id}
                  className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] transition-colors hover:border-[var(--teal-900)]/40 gap-4"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <p className="font-body font-medium text-[var(--ink)]">{doctor.name}</p>
                      <span className="text-xs font-mono text-[var(--ink-soft)]">
                        · {doctor.specialization}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[var(--ink-soft)] font-body">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.6} />
                        <span>{days}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.6} />
                        <span>{hours}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBook(doctor)}
                    className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium text-sm"
                  >
                    Book Appointment
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <ReviewSection
        key={refreshKey}
        organizationId={data.id}
        title={`Reviews for ${data.name}`}
        reviews={data.reviews}
        avgRating={data.avgRating}
        ratingDistribution={data.ratingDistribution}
        canReview={data.canReview}
        onReviewSubmitted={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Booking Modal */}
      {isBookingModalOpen && selectedDoctor && (
        <BookAppointmentModal
          doctor={{
            id: selectedDoctor.id,
            name: selectedDoctor.name,
            specialization: selectedDoctor.specialization,
          }}
          organization={{
            id: data.id,
            name: data.name,
          }}
          schedule={selectedDoctor.schedules[0]}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedDoctor(null);
          }}
          onSuccess={() => {
            setIsBookingModalOpen(false);
            setSelectedDoctor(null);
          }}
        />
      )}
    </div>
  );
}
