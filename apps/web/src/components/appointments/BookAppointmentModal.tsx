"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Stethoscope,
  Utensils,
  FileText,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { getAvailableSlots, type AvailableSlot } from "@/actions/appointments/getAvailableSlots";
import { initiateAppointmentPayment } from "@/actions/payment/initiateAppointmentPayment";
import { getPatientMedicalRecords } from "@/actions/medicalRecords/getAll";

type PatientMedicalRecords = Awaited<ReturnType<typeof getPatientMedicalRecords>>;

interface Doctor {
  id: string;
  name: string;
  specialization?: string | null;
  schedules?: {
    scheduleId?: string;
    startTime?: string;
    endTime?: string;
    workingDays?: string[];
    approvalMode?: string;
    lunchBreakStart?: string | null;
    lunchBreakEnd?: string | null;
    consultationFee?: number | null;
  }[];
}

interface BookAppointmentModalProps {
  doctor: Doctor;
  organization: {
    id: string;
    name: string;
  };
  schedule?: {
    scheduleId?: string;
    workingDays?: string[];
    startTime?: string;
    endTime?: string;
    approvalMode?: string;
    lunchBreakStart?: string | null;
    lunchBreakEnd?: string | null;
    consultationFee?: number | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

type PrescriptionReference = PatientMedicalRecords["prescriptions"][number];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

function formatTime12(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
}

export function BookAppointmentModal({
  doctor,
  organization,
  schedule,
  onClose,
  onSuccess,
}: BookAppointmentModalProps) {
  const router = useRouter();

  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastPrescriptions, setPastPrescriptions] = useState<PrescriptionReference[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);
  const [referencePrescriptionId, setReferencePrescriptionId] = useState("");

  const activeSchedule = schedule || doctor.schedules?.[0];
  const [scheduleId, setScheduleId] = useState<string>(activeSchedule?.scheduleId || "");
  const [consultationFee, setConsultationFee] = useState<number>(activeSchedule?.consultationFee ?? 0);
  const [platformFee, setPlatformFee] = useState<number>(10);

  const availableDates = (() => {
    const dates: Date[] = [];
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const workingDays = activeSchedule?.workingDays || [];

    for (let i = 1; i <= 14; i++) {
      const date = addDays(today, i);
      const dayName = dayNames[date.getDay()];
      if (
        workingDays.length === 0 ||
        workingDays.some((workingDay) => workingDay.toLowerCase() === dayName.toLowerCase())
      ) {
        dates.push(date);
      }
    }

    return dates;
  })();

  function handleSelectDate(dateStr: string) {
    setSelectedDateStr(dateStr);
    setSlots([]);
    setSelectedSlot(null);
    setError(null);
  }

  useEffect(() => {
    if (!selectedDateStr) return;

    let isMounted = true;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);

      try {
        const formData = new FormData();
        formData.append("doctorId", doctor.id);
        formData.append("organizationId", organization.id);
        formData.append("date", selectedDateStr);

        const data = await getAvailableSlots(formData);
        if (isMounted) {
          setSlots(data.slots);
          if (data.scheduleId) setScheduleId(data.scheduleId);
          if (typeof data.consultationFee === "number") setConsultationFee(data.consultationFee);
          if (typeof data.platformFee === "number") setPlatformFee(data.platformFee);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setError(getErrorMessage(error, "Failed to load time slots"));
          setSlots([]);
        }
      } finally {
        if (isMounted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedDateStr, doctor.id, organization.id]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrescriptions = async () => {
      setLoadingPrescriptions(true);
      setPrescriptionError(null);

      try {
        const data = await getPatientMedicalRecords();
        if (!isMounted) return;

        setPastPrescriptions(data.prescriptions || []);
      } catch (error: unknown) {
        if (!isMounted) return;
        setPastPrescriptions([]);
        setPrescriptionError(getErrorMessage(error, "Could not load previous prescriptions"));
      } finally {
        if (isMounted) {
          setLoadingPrescriptions(false);
        }
      }
    };

    fetchPrescriptions();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedDateStr) {
      setError("Please select an appointment date");
      return;
    }

    if (!selectedSlot) {
      setError("Please select an available consultation time slot");
      return;
    }

    if (!selectedSlot.isAvailable || selectedSlot.isLunch) {
      setError("The chosen time slot is not available for booking.");
      return;
    }

    if (!scheduleId) {
      setError("Could not resolve doctor schedule details. Please choose a slot again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dateTime = new Date(`${selectedDateStr}T${selectedSlot.startTime}:00`);
      if (Number.isNaN(dateTime.getTime())) {
        throw new Error("Invalid date or time chosen");
      }

      const formData = new FormData();
      formData.append("scheduleId", scheduleId);
      formData.append("doctorId", doctor.id);
      formData.append("organizationId", organization.id);
      formData.append("date", dateTime.toISOString());
      formData.append("symptoms", symptoms);

      if (referencePrescriptionId) {
        formData.append("referencePrescriptionId", referencePrescriptionId);
      }

      const result = await initiateAppointmentPayment(formData);
      if (result.success && result.redirectUrl) {
        if (onSuccess) onSuccess();
        window.location.href = result.redirectUrl;
      } else {
        throw new Error("Could not initialize payment gateway session.");
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to initialize booking payment. Please try again."));
      setIsSubmitting(false);
    }
  }

  const selectedReference = pastPrescriptions.find((item) => item.id === referencePrescriptionId) || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--sage-200)] bg-white shadow-2xl">
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-1.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--sage-200)]/60 hover:text-[var(--ink)]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <form onSubmit={handleSubmit}>
            <div className="grid min-h-[72vh] lg:grid-cols-[1.06fr_0.94fr]">
              <div className="border-b border-[var(--sage-200)]/70 p-6 md:p-8 lg:border-b-0 lg:border-r">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)] font-semibold">
                  Consultation Booking
                </p>
                <h3 className="mt-1 font-display text-3xl font-bold text-[var(--teal-900)]">
                  Book an Appointment
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Pick a consultation time, preview fee details, and attach prior medical history.
                </p>

                <div className="mt-6 rounded-3xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--teal-900)] text-white">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-body text-base font-bold text-[var(--teal-900)]">
                        Dr. {doctor.name}
                      </p>
                      <p className="truncate text-sm text-[var(--ink-soft)]">
                        {doctor.specialization || "General Medicine"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-[var(--sage-200)]/70 pt-4 text-sm text-[var(--ink-soft)]">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-[var(--teal-700)]" />
                      <span className="truncate text-[var(--ink)]">{organization.name}</span>
                    </div>
                    {activeSchedule?.startTime && activeSchedule?.endTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-[var(--coral)]" />
                        <span>
                          Hours: {activeSchedule.startTime} - {activeSchedule.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                    Select Available Date *
                  </label>
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-2">
                    {availableDates.length === 0 ? (
                      <p className="p-2 text-sm text-amber-600">
                        No upcoming working days found in the next 14 days.
                      </p>
                    ) : (
                      availableDates.map((date) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const isSelected = selectedDateStr === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleSelectDate(dateStr)}
                            className={`rounded-xl px-3 py-2 text-xs font-mono transition-colors ${
                              isSelected
                                ? "bg-[var(--teal-900)] text-white font-semibold shadow-xs"
                                : "border border-[var(--sage-200)] bg-white text-[var(--ink)] hover:bg-[var(--sage-200)]"
                            }`}
                          >
                            {format(date, "EEE, MMM dd")}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {selectedDateStr && (
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                        Select Consultation Slot *
                      </label>
                      {selectedSlot && (
                        <span className="text-xs font-mono font-semibold text-emerald-700">
                          Selected: {formatTime12(selectedSlot.startTime)} - {formatTime12(selectedSlot.endTime)}
                        </span>
                      )}
                    </div>

                    {loadingSlots ? (
                      <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] py-6 text-center text-xs font-mono text-[var(--ink-soft)]">
                        Loading available consultation slots...
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                        No consultation slots available on this date.
                      </div>
                    ) : (
                      <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-2 sm:grid-cols-4">
                        {slots.map((slot, idx) => {
                          const isSelected = selectedSlot?.startTime === slot.startTime;
                          let btnStyle =
                            "border border-[var(--sage-200)] bg-white text-[var(--ink)] hover:border-[var(--teal-900)] hover:bg-teal-50";

                          if (slot.isLunch) {
                            btnStyle =
                              "border border-amber-200 bg-amber-100/70 text-amber-800 opacity-60 cursor-not-allowed";
                          } else if (!slot.isAvailable) {
                            btnStyle =
                              "border border-rose-200 bg-rose-50 text-rose-500 opacity-60 cursor-not-allowed";
                          } else if (isSelected) {
                            btnStyle = "border border-[var(--coral)] bg-[var(--coral)] text-white font-bold shadow-xs";
                          }

                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}-${idx}`}
                              type="button"
                              disabled={!slot.isAvailable || slot.isLunch}
                              onClick={() => setSelectedSlot(slot)}
                              className={`rounded-xl p-2 text-center text-xs font-mono transition-all ${btnStyle}`}
                              title={
                                slot.isLunch
                                  ? "Lunch Break"
                                  : !slot.isAvailable
                                  ? `Booked (Serial #${slot.serialNumber || "N/A"})`
                                  : `${formatTime12(slot.startTime)} - ${formatTime12(slot.endTime)}`
                              }
                            >
                              <span className="block font-semibold">{formatTime12(slot.startTime)}</span>
                              {slot.isLunch && (
                                <span className="mt-0.5 block text-[9px] text-amber-800">
                                  <Utensils className="mr-1 inline h-2.5 w-2.5" />
                                  Lunch
                                </span>
                              )}
                              {!slot.isAvailable && !slot.isLunch && (
                                <span className="mt-0.5 block text-[9px] text-rose-600">Booked</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                    Symptoms / Medical Concern (Optional)
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Briefly state your reason for consultation..."
                    rows={2}
                    className="w-full resize-none rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                  />
                </div>

                {/* ─── Fee Breakdown Card ─── */}
                <div className="mt-6 rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 space-y-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-[var(--teal-900)] font-semibold flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[var(--coral)]" />
                    Payment &amp; Consultation Summary
                  </p>
                  <div className="space-y-1.5 pt-1 text-xs font-body">
                    <div className="flex items-center justify-between text-[var(--ink-soft)]">
                      <span>Doctor's Consultation Fee:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {consultationFee > 0 ? `${consultationFee} BDT` : "Not Specified / Offline"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--sage-200)]/70 pt-1.5 text-sm">
                      <span className="font-medium text-[var(--teal-900)]">Platform Booking Fee:</span>
                      <span className="font-bold text-[var(--coral)]">{platformFee} BDT</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--ink-soft)] italic pt-1 border-t border-[var(--sage-200)]/50">
                    💡 You will only pay the {platformFee} BDT platform fee now via SSLCommerz. Doctor's consultation fee is paid directly at the clinic.
                  </p>
                </div>
              </div>

              <div className="bg-[linear-gradient(180deg,rgba(247,244,239,0.85),rgba(255,255,255,1))] p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)] font-semibold">
                      Reference
                    </p>
                    <h4 className="mt-1 font-display text-2xl font-bold text-[var(--teal-900)]">
                      Previous Prescriptions
                    </h4>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      Choose one prescription your doctor can use as a consultation reference.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--teal-900)] shadow-sm border border-[var(--sage-200)]">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                {loadingPrescriptions ? (
                  <div className="mt-6 rounded-3xl border border-[var(--sage-200)] bg-white p-5 text-sm text-[var(--ink-soft)]">
                    Loading your previous prescriptions...
                  </div>
                ) : prescriptionError ? (
                  <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    {prescriptionError}
                  </div>
                ) : pastPrescriptions.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-[var(--sage-200)] bg-white p-6 text-center">
                    <FileText className="mx-auto h-10 w-10 text-[var(--ink-soft)] opacity-30" strokeWidth={1.6} />
                    <p className="mt-3 text-sm font-medium text-[var(--ink)]">No past prescriptions found.</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      When you have prescriptions in your record, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3 max-h-72 overflow-y-auto pr-1">
                    {pastPrescriptions.map((prescription) => {
                      const isSelected = referencePrescriptionId === prescription.id;
                      const medicineNames = (prescription.medicines || [])
                        .map((medicine) => medicine.medicineName)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(", ");

                      return (
                        <button
                          key={prescription.id}
                          type="button"
                          onClick={() => setReferencePrescriptionId(isSelected ? "" : prescription.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-[var(--coral)] bg-[var(--coral)]/5"
                              : "border-[var(--sage-200)] bg-white hover:bg-[var(--paper)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--ink)]">
                                #{prescription.id.slice(-8).toUpperCase()} -{" "}
                                {format(new Date(prescription.date), "MMM d, yyyy")}
                              </p>
                              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                                Dr. {prescription.doctorName}
                                {prescription.doctorSpecialization
                                  ? ` • ${prescription.doctorSpecialization}`
                                  : ""}
                                {" • "}
                                {prescription.organizationName}
                              </p>
                              {medicineNames && (
                                <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-soft)]">
                                  Medicines: {medicineNames}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="shrink-0 rounded-full bg-[var(--coral)] px-2.5 py-1 text-[11px] font-semibold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedReference && (
                  <div className="mt-6 rounded-3xl border border-[var(--coral)]/25 bg-white p-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--coral)] font-semibold">
                      Current Reference
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                      #{selectedReference.id.slice(-8).toUpperCase()} - {format(new Date(selectedReference.date), "MMM d, yyyy")}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      Dr. {selectedReference.doctorName}
                      {selectedReference.doctorSpecialization
                        ? ` • ${selectedReference.doctorSpecialization}`
                        : ""}
                    </p>
                  </div>
                )}

                {referencePrescriptionId && (
                  <div className="mt-4 rounded-2xl bg-[var(--paper)] px-4 py-3 text-xs text-[var(--ink-soft)]">
                    This prescription will be attached to the booking request as a reference.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--sage-200)]/70 bg-white p-6 md:p-8">
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-full border border-[var(--sage-200)] px-5 py-2.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--sage-200)]/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlot || !selectedSlot.isAvailable}
                  className="rounded-full bg-[var(--coral)] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--coral)]/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isSubmitting
                    ? "Redirecting to SSLCommerz..."
                    : `Pay ${platformFee} BDT & Book Serial`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
