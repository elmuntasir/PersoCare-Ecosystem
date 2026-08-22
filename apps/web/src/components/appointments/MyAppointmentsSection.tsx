"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  MapPin,
  CheckCircle2,
  Clock4,
  XCircle,
  FileCheck2,
  Star,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cancelAppointment, type PatientAppointmentItem } from "@/actions/appointments/getMyAppointments";
import { SubmitReviewModal } from "./SubmitReviewModal";
import { RescheduleModal } from "./RescheduleModal";

interface MyAppointmentsSectionProps {
  appointments: PatientAppointmentItem[];
  onRefresh: () => void;
}

export function MyAppointmentsSection({ appointments, onRefresh }: MyAppointmentsSectionProps) {
  const [selectedForReview, setSelectedForReview] = useState<{
    organizationId: string;
    organizationName: string;
    doctorId: string;
    doctorName: string;
  } | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<{
    id: string;
    currentDate?: string | null;
  } | null>(null);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleCancel(appointmentId: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(appointmentId);
    setCancelError(null);
    try {
      const formData = new FormData();
      formData.append("appointmentId", appointmentId);
      formData.append("reason", "Cancelled by patient via portal");
      await cancelAppointment(formData);
      onRefresh();
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOOKED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-semibold">
            <Clock4 className="w-3.5 h-3.5" />
            <span>PENDING APPROVAL</span>
          </span>
        );
      case "PRESCRIBED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>VISIT COMPLETED</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-[var(--paper)] text-[var(--ink-soft)] text-xs font-mono">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">
            My Appointments &amp; Serials
          </h2>
          <p className="text-xs font-body text-[var(--ink-soft)] mt-0.5">
            Track your live serial position, upcoming consultations, and completed visit prescriptions.
          </p>
        </div>
      </div>

      {cancelError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-[var(--sage-200)] mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-display text-lg font-bold text-[var(--teal-900)]">
            No Appointments Found
          </h3>
          <p className="text-xs font-body text-[var(--ink-soft)] max-w-sm mx-auto mt-1 mb-5">
            You haven't booked any consultations yet. Search for a hospital or doctor above to secure your serial.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const dateStr = appt.bookedSlotTime
              ? new Date(appt.bookedSlotTime).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Date scheduled";

            const timeStr = appt.bookedSlotTime
              ? new Date(appt.bookedSlotTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 md:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header: Status and Serial Token */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--sage-200)]/60">
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] font-mono font-bold text-sm">
                      Serial #{appt.serialNumber || "-"}
                    </div>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="text-xs font-mono text-[var(--ink-soft)]">
                    Booked on {new Date(appt.requestedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Body Details: Doctor, Organization, Slot Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Doctor Info */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                      Consultant Doctor
                    </p>
                    {appt.doctor ? (
                      <div>
                        <Link
                          href={`/dashboard/appointments/doctor/${appt.doctor.id}`}
                          className="font-body font-bold text-base text-[var(--teal-900)] hover:text-[var(--coral)] transition-colors block"
                        >
                          Dr. {appt.doctor.name}
                        </Link>
                        <p className="text-xs font-mono text-[var(--ink-soft)]">
                          {appt.doctor.specialization}
                        </p>
                      </div>
                    ) : (
                      <p className="font-body text-sm text-[var(--ink)]">Doctor Assigned</p>
                    )}
                  </div>

                  {/* Organization Info */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                      Healthcare Facility
                    </p>
                    <Link
                      href={`/dashboard/appointments/organization/${appt.organization.slug}`}
                      className="font-body font-semibold text-sm text-[var(--teal-900)] hover:text-[var(--coral)] transition-colors block truncate"
                    >
                      {appt.organization.name}
                    </Link>
                    {appt.organization.address && (
                      <p className="text-xs text-[var(--ink-soft)] font-body line-clamp-1">
                        {appt.organization.address}
                      </p>
                    )}
                  </div>

                  {/* Slot & Time */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                      Appointment Schedule
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--ink)] font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                      <span>{dateStr}</span>
                    </div>
                    {timeStr && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--coral)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Slot: {timeStr}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Review Triggers */}
                <div className="pt-3 border-t border-[var(--sage-200)]/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-mono text-[var(--ink-soft)]">
                    {appt.status === "BOOKED" && (
                      <span>Queue Position: <strong className="text-[var(--ink)]">{appt.queuePosition}</strong></span>
                    )}
                    {appt.status === "PRESCRIBED" && (
                      <span className="text-emerald-700 font-medium">✓ Prescription issued</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Write Review Button for Prescribed Completed Visit */}
                    {appt.canReview && appt.doctor && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedForReview({
                            organizationId: appt.organization.id,
                            organizationName: appt.organization.name,
                            doctorId: appt.doctor!.id,
                            doctorName: appt.doctor!.name,
                          })
                        }
                        className="px-4 py-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 text-xs font-body font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Write Verified Review</span>
                      </button>
                    )}

                    {appt.hasReviewed && (
                      <span className="text-xs font-mono text-emerald-700 font-medium">
                        ✓ Reviewed
                      </span>
                    )}

                    {/* Reschedule Button */}
                    {(appt.status === "PENDING" || appt.status === "BOOKED") && (
                      <button
                        type="button"
                        onClick={() =>
                          setRescheduleTarget({
                            id: appt.id,
                            currentDate: appt.bookedSlotTime,
                          })
                        }
                        className="px-3.5 py-1.5 rounded-full border border-[var(--teal-900)] text-[var(--teal-900)] hover:bg-[var(--teal-900)] hover:text-white text-xs font-body font-medium transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {/* Cancel Action */}
                    {(appt.status === "PENDING" || appt.status === "BOOKED") && (
                      <button
                        type="button"
                        onClick={() => handleCancel(appt.id)}
                        disabled={cancellingId === appt.id}
                        className="px-3.5 py-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-body font-medium transition-colors disabled:opacity-50"
                      >
                        {cancellingId === appt.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appointmentId={rescheduleTarget.id}
          currentDate={rescheduleTarget.currentDate}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => {
            setRescheduleTarget(null);
            onRefresh();
          }}
        />
      )}

      {/* Review Modal */}
      {selectedForReview && (
        <SubmitReviewModal
          organizationId={selectedForReview.organizationId}
          organizationName={selectedForReview.organizationName}
          doctorId={selectedForReview.doctorId}
          doctorName={selectedForReview.doctorName}
          onClose={() => setSelectedForReview(null)}
          onSuccess={() => {
            setSelectedForReview(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
