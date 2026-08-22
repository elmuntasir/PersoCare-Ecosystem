"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPrescription } from "@/actions/doctor/appointments";
import { getAppointmentById } from "@/actions/doctor/appointments";
import { format } from "date-fns";
import {
  User,
  Calendar,
  Clock,
  Building,
  Phone,
  Mail,
  Plus,
  Trash2,
  Stethoscope,
  ChevronLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BadgeInfo,
  Sparkles,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { DrugLookupInput } from "@/components/drug/DrugLookupInput";
import type { DrugSearchResult } from "@/lib/drug-apis";

type Appointment = Awaited<ReturnType<typeof getAppointmentById>>;

interface MedicineTiming {
  mealRelation: "PRE_MEAL" | "WITH_MEAL" | "POST_MEAL";
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  dosage: string;
}

interface MedicineForm {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  drugProfile: DrugSearchResult | null;
  timingInstructions: MedicineTiming[];
}

interface ItemForm {
  category: "diet" | "habit" | "medicalTest" | "supplement";
  value: string;
}

const ITEM_CATEGORY_LABELS: Record<string, string> = {
  diet: "Diet",
  habit: "Habit",
  medicalTest: "Medical Test",
  supplement: "Supplement",
};

const ITEM_CATEGORY_COLORS: Record<string, string> = {
  diet: "text-emerald-700 bg-emerald-50",
  habit: "text-blue-700 bg-blue-50",
  medicalTest: "text-purple-700 bg-purple-50",
  supplement: "text-amber-700 bg-amber-50",
};

const MEAL_RELATION_LABELS: Record<MedicineTiming["mealRelation"], string> = {
  PRE_MEAL: "Before meal",
  WITH_MEAL: "With meal",
  POST_MEAL: "After meal",
};

const MEAL_TYPE_LABELS: Record<MedicineTiming["mealType"], string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

export function AppointmentDetailClient({
  appointment,
}: {
  appointment: Appointment;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [medicines, setMedicines] = useState<MedicineForm[]>([]);
  const [expandedMedicineIndex, setExpandedMedicineIndex] = useState<number | null>(null);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [patientStatedIssues, setPatientStatedIssues] = useState("");
  const [doctorDiscovery, setDoctorDiscovery] = useState("");

  const prescription = appointment.prescriptions[0] ?? null;
  const isPrescribed = !!prescription;
  const clinicalNotes = prescription?.clinicalNotes as
    | { patientStatedIssues?: string; doctorDiscovery?: string }
    | null;
  const patientName = appointment.patientName || appointment.patient?.name || "Guest patient";
  const patientPhone = appointment.patientPhone || appointment.patient?.phone || "";
  const patientGender = appointment.patientGender || appointment.patient?.gender || "—";
  const patientDobLabel = appointment.patient?.dob
    ? format(new Date(appointment.patient.dob), "MMM dd, yyyy")
    : null;

  const addMedicine = () =>
    setMedicines((prev) => [
      ...prev,
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        drugProfile: null,
        timingInstructions: [
          { mealRelation: "WITH_MEAL", mealType: "BREAKFAST", dosage: "" },
        ],
      },
    ]);

  const removeMedicine = (i: number) =>
    setMedicines((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      setExpandedMedicineIndex((current) => {
        if (current === null) return null;
        if (current === i) return null;
        if (current > i) return current - 1;
        return current;
      });
      return next;
    });

  const updateMedicine = (i: number, field: keyof Omit<MedicineForm, "timingInstructions">, value: string) =>
    setMedicines((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });

  const addMedicineTiming = (medIndex: number) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[medIndex] = {
        ...copy[medIndex],
        timingInstructions: [
          ...(copy[medIndex].timingInstructions || []),
          { mealRelation: "WITH_MEAL", mealType: "LUNCH", dosage: "" },
        ],
      };
      return copy;
    });
  };

  const removeMedicineTiming = (medIndex: number, timingIndex: number) => {
    setMedicines((prev) => {
      const copy = [...prev];
      copy[medIndex] = {
        ...copy[medIndex],
        timingInstructions: copy[medIndex].timingInstructions.filter(
          (_, idx) => idx !== timingIndex
        ),
      };
      return copy;
    });
  };

  const updateMedicineTiming = (
    medIndex: number,
    timingIndex: number,
    field: keyof MedicineTiming,
    value: string
  ) => {
    setMedicines((prev) => {
      const copy = [...prev];
      const timings = [...copy[medIndex].timingInstructions];
      timings[timingIndex] = { ...timings[timingIndex], [field]: value };
      copy[medIndex] = { ...copy[medIndex], timingInstructions: timings };
      return copy;
    });
  };

  const addItem = () =>
    setItems((prev) => [...prev, { category: "diet", value: "" }]);

  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: keyof ItemForm, value: string) =>
    setItems((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value as ItemForm["category"] };
      return copy;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (medicines.length === 0) {
      setError("Add at least one medicine to complete the prescription.");
      setLoading(false);
      return;
    }

    const incomplete = medicines.some(
      (m) => !m.medicineName || !m.dosage || !m.frequency || !m.duration
    );
    if (incomplete) {
      setError("Please fill in all fields for each medicine.");
      setLoading(false);
      return;
    }

    const doctorId = appointment.doctors[0]?.doctorUserId;
    if (!doctorId) {
      setError("No doctor assigned to this appointment.");
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("appointmentId", appointment.id);
    fd.append("patientId", appointment.patientId);
    fd.append("doctorId", doctorId);
    fd.append("organizationId", appointment.organizationId);
    fd.append(
      "medicines",
      JSON.stringify(
        medicines.map((med) => ({
          ...med,
          drugProfile: med.drugProfile
            ? {
                brandId: med.drugProfile.brandId,
                slug: med.drugProfile.slug,
                url: med.drugProfile.medexUrl,
                brandName: med.drugProfile.label,
                company: med.drugProfile.company,
                genericName: med.drugProfile.genericName,
                rxnormRxcui: med.drugProfile.rxnorm?.rxcui,
                rxnormName: med.drugProfile.rxnorm?.name,
                highlights: [],
              }
            : null,
        }))
      )
    );
    fd.append("items", JSON.stringify(items));
    fd.append("patientStatedIssues", patientStatedIssues);
    fd.append("doctorDiscovery", doctorDiscovery);

    try {
      await createPrescription(fd);
      router.push("/dashboard/doctor/appointments");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--sage-200)] px-3 py-2 text-sm font-body text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/40 bg-white";

  const summarizeTimings = (timings: MedicineTiming[]) =>
    timings.map((timing) => {
      const relation = MEAL_RELATION_LABELS[timing.mealRelation] ?? timing.mealRelation;
      const meal = MEAL_TYPE_LABELS[timing.mealType] ?? timing.mealType;
      return timing.dosage ? `${relation} · ${meal} · ${timing.dosage}` : `${relation} · ${meal}`;
    });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/doctor/appointments"
        className="inline-flex items-center gap-1.5 text-sm font-body text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
        Back to Appointments
      </Link>

      {/* ── Patient Info Card ── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
        <h2 className="font-display text-xl text-[var(--teal-900)] font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--coral)]" strokeWidth={1.8} />
          Patient Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                {patientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-body font-semibold text-[var(--ink)]">
                  {patientName}
                </p>
                <p className="text-xs text-[var(--ink-soft)] font-body">
                  {patientGender} •{" "}
                  {appointment.patientAge != null
                    ? `${appointment.patientAge} years`
                    : patientDobLabel || "DOB unknown"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-[var(--ink-soft)] font-body pl-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.6} />
                {appointment.patient?.email || "Guest booking"}
              </span>
              {patientPhone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.6} />
                  {patientPhone}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm font-body text-[var(--ink-soft)]">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 shrink-0" strokeWidth={1.6} />
              <span>{appointment.organization.name}</span>
            </div>
            {appointment.bookedSlotTime && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" strokeWidth={1.6} />
                  <span>
                    {format(new Date(appointment.bookedSlotTime), "EEEE, MMMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" strokeWidth={1.6} />
                  <span>{format(new Date(appointment.bookedSlotTime), "hh:mm a")}</span>
                </div>
              </>
            )}
            {appointment.serialNumber && (
              <span className="inline-block font-mono text-xs bg-[var(--sage-200)] px-2 py-0.5 rounded-full">
                Queue #{appointment.serialNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Prescription Section ── */}
      {isPrescribed ? (
        /* View existing prescription */
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2} />
            <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
              Prescription Issued
            </h3>
          </div>

          {clinicalNotes && (
            <div className="grid sm:grid-cols-2 gap-4">
              {clinicalNotes.patientStatedIssues && (
                <div className="bg-[var(--paper)] rounded-xl p-4 border border-[var(--sage-200)]">
                  <p className="text-xs font-mono text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                    Patient Stated Issues
                  </p>
                  <p className="text-sm font-body text-[var(--ink)]">
                    {clinicalNotes.patientStatedIssues}
                  </p>
                </div>
              )}
              {clinicalNotes.doctorDiscovery && (
                <div className="bg-[var(--paper)] rounded-xl p-4 border border-[var(--sage-200)]">
                  <p className="text-xs font-mono text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                    Doctor&apos;s Discovery
                  </p>
                  <p className="text-sm font-body text-[var(--ink)]">
                    {clinicalNotes.doctorDiscovery}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="font-body font-semibold text-[var(--ink)] text-sm mb-2">
              Medicines
            </h4>
            {prescription.medicines.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">No medicines prescribed.</p>
            ) : (
              <div className="space-y-2">
                {prescription.medicines.map((med) => {
                  const timings = (med.timingInstructions as unknown as MedicineTiming[]) || [];
                  return (
                    <div
                      key={med.id}
                      className="space-y-2 bg-[var(--paper)] rounded-xl px-4 py-3 border border-[var(--sage-200)]"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-body font-semibold text-sm text-[var(--ink)]">
                          {med.medicineName}
                        </span>
                        <span className="text-xs font-mono text-[var(--ink-soft)]">{med.dosage}</span>
                        <span className="text-xs text-[var(--ink-soft)]">·</span>
                        <span className="text-xs font-body text-[var(--ink-soft)]">
                          {med.frequency}
                        </span>
                        <span className="text-xs text-[var(--ink-soft)]">·</span>
                        <span className="text-xs font-body text-[var(--ink-soft)]">
                          {med.duration}
                        </span>
                      </div>
                      {timings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--sage-200)]/60">
                          {timings.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[11px] font-body px-2 py-0.5 rounded-full bg-[var(--sage-200)] text-[var(--ink-soft)]"
                            >
                              {t.mealRelation.replace('_', ' ')} {t.mealType}
                              {t.dosage && ` (${t.dosage})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {prescription.items.length > 0 && (
            <div>
              <h4 className="font-body font-semibold text-[var(--ink)] text-sm mb-2">
                Additional Instructions
              </h4>
              <div className="space-y-2">
                {prescription.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-[var(--paper)] rounded-xl px-4 py-3 border border-[var(--sage-200)]"
                  >
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        ITEM_CATEGORY_COLORS[item.category] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ITEM_CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <span className="text-sm font-body text-[var(--ink)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Create prescription form */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm space-y-6"
        >
          <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[var(--coral)]" strokeWidth={1.8} />
            Initiate Checkup & Prescribe
          </h3>

          {/* Clinical Notes */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body font-medium text-[var(--ink)] mb-1.5">
                Patient Stated Issues
              </label>
              <textarea
                value={patientStatedIssues}
                onChange={(e) => setPatientStatedIssues(e.target.value)}
                rows={4}
                placeholder="What the patient reported…"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-[var(--ink)] mb-1.5">
                Doctor&apos;s Discovery
              </label>
              <textarea
                value={doctorDiscovery}
                onChange={(e) => setDoctorDiscovery(e.target.value)}
                rows={4}
                placeholder="Clinical findings, observations…"
                className={inputClass}
              />
            </div>
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-body font-semibold text-[var(--ink)] text-sm">
                Medicines <span className="text-rose-500">*</span>
              </h4>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-1.5 text-xs font-body text-[var(--coral)] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Add Medicine
              </button>
            </div>

            {medicines.length === 0 && (
              <p className="text-xs text-[var(--ink-soft)] font-body italic">
                No medicines added yet. Click &quot;Add Medicine&quot; to start.
              </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)]">
              <div className="hidden lg:grid grid-cols-[minmax(220px,1.5fr)_120px_120px_120px_1.2fr_120px] gap-3 border-b border-[var(--sage-200)] bg-white px-4 py-3 text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                <span>Medicine</span>
                <span>Dosage</span>
                <span>Frequency</span>
                <span>Duration</span>
                <span>Timing</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-[var(--sage-200)]">
                {medicines.map((med, i) => {
                  const timingSummary = summarizeTimings(med.timingInstructions);
                  const isExpanded = expandedMedicineIndex === i;

                  return (
                    <div key={i} className="bg-white">
                      <div className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(220px,1.5fr)_120px_120px_120px_1.2fr_120px] lg:items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--coral)]/10 text-[var(--coral)]">
                              <Pill className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <DrugLookupInput
                                value={med.medicineName}
                                onChange={(value) => updateMedicine(i, "medicineName", value)}
                                onSelect={(drug) =>
                                  setMedicines((prev) => {
                                    const copy = [...prev];
                                    copy[i] = {
                                      ...copy[i],
                                      medicineName: drug?.label ?? copy[i].medicineName,
                                      drugProfile: drug,
                                    };
                                    return copy;
                                  })
                                }
                                selectedDrug={med.drugProfile}
                                placeholder="Medicine name"
                              />
                            </div>
                          </div>
                          <p className="text-[11px] text-[var(--ink-soft)] font-body">
                            {med.drugProfile
                              ? "Matched with MedEx and RxNorm data."
                              : "Search to attach the medicine record and clinical metadata."}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(timingSummary.length > 0 ? timingSummary : ["No timing added yet"]).map((label) => (
                              <span
                                key={label}
                                className="rounded-full bg-[var(--sage-200)] px-2.5 py-1 text-[10px] font-body text-[var(--ink-soft)]"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:contents">
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={med.frequency}
                            onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                            className={inputClass}
                          />

                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {med.timingInstructions.map((timing, tIdx) => (
                                <span
                                  key={`${i}-${tIdx}`}
                                  className="rounded-full border border-[var(--sage-200)] bg-white px-2.5 py-1 text-[10px] font-body text-[var(--ink-soft)]"
                                >
                                  {MEAL_RELATION_LABELS[timing.mealRelation]} {MEAL_TYPE_LABELS[timing.mealType]}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-[var(--ink-soft)] font-body">
                              {med.timingInstructions.length} timing rule
                              {med.timingInstructions.length === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="flex items-start justify-end gap-2 lg:justify-end">
                            <button
                              type="button"
                              onClick={() => setExpandedMedicineIndex(isExpanded ? null : i)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sage-200)] bg-white px-3 py-2 text-xs font-medium text-[var(--teal-900)] transition-colors hover:bg-[var(--sage-200)]"
                            >
                              <BadgeInfo className="h-3.5 w-3.5" strokeWidth={2} />
                              {isExpanded ? "Hide" : "Details"}
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMedicine(i)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[var(--sage-200)] bg-[var(--paper)] px-4 py-4">
                          <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                            <div className="rounded-2xl border border-[var(--sage-200)] bg-white p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--teal-900)]">
                                <Sparkles className="h-4 w-4 text-[var(--coral)]" strokeWidth={2} />
                                Drug Match
                              </div>
                              {med.drugProfile ? (
                                <div className="mt-3 space-y-2 text-sm font-body text-[var(--ink)]">
                                  <p className="font-semibold">{med.drugProfile.label}</p>
                                  <p className="text-[var(--ink-soft)]">
                                    {med.drugProfile.company || "Unknown company"}
                                    {med.drugProfile.genericName ? ` · ${med.drugProfile.genericName}` : ""}
                                  </p>
                                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[var(--ink-soft)]">
                                    {med.drugProfile.medexUrl ? (
                                      <span className="rounded-full bg-[var(--sage-200)] px-2.5 py-1">MedEx record linked</span>
                                    ) : null}
                                    {med.drugProfile.rxnorm?.name ? (
                                      <span className="rounded-full bg-[var(--sage-200)] px-2.5 py-1">
                                        RxNorm: {med.drugProfile.rxnorm.name}
                                      </span>
                                    ) : null}
                                    {med.drugProfile.rxnorm?.rxcui ? (
                                      <span className="rounded-full bg-[var(--sage-200)] px-2.5 py-1">
                                        RxCUI {med.drugProfile.rxnorm.rxcui}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-3 text-sm text-[var(--ink-soft)] font-body">
                                  No linked drug record yet. Search and select a medicine to attach MedEx and RxNorm data.
                                </p>
                              )}
                            </div>

                            <div className="rounded-2xl border border-[var(--sage-200)] bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--teal-900)]">
                                  <Clock className="h-4 w-4 text-[var(--coral)]" strokeWidth={2} />
                                  Meal Timing
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addMedicineTiming(i)}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--coral)] hover:underline"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Timing
                                </button>
                              </div>

                              <div className="mt-3 space-y-3">
                                {med.timingInstructions.map((timing, tIdx) => (
                                  <div
                                    key={`${i}-${tIdx}-timing`}
                                    className="grid gap-2 rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] p-3 md:grid-cols-[140px_140px_1fr_auto]"
                                  >
                                    <select
                                      value={timing.mealRelation}
                                      onChange={(e) =>
                                        updateMedicineTiming(i, tIdx, "mealRelation", e.target.value as MedicineTiming["mealRelation"])
                                      }
                                      className="rounded-lg border border-[var(--sage-200)] bg-white px-2 py-2 text-xs font-body text-[var(--ink)] focus:outline-none"
                                    >
                                      <option value="PRE_MEAL">Before Meal</option>
                                      <option value="WITH_MEAL">With Meal</option>
                                      <option value="POST_MEAL">After Meal</option>
                                    </select>
                                    <select
                                      value={timing.mealType}
                                      onChange={(e) =>
                                        updateMedicineTiming(i, tIdx, "mealType", e.target.value as MedicineTiming["mealType"])
                                      }
                                      className="rounded-lg border border-[var(--sage-200)] bg-white px-2 py-2 text-xs font-body text-[var(--ink)] focus:outline-none"
                                    >
                                      <option value="BREAKFAST">Breakfast</option>
                                      <option value="LUNCH">Lunch</option>
                                      <option value="DINNER">Dinner</option>
                                      <option value="SNACK">Snack</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Timing dosage (optional)"
                                      value={timing.dosage}
                                      onChange={(e) => updateMedicineTiming(i, tIdx, "dosage", e.target.value)}
                                      className="rounded-lg border border-[var(--sage-200)] bg-white px-3 py-2 text-xs font-body text-[var(--ink)] focus:outline-none"
                                    />
                                    {med.timingInstructions.length > 1 ? (
                                      <button
                                        type="button"
                                        onClick={() => removeMedicineTiming(i, tIdx)}
                                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                      >
                                        Remove
                                      </button>
                                    ) : (
                                      <span className="hidden md:block" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-body font-semibold text-[var(--ink)] text-sm">
                Additional Instructions
              </h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-body text-[var(--coral)] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-[var(--paper)] rounded-xl p-3 border border-[var(--sage-200)]"
                >
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(i, "category", e.target.value)}
                    className="rounded-lg border border-[var(--sage-200)] px-2 py-1.5 text-xs font-body text-[var(--ink)] bg-white focus:outline-none"
                  >
                    <option value="diet">Diet</option>
                    <option value="habit">Habit</option>
                    <option value="medicalTest">Medical Test</option>
                    <option value="supplement">Supplement</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Instruction…"
                    value={item.value}
                    onChange={(e) => updateItem(i, "value", e.target.value)}
                    className={`flex-1 ${inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-600 font-body bg-rose-50 rounded-xl px-4 py-2.5 border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/doctor/appointments"
              className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] text-sm font-body font-medium hover:bg-[var(--sage-200)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-[var(--coral)] text-white text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Prescribing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  Prescribe & Complete
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
