"use client";

import { useEffect, useState } from "react";
import {
  searchOrganizationsWithBlood,
  type OrganizationBloodResult,
} from "@/actions/blood/organization-blood";
import {
  applyForBloodBag,
  getMyBloodBagRequests,
} from "@/actions/blood/bag-requests";
import {
  Building2,
  Droplets,
  Search,
  MapPin,
  Clock3,
  X,
  Heart,
  AlertCircle,
  Send,
} from "lucide-react";

type MyRequest = Awaited<ReturnType<typeof getMyBloodBagRequests>>[number];

const BLOOD_TYPE_LABELS: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A\u2212",
  B_POS: "B+",
  B_NEG: "B\u2212",
  AB_POS: "AB+",
  AB_NEG: "AB\u2212",
  O_POS: "O+",
  O_NEG: "O\u2212",
};

const ALL_BLOOD_TYPES = Object.keys(BLOOD_TYPE_LABELS);

const REQUEST_STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

const inputCls =
  "w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all";

export function OrganizationBloodSearch() {
  const [results, setResults] = useState<OrganizationBloodResult[]>([]);
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [bloodType, setBloodType] = useState("");
  const [units, setUnits] = useState("");
  const [loading, setLoading] = useState(false);

  const [applyOrg, setApplyOrg] = useState<OrganizationBloodResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [form, setForm] = useState({
    bloodType: "",
    unitsNeeded: 1,
    patientName: "",
    contactPhone: "",
    notes: "",
  });
  const [flash, setFlash] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      if (bloodType) fd.append("bloodType", bloodType);
      if (units) fd.append("units", units);
      const data = await searchOrganizationsWithBlood(fd);
      setResults(data);
    } catch (err) {
      console.error("Failed to search blood availability", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      try {
        const [data, myRequests] = await Promise.all([
          searchOrganizationsWithBlood(new FormData()),
          getMyBloodBagRequests(),
        ]);
        if (!cancelled) {
          setResults(data);
          setRequests(myRequests);
        }
      } catch (err) {
        console.error("Failed to load blood availability", err);
        if (!cancelled) {
          setResults([]);
          setRequests([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadAll();
    return () => {
      cancelled = true;
    };
    // Load all organizations and the user's own applications once on mount.
  }, []);

  const openApply = (org: OrganizationBloodResult) => {
    setApplyOrg(org);
    setApplyError(null);
    setForm({
      bloodType: org.bloodTypeCounts[0]?.bloodType ?? "",
      unitsNeeded: 1,
      patientName: "",
      contactPhone: "",
      notes: "",
    });
  };

  const selectedCount =
    applyOrg?.bloodTypeCounts.find((c) => c.bloodType === form.bloodType)?.count ?? 0;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyOrg) return;
    setApplying(true);
    setApplyError(null);
    try {
      const fd = new FormData();
      fd.append("organizationId", applyOrg.organizationId);
      fd.append("bloodType", form.bloodType);
      fd.append("unitsNeeded", String(form.unitsNeeded));
      if (form.patientName) fd.append("patientName", form.patientName);
      if (form.contactPhone) fd.append("contactPhone", form.contactPhone);
      if (form.notes) fd.append("notes", form.notes);
      await applyForBloodBag(fd);
      setApplyOrg(null);
      setFlash(`Application sent to ${applyOrg.organizationName}`);
      setRequests(await getMyBloodBagRequests());
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to submit your application");
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)] mr-1 self-center">
          <Search className="w-4 h-4 text-[var(--teal-700)]" strokeWidth={1.8} />
          <span>SEARCH BLOOD BAGS:</span>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-1">
            Blood Type
          </label>
          <select
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            className="rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
          >
            <option value="">All Blood Types</option>
            {ALL_BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>
                {BLOOD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-1">
            Units Needed
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 2"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            className="w-28 rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
          />
        </div>

        <button
          type="button"
          onClick={() => runSearch()}
          disabled={loading}
          className="ml-auto px-5 py-2.5 rounded-full bg-[var(--teal-900)] text-white text-sm font-semibold hover:bg-[var(--teal-700)] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Searching..." : "Search Organizations"}
        </button>
      </div>

      {flash && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-body text-emerald-800">
          <CheckIcon />
          <span>{flash}</span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-[var(--teal-700)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-body text-sm text-[var(--ink-soft)]">Checking blood banks near you...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((org) => (
            <div
              key={org.organizationId}
              className="rounded-2xl border border-[var(--sage-200)] bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-[var(--teal-900)] truncate">
                      {org.organizationName}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)] font-mono uppercase">
                      {org.organizationType}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {org.availableUnits} unit{org.availableUnits === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-1.5">
                {org.bloodTypeCounts.map(({ bloodType: bt, count, expiringSoon }) => (
                  <div
                    key={bt}
                    className="flex items-center justify-between gap-1 rounded-xl bg-rose-50/60 border border-rose-100 px-2.5 py-1.5"
                  >
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-rose-700">
                      <Droplets className="w-3 h-3" strokeWidth={1.8} />
                      {BLOOD_TYPE_LABELS[bt] ?? bt}
                      {count > 1 ? (
                        <span className="text-rose-400">x{count}</span>
                      ) : null}
                    </span>
                    <span
                      title={`${count} ready bag${count === 1 ? "" : "s"}`}
                      className={`font-mono text-xs font-bold ${
                        expiringSoon > 0 ? "text-amber-600" : "text-emerald-700"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                {org.address ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--teal-700)]" strokeWidth={1.8} />
                    {org.address}
                  </span>
                ) : null}
                {org.expiringSoonUnits > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <Clock3 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    {org.expiringSoonUnits} expiring within 7 days
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  Updated {formatDate(org.lastUpdated)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => openApply(org)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--coral)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Send className="w-4 h-4" strokeWidth={1.8} />
                Apply for Blood
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center max-w-md mx-auto">
          <Droplets className="w-12 h-12 text-rose-300 mx-auto mb-3" strokeWidth={1.5} />
          <h4 className="font-display text-lg text-[var(--teal-900)] mb-1">No Blood Bags Found</h4>
          <p className="text-xs text-[var(--ink-soft)] mb-5">
            No organizations currently have ready blood bags matching your criteria. Try a different
            blood type or check again later.
          </p>
          <button
            type="button"
            onClick={() => {
              setBloodType("");
              setUnits("");
              window.setTimeout(() => runSearch(), 0);
            }}
            className="px-5 py-2 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] text-xs font-semibold shadow-xs cursor-pointer"
          >
            Show All Organizations
          </button>
        </div>
      )}

      {/* Your applications */}
      {requests.length > 0 && (
        <div className="rounded-2xl border border-[var(--sage-200)] bg-white p-5 shadow-xs">
          <h3 className="flex items-center gap-2 font-display text-lg text-[var(--teal-900)]">
            <Heart className="w-5 h-5 text-rose-500" strokeWidth={1.8} />
            Your Blood Applications
          </h3>
          <div className="mt-3 space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--teal-900)]">
                    {BLOOD_TYPE_LABELS[req.bloodType] ?? req.bloodType} &middot; {req.unitsNeeded}{" "}
                    unit{req.unitsNeeded === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {req.organization.name} &middot;{" "}
                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {req.notes ? ` &middot; ${req.notes}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${
                    REQUEST_STATUS_TONE[req.status] ?? ""
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply modal */}
      {applyOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-[var(--sage-200)] max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-[var(--teal-900)]">Apply for Blood</h3>
                  <p className="text-xs text-[var(--ink-soft)] font-body">{applyOrg.organizationName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyOrg(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--sage-200)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.8} />
              </button>
            </div>

            {applyError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4 font-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Blood Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.bloodType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bloodType: e.target.value, unitsNeeded: 1 }))
                    }
                    className={inputCls}
                  >
                    {ALL_BLOOD_TYPES.map((t) => {
                      const entry = applyOrg.bloodTypeCounts.find((c) => c.bloodType === t);
                      return (
                        <option key={t} value={t} disabled={!entry || entry.count === 0}>
                          {BLOOD_TYPE_LABELS[t]}
                          {entry ? ` (${entry.count} available)` : " (none)"}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Units Needed <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, selectedCount)}
                    value={form.unitsNeeded}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unitsNeeded: Number(e.target.value) }))
                    }
                    className={inputCls}
                    required
                  />
                  {selectedCount > 0 && (
                    <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                      {selectedCount} ready bag{selectedCount === 1 ? "" : "s"} of this type
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                    placeholder="Optional"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="+880 17XXXXXXXX"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Cross-matching done, patient admitted to Ward 4."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--sage-200)]/60">
                <button
                  type="button"
                  onClick={() => setApplyOrg(null)}
                  className="px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 text-sm font-semibold shadow-xs disabled:opacity-60 transition-opacity cursor-pointer"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-emerald-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}