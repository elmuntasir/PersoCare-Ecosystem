"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Calendar,
  Syringe,
  Upload,
  Download,
  Activity,
  Clipboard,
  Info,
} from "lucide-react";
import { DrugDetailsModal } from "@/components/drug/DrugDetailsModal";

interface MedicalRecordsClientProps {
  data: {
    prescriptions: any[];
    measurements: any[];
    healthEvents: any[];
    vaccinations: any[];
    documents: any[];
  };
}

type Tab = "prescriptions" | "measurements" | "history" | "vaccinations" | "documents";

export function MedicalRecordsClient({ data }: MedicalRecordsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("prescriptions");

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: "prescriptions", label: "Prescriptions", icon: FileText, count: data.prescriptions.length },
    { id: "measurements", label: "Measurements", icon: Activity, count: data.measurements.length },
    { id: "history", label: "Health History", icon: Clipboard, count: data.healthEvents.length },
    { id: "vaccinations", label: "Vaccinations", icon: Syringe, count: data.vaccinations.length },
    { id: "documents", label: "Documents", icon: Upload, count: data.documents.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-2 shadow-sm flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body transition-colors ${
                isActive
                  ? "bg-[var(--teal-900)] text-white font-medium"
                  : "text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.6} />
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[var(--sage-200)] text-[var(--ink-soft)]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm min-h-[300px]">
        {activeTab === "prescriptions" && <PrescriptionsTab data={data.prescriptions} />}
        {activeTab === "measurements" && <MeasurementsTab data={data.measurements} />}
        {activeTab === "history" && <HealthHistoryTab data={data.healthEvents} />}
        {activeTab === "vaccinations" && <VaccinationsTab data={data.vaccinations} />}
        {activeTab === "documents" && <DocumentsTab data={data.documents} />}
      </div>
    </div>
  );
}

// ─── Prescriptions Tab ──────────────────────────────────────

function PrescriptionsTab({ data }: { data: any[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<{
    prescriptionMedicineId: string;
    medicineName: string;
  } | null>(null);

  if (data.length === 0) {
    return <EmptyState message="No prescriptions yet. Visit a doctor to receive structured prescriptions." />;
  }

  const handleDownloadPDF = async (rx: any) => {
    try {
      setDownloadingId(rx.id);
      const { pdf } = await import("@react-pdf/renderer");
      const { PrescriptionPDF } = await import("@/components/prescription/PrescriptionPDF");

      const blob = await pdf(<PrescriptionPDF prescription={rx} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription-${rx.id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate prescription PDF:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {data.map((rx) => (
        <div key={rx.id} className="border border-[var(--sage-200)] rounded-xl p-5 bg-[var(--paper)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-body font-medium text-[var(--ink)] text-base">
                Dr. {rx.doctorName}
              </p>
              <p className="text-sm text-[var(--ink-soft)] font-body">
                {rx.organizationName} • {format(new Date(rx.date), "MMM dd, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                Prescribed ✓
              </span>
              <button
                type="button"
                onClick={() => handleDownloadPDF(rx)}
                disabled={downloadingId === rx.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[var(--sage-200)] hover:bg-[var(--paper)] text-xs font-body font-semibold text-[var(--teal-900)] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                title="Download print-ready PDF"
              >
                <Download className="w-3.5 h-3.5" />
                {downloadingId === rx.id ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>

          {rx.medicines && rx.medicines.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--sage-200)]">
              <h4 className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider">
                Prescribed Medicines ({rx.medicines.length})
              </h4>
              <ul className="mt-2 space-y-2">
                {rx.medicines.map((med: any) => (
                  <li key={med.id} className="text-sm font-body text-[var(--ink)] bg-white p-3 rounded-lg border border-[var(--sage-200)]">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-[var(--teal-900)]">{med.medicineName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedMedicine({
                              prescriptionMedicineId: med.id,
                              medicineName: med.medicineName,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--sage-200)] bg-white px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                          title="View medicine details"
                        >
                          <Info className="h-3 w-3" strokeWidth={1.8} />
                          Details
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {med.dosage && (
                          <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200 font-mono">
                            Dosage: {med.dosage}
                          </span>
                        )}
                        {med.frequency && (
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-mono">
                            Frequency: {med.frequency}
                          </span>
                        )}
                        {med.duration && (
                          <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 font-mono">
                            Duration: {med.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rx.items && rx.items.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--sage-200)]">
              <h4 className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider">
                Clinical Recommendations &amp; Advice
              </h4>
              <ul className="mt-2 space-y-1.5">
                {rx.items.map((item: any) => (
                  <li key={item.id} className="text-sm font-body text-[var(--ink)] flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-[var(--sage-200)]">
                    <span className="font-mono text-xs text-[var(--teal-900)] bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase font-medium shrink-0">
                      {item.category}
                    </span>
                    <span className="pt-0.5">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <DrugDetailsModal
        open={Boolean(selectedMedicine)}
        prescriptionMedicineId={selectedMedicine?.prescriptionMedicineId || null}
        medicineName={selectedMedicine?.medicineName}
        onClose={() => setSelectedMedicine(null)}
      />
    </div>
  );
}

// ─── Measurements Tab ──────────────────────────────────────

function MeasurementsTab({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <EmptyState message="No clinical measurements recorded yet." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--paper)] border-b border-[var(--sage-200)]">
            <th className="px-4 py-2.5 text-left font-mono text-xs uppercase text-[var(--ink-soft)]">Date</th>
            <th className="px-4 py-2.5 text-left font-mono text-xs uppercase text-[var(--ink-soft)]">Height</th>
            <th className="px-4 py-2.5 text-left font-mono text-xs uppercase text-[var(--ink-soft)]">Weight</th>
            <th className="px-4 py-2.5 text-left font-mono text-xs uppercase text-[var(--ink-soft)]">BP (mmHg)</th>
            <th className="px-4 py-2.5 text-left font-mono text-xs uppercase text-[var(--ink-soft)]">Glucose</th>
            <th className="px-4 py-2.5 text-left font-mono text-xs uppercase text-[var(--ink-soft)]">HbA1c</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--sage-200)]">
          {data.map((m) => (
            <tr key={m.id} className="hover:bg-[var(--paper)]">
              <td className="px-4 py-2.5 font-body text-[var(--ink)]">
                {format(new Date(m.measuredAt), "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-2.5 font-body text-[var(--ink-soft)]">
                {m.heightCm ? `${m.heightCm} cm` : "—"}
              </td>
              <td className="px-4 py-2.5 font-body text-[var(--ink-soft)]">
                {m.weightKg ? `${m.weightKg} kg` : "—"}
              </td>
              <td className="px-4 py-2.5 font-body font-medium text-[var(--ink)]">
                {m.systolicBp && m.diastolicBp ? `${m.systolicBp}/${m.diastolicBp}` : "—"}
              </td>
              <td className="px-4 py-2.5 font-body text-[var(--ink-soft)]">
                {m.glucose ? `${m.glucose} mg/dL` : "—"}
              </td>
              <td className="px-4 py-2.5 font-body text-[var(--ink-soft)]">
                {m.hba1c ? `${m.hba1c} %` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Health History Tab ────────────────────────────────────

function HealthHistoryTab({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <EmptyState message="No health history events recorded." />;
  }

  return (
    <div className="space-y-4">
      {data.map((event) => (
        <div key={event.id} className="border border-[var(--sage-200)] rounded-xl p-4 bg-[var(--paper)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-body font-medium text-[var(--ink)]">{event.title}</p>
              <p className="text-sm text-[var(--ink-soft)] font-body">
                {event.eventType} •{" "}
                {event.occurredAt
                  ? format(new Date(event.occurredAt), "MMM dd, yyyy")
                  : "Date unknown"}
                {event.status && ` • Status: ${event.status}`}
              </p>
              {event.description && (
                <p className="text-sm text-[var(--ink)] mt-2 font-body">{event.description}</p>
              )}
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--sage-200)] text-[var(--ink-soft)] font-mono">
              {event.source}
            </span>
          </div>

          {event.documents && event.documents.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[var(--sage-200)] flex flex-wrap gap-2">
              {event.documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--coral)] hover:underline flex items-center gap-1 font-body"
                >
                  <FileText className="w-3.5 h-3.5" strokeWidth={1.6} />
                  {doc.documentType || "Attached Document"}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Vaccinations Tab ──────────────────────────────────────

function VaccinationsTab({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <EmptyState message="No vaccinations recorded." />;
  }

  return (
    <div className="space-y-3">
      {data.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)]"
        >
          <div>
            <p className="font-body font-medium text-[var(--ink)]">{v.vaccineName}</p>
            <p className="text-sm text-[var(--ink-soft)] font-body">
              Dose #{v.doseNumber || 1} •{" "}
              {v.administeredAt
                ? format(new Date(v.administeredAt), "MMM dd, yyyy")
                : "Administration date not recorded"}
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
            Recorded
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Documents Tab ──────────────────────────────────────────

function DocumentsTab({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <EmptyState message="No uploaded documents yet. Upload lab reports and test scans." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((doc) => (
        <div
          key={doc.id}
          className="border border-[var(--sage-200)] rounded-xl p-4 bg-[var(--paper)] flex items-start justify-between"
        >
          <div>
            <p className="font-body font-medium text-[var(--ink)]">{doc.title}</p>
            <p className="text-xs text-[var(--ink-soft)] font-mono mt-0.5">
              {doc.documentType} • {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
            </p>
            {doc.description && (
              <p className="text-sm text-[var(--ink)] mt-1.5 font-body">{doc.description}</p>
            )}
          </div>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-[var(--sage-200)] transition-colors text-[var(--teal-900)]"
            title="Download Document"
          >
            <Download className="w-4 h-4" strokeWidth={1.6} />
          </a>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Clipboard className="w-10 h-10 mx-auto text-[var(--ink-soft)] opacity-40 mb-2" strokeWidth={1.6} />
      <p className="font-body text-[var(--ink-soft)]">{message}</p>
    </div>
  );
}
