"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { CalendarDays, Clock3, FileText, Hospital, User2 } from "lucide-react";
import { getAvailableSlots, type AvailableSlot } from "@/actions/appointments/getAvailableSlots";
import type { PublicBookingContext, PublicBookingDoctor } from "@/actions/public/getBookingContext";
import { publicBookAppointment } from "@/actions/public/bookAppointment";

function formatTime(time: string) {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function getAvailableDates(doctor: PublicBookingDoctor | null) {
  const workingDays = doctor?.schedules[0]?.workingDays || [];
  const dates: Date[] = [];
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let i = 1; i <= 14; i++) {
    const candidate = addDays(today, i);
    const dayName = dayNames[candidate.getDay()];
    if (
      workingDays.length === 0 ||
      workingDays.some((workingDay) => workingDay.toLowerCase() === dayName.toLowerCase())
    ) {
      dates.push(candidate);
    }
  }

  return dates;
}

interface PublicBookingClientProps {
  initialContext: PublicBookingContext;
  initialOrgId: string;
  initialDoctorId?: string;
}

export function PublicBookingClient({
  initialContext,
  initialOrgId,
  initialDoctorId = "",
}: PublicBookingClientProps) {
  const router = useRouter();

  const [context] = useState<PublicBookingContext>(initialContext);
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    initialDoctorId || initialContext.selectedDoctor?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const selectedDoctor = useMemo(() => {
    return context.doctors.find((doctor) => doctor.id === selectedDoctorId) || context.selectedDoctor;
  }, [context, selectedDoctorId]);

  const availableDates = useMemo(() => getAvailableDates(selectedDoctor || null), [selectedDoctor]);

  useEffect(() => {
    if (!initialOrgId || !selectedDoctorId || !selectedDate) {
      return;
    }

    let mounted = true;

    const fd = new FormData();
    fd.append("doctorId", selectedDoctorId);
    fd.append("organizationId", initialOrgId);
    fd.append("date", selectedDate);

    getAvailableSlots(fd)
      .then((data) => {
        if (!mounted) return;
        setSlots(data.slots);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load available slots.");
        setSlots([]);
      });

    return () => {
      mounted = false;
    };
  }, [initialOrgId, selectedDoctorId, selectedDate]);

  function handleSelectDoctor(doctorId: string) {
    setSelectedDoctorId(doctorId);
    setSelectedDate("");
    setSelectedSlot(null);
    setSlots([]);
    setError(null);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedDoctorId) {
      setError("Please select a doctor.");
      return;
    }
    if (!selectedDate || !selectedSlot) {
      setError("Please choose a date and time.");
      return;
    }
    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim()) {
      setError("Please fill in your name, phone number, and age.");
      return;
    }

    setSubmitLoading(true);
    setError(null);

    try {
      const dateTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`);
      const fd = new FormData();
      fd.append("doctorId", selectedDoctorId);
      fd.append("organizationId", initialOrgId);
      fd.append("date", dateTime.toISOString());
      fd.append("patientName", patientName.trim());
      fd.append("patientPhone", patientPhone.trim());
      fd.append("patientAge", patientAge.trim());
      fd.append("patientGender", patientGender);
      fd.append("symptoms", symptoms);

      const result = await publicBookAppointment(fd);
      router.push(`/public-book/confirmation/${result.appointmentId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to complete the booking.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(19,70,63,0.08),_transparent_35%),linear-gradient(180deg,var(--paper),#fff)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)]">Public Booking</p>
          <h1 className="mt-1 font-display text-3xl text-[var(--teal-900)]">Book a serial without logging in</h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--paper)] p-4">
              <p className="text-xs font-mono text-[var(--ink-soft)]">Organization</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{context.organization.name}</p>
            </div>
            <div className="rounded-2xl bg-[var(--paper)] p-4">
              <p className="text-xs font-mono text-[var(--ink-soft)]">Doctor</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">
                {selectedDoctor?.name || "Select a doctor"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--paper)] p-4">
              <p className="text-xs font-mono text-[var(--ink-soft)]">Link</p>
              <p className="mt-1 truncate text-sm text-[var(--ink)]">
                {initialDoctorId ? "Doctor-specific QR" : "Organization booking QR"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
            {!initialDoctorId && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Hospital className="h-5 w-5 text-[var(--coral)]" />
                  <h2 className="font-display text-xl text-[var(--teal-900)]">Choose a doctor</h2>
                </div>
                <div className="grid gap-3">
                  {context.doctors.map((doctor) => {
                    const active = doctor.id === selectedDoctorId;
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => handleSelectDoctor(doctor.id)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          active
                            ? "border-[var(--coral)] bg-[var(--coral)]/5"
                            : "border-[var(--sage-200)] hover:bg-[var(--paper)]"
                        }`}
                      >
                        <p className="font-semibold text-[var(--ink)]">{doctor.name}</p>
                        <p className="mt-1 text-sm text-[var(--ink-soft)]">{doctor.specialization}</p>
                        <p className="mt-2 text-xs text-[var(--ink-soft)]">
                          {doctor.schedules[0]
                            ? `${formatTime(doctor.schedules[0].startTime)} - ${formatTime(doctor.schedules[0].endTime)}`
                            : "No active schedule"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {selectedDoctor && (
              <>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[var(--coral)]" />
                    <h2 className="font-display text-xl text-[var(--teal-900)]">Choose a date</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.length === 0 ? (
                      <p className="text-sm text-amber-700">No available dates in the next 14 days.</p>
                    ) : (
                      availableDates.map((date) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const active = selectedDate === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleSelectDate(dateStr)}
                            className={`rounded-full px-4 py-2 text-sm transition-colors ${
                              active
                                ? "bg-[var(--teal-900)] text-white"
                                : "border border-[var(--sage-200)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--sage-200)]"
                            }`}
                          >
                            {format(date, "EEE, MMM dd")}
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>

                {selectedDate && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-[var(--coral)]" />
                    <h2 className="font-display text-xl text-[var(--teal-900)]">Choose a slot</h2>
                  </div>

                    {slots.length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        No available slots for this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((slot) => {
                          const active = selectedSlot?.startTime === slot.startTime;
                          const className = slot.isLunch
                            ? "cursor-not-allowed border border-amber-200 bg-amber-100/70 text-amber-800 opacity-60"
                            : !slot.isAvailable
                            ? "cursor-not-allowed border border-rose-200 bg-rose-50 text-rose-500 opacity-60"
                            : active
                            ? "border border-[var(--coral)] bg-[var(--coral)] text-white"
                            : "border border-[var(--sage-200)] bg-white text-[var(--ink)] hover:bg-[var(--paper)]";

                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}`}
                              type="button"
                              disabled={!slot.isAvailable || slot.isLunch}
                              onClick={() => setSelectedSlot(slot)}
                              className={`rounded-2xl p-3 text-center text-xs font-mono transition-colors ${className}`}
                            >
                              <span className="block font-semibold">{formatTime(slot.startTime)}</span>
                              {slot.isLunch && <span className="mt-1 block text-[10px]">Lunch</span>}
                              {!slot.isAvailable && !slot.isLunch && <span className="mt-1 block text-[10px]">Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            <section className="space-y-4 border-t border-[var(--sage-200)] pt-6">
              <div className="mb-1 flex items-center gap-2">
                <User2 className="h-5 w-5 text-[var(--coral)]" />
                <h2 className="font-display text-xl text-[var(--teal-900)]">Your details</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Name *</span>
                  <input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm"
                    placeholder="Your full name"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Phone *</span>
                  <input
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm"
                    placeholder="01xxxxxxxxx"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Age *</span>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm"
                    placeholder="Age"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Gender</span>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Symptoms</span>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm"
                  placeholder="Briefly describe what brings you in..."
                />
              </label>
            </section>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading || !selectedDoctorId || !selectedDate || !selectedSlot}
              className="w-full rounded-full bg-[var(--coral)] px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitLoading ? "Booking..." : "Confirm & Book Serial"}
            </button>
          </form>

          <aside className="space-y-4 rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--teal-900)] text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)]">What happens next</p>
                <p className="mt-1 font-display text-2xl text-[var(--teal-900)]">Instant serial</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-[var(--ink-soft)]">
              <p>Your booking will be created without an account.</p>
              <p>The serial number appears immediately after confirmation.</p>
              <p>Staff can print or scan the QR card from the dashboard to share this link again.</p>
            </div>
            <div className="rounded-3xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 text-sm">
              <p className="font-semibold text-[var(--ink)]">Selected doctor</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                {selectedDoctor?.name || "No doctor selected"}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                {selectedDoctor?.specialization || "Select a doctor to continue"}
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 text-sm">
              <p className="font-semibold text-[var(--ink)]">Organization</p>
              <p className="mt-1 text-[var(--ink-soft)]">{context.organization.name}</p>
              {context.organization.address && (
                <p className="mt-2 text-xs text-[var(--ink-soft)]">{context.organization.address}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
