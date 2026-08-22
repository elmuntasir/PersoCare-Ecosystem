"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveApplication,
  rejectApplication,
  type PendingApplicationItem,
} from "@/actions/platform-admin/applications";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Search,
} from "lucide-react";

interface ApplicationsClientProps {
  initialApplications: PendingApplicationItem[];
}

export function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<PendingApplicationItem[]>(initialApplications);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [rejectModalApp, setRejectModalApp] = useState<PendingApplicationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplications = applications.filter(
    (app) =>
      app.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.organizationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleApprove(application: PendingApplicationItem) {
    if (!confirm(`Are you sure you want to approve "${application.organizationName}"?`)) return;

    setLoadingId(application.id);
    setActionType("approve");
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("applicationId", application.id);

      const res = await approveApplication(formData);
      if (res.success) {
        setApplications((prev) => prev.filter((a) => a.id !== application.id));
        setSuccessMessage(`Successfully approved "${application.organizationName}". The facility is now live and verified.`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve application");
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModalApp) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoadingId(rejectModalApp.id);
    setActionType("reject");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("applicationId", rejectModalApp.id);
      formData.append("rejectionReason", rejectionReason);

      const res = await rejectApplication(formData);
      if (res.success) {
        setApplications((prev) => prev.filter((a) => a.id !== rejectModalApp.id));
        setSuccessMessage(`Application for "${rejectModalApp.organizationName}" was rejected.`);
        setRejectModalApp(null);
        setRejectionReason("");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject application");
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Search and Filter Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" />
          <input
            type="text"
            placeholder="Search pending applications by name, type, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--sage-200)] bg-white text-sm font-body text-[var(--ink)] placeholder:text-[var(--ink-soft)]/70 focus-visible:outline-2 focus-visible:outline-[var(--coral)] shadow-xs"
          />
        </div>

        <div className="text-xs font-mono text-[var(--ink-soft)]">
          Showing <span className="font-bold text-[var(--teal-900)]">{filteredApplications.length}</span> pending request{filteredApplications.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Status Notifications ── */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-body flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-body flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Applications List ── */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center shadow-xs">
          <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500 mb-3 opacity-60" strokeWidth={1.5} />
          <h3 className="font-display text-xl font-bold text-[var(--teal-900)]">
            All Caught Up!
          </h3>
          <p className="font-body text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
            There are no pending organization applications requiring platform review at this moment.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredApplications.map((app) => {
            const isProcessing = loadingId === app.id;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-7 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header: Facility Name, Type, Status Pill */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" strokeWidth={1.8} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-xl font-bold text-[var(--teal-900)]">
                          {app.organizationName}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-semibold">
                          Awaiting Approval
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs font-body text-[var(--ink-soft)]">
                        <span className="font-mono px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--sage-200)]">
                          {app.organizationType}
                        </span>
                        <span>·</span>
                        <span className="font-mono">Slug: /{app.slug}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Approve / Reject */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectModalApp(app);
                        setRejectionReason("");
                      }}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-body font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(app)}
                      disabled={isProcessing}
                      className="px-5 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-body font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isProcessing && actionType === "approve" ? (
                        <span>Approving...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Facility Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs font-body text-[var(--ink-soft)]">
                  {app.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[var(--coral)] shrink-0 mt-0.5" />
                      <span>{app.address}</span>
                    </div>
                  )}

                  {app.specialties && app.specialties.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono uppercase tracking-wider text-[11px] text-[var(--ink-soft)] mr-1">
                        Departments:
                      </span>
                      {app.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--sage-200)] text-[11px] text-[var(--teal-900)]"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applicant / Owner Credentials Info Bar */}
                <div className="pt-4 border-t border-[var(--sage-200)]/70 flex flex-wrap items-center justify-between gap-4 text-xs font-body text-[var(--ink-soft)]">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[var(--teal-900)]" strokeWidth={1.8} />
                      <span>Applicant: <strong className="text-[var(--ink)] font-semibold">{app.user.name}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[var(--teal-700)]" strokeWidth={1.8} />
                      <a href={`mailto:${app.user.email}`} className="hover:text-[var(--coral)]">
                        {app.user.email}
                      </a>
                    </div>

                    {app.user.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[var(--coral)]" strokeWidth={1.8} />
                        <span>{app.user.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Submitted on {new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rejection Modal ── */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[var(--sage-200)] space-y-4 animate-in fade-in zoom-in-95">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-rose-600 font-semibold">
                Reject Organization Application
              </p>
              <h3 className="font-display text-xl font-bold text-[var(--teal-900)] mt-0.5">
                {rejectModalApp.organizationName}
              </h3>
              <p className="text-xs font-body text-[var(--ink-soft)] mt-1">
                Please specify the reason for rejection to inform applicant {rejectModalApp.user.name}.
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete facility registration documents, invalid address, or duplicate organization request..."
                  rows={3}
                  required
                  className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-xs font-body font-medium text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === rejectModalApp.id}
                  className="px-5 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 text-xs font-body font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  {loadingId === rejectModalApp.id ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
