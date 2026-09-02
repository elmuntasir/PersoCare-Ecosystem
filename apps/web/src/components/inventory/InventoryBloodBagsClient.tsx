"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet, Plus, RefreshCw, TestTube, BadgeCheck, Syringe, CircleOff, CheckCircle2, XCircle, FlaskConical, Inbox } from "lucide-react";
import {
  createBloodDonationUnit,
  getOrganizationBloodUnits,
  updateBloodDonationUnitStatus,
} from "@/actions/inventory/blood-bags";
import {
  getOrganizationBloodBagRequests,
  respondToBloodBagRequest,
} from "@/actions/blood/bag-requests";

type BloodData = Awaited<ReturnType<typeof getOrganizationBloodUnits>>;
type BloodRequest = Awaited<ReturnType<typeof getOrganizationBloodBagRequests>>[number];

const BLOOD_TYPE_LABELS: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A−",
  B_POS: "B+",
  B_NEG: "B−",
  AB_POS: "AB+",
  AB_NEG: "AB−",
  O_POS: "O+",
  O_NEG: "O−",
};

const STATUS_ORDER: Array<{ key: string; label: string }> = [
  { key: "COLLECTED", label: "Collected" },
  { key: "TESTED", label: "Tested" },
  { key: "READY", label: "Ready" },
  { key: "DISPENSED", label: "Dispensed" },
  { key: "WASTED", label: "Wasted" },
];

const STATUS_TONE: Record<string, string> = {
  COLLECTED: "bg-sky-50 text-sky-700 border-sky-200",
  TESTED: "bg-violet-50 text-violet-700 border-violet-200",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISPENSED: "bg-slate-100 text-slate-600 border-slate-200",
  WASTED: "bg-rose-50 text-rose-700 border-rose-200",
};

function Flip({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border p-4 text-sm font-body ${
        tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {tone === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
      <span>{children}</span>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">{label}</label>
      {children}
    </div>
  );
}

export function InventoryBloodBagsClient({
  organizationId,
  organizationName,
  organizationType,
  data: initialData,
  requests: initialRequests,
}: {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  data: BloodData;
  requests: BloodRequest[];
}) {
  const router = useRouter();
  const [data, setData] = useState<BloodData>(initialData);
  const [requests, setRequests] = useState<BloodRequest[]>(initialRequests);
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    donorProfileId: initialData.donors[0]?.id ?? "",
    bloodType: "O_POS",
    volume: "450",
    batchId: "",
    expiryDate: "",
    collectionDate: "",
    notes: "",
  });

  const refresh = async () => {
    router.refresh();
    try {
      const [unitsData, reqData] = await Promise.all([
        getOrganizationBloodUnits(organizationId),
        getOrganizationBloodBagRequests(organizationId),
      ]);
      setData(unitsData);
      setRequests(reqData);
    } catch {
      // ignore optimistic refresh failure, server state is authoritative
    }
  };

  const handleRespond = async (requestId: string, action: "APPROVED" | "DECLINED") => {
    setBusy(true);
    setFlash(null);
    try {
      const fd = new FormData();
      fd.append("requestId", requestId);
      fd.append("action", action);
      await respondToBloodBagRequest(fd);
      setFlash({
        tone: "ok",
        msg: action === "APPROVED" ? "Application approved" : "Application declined",
      });
      await refresh();
    } catch (err) {
      setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Failed to update request" });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    try {
      const fd = new FormData();
      fd.append("organizationId", organizationId);
      fd.append("donorProfileId", form.donorProfileId);
      fd.append("bloodType", form.bloodType);
      fd.append("volume", form.volume);
      fd.append("expiryDate", form.expiryDate);
      if (form.batchId) fd.append("batchId", form.batchId);
      if (form.collectionDate) fd.append("collectionDate", form.collectionDate);
      if (form.notes) fd.append("notes", form.notes);
      await createBloodDonationUnit(fd);
      setFlash({ tone: "ok", msg: "Blood unit logged as COLLECTED" });
      setShowForm(false);
      setForm((f) => ({ ...f, volume: "450", notes: "" }));
      await refresh();
    } catch (err) {
      setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Failed to create unit" });
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (unitId: string, status: string) => {
    setBusy(true);
    setFlash(null);
    try {
      const fd = new FormData();
      fd.append("unitId", unitId);
      fd.append("status", status);
      await updateBloodDonationUnitStatus(fd);
      setFlash({ tone: "ok", msg: `Marked ${BLOOD_TYPE_LABELS[data.units.find((u) => u.id === unitId)?.bloodType ?? ""] ?? ""} bag as ${STATUS_ORDER.find((s) => s.key === status)?.label.toLowerCase()}` });
      await refresh();
    } catch (err) {
      setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Failed to update status" });
    } finally {
      setBusy(false);
    }
  };

  const nextStatus = (current: string): string | null => {
    if (current === "READY") return "DISPENSED";
    if (current === "COLLECTED") return "TESTED";
    if (current === "TESTED") return "READY";
    return null;
  };

  const counts: Record<string, number> = {};
  for (const u of data.units) counts[u.bloodType] = (counts[u.bloodType] ?? 0) + 1;

  const readyCount = data.units.filter((u) => u.status === "READY").length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-[var(--coral)]/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--coral)]">
              <Droplet className="h-3.5 w-3.5" strokeWidth={2} />
              BLOOD BANK · {organizationName.toUpperCase()}
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--teal-900)] md:text-3xl">Blood Bags</h1>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Track every unit from collection, through testing, to transfusion for {organizationType.toLowerCase()} patients.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-white px-4 py-2 text-xs font-semibold text-[var(--teal-900)] transition-colors hover:bg-[var(--paper)] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} strokeWidth={1.8} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--coral)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Log Blood Bag
            </button>
          </div>
        </div>

        {/* Blood type grid */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {Object.entries(BLOOD_TYPE_LABELS).map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-3 text-center">
              <p className="font-display text-lg font-semibold text-[var(--teal-900)]">{label}</p>
              <p className="font-mono text-xs text-[var(--ink-soft)]">{counts[key] ?? 0}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          <span className="font-semibold text-emerald-700">{readyCount}</span> unit{readyCount === 1 ? "" : "s"} currently READY for transfusion.
        </p>
      </div>

      {flash && <Flip tone={flash.tone}>{flash.msg}</Flip>}

      {/* Incoming blood applications */}
      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
            <Inbox className="h-5 w-5 text-[var(--coral)]" strokeWidth={1.8} />
            Blood Applications
            <span className="rounded-full bg-[var(--coral)]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--coral)]">
              {requests.filter((r) => r.status === "PENDING").length} pending
            </span>
          </h2>
        </div>

        {requests.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--ink-soft)]">
            No applications yet. Patients apply here after finding this org in their &quot;Hospitals
            with Blood&quot; search.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--coral)]/10 text-[var(--coral)]">
                      <Droplet className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--teal-900)]">
                        {BLOOD_TYPE_LABELS[req.bloodType] ?? req.bloodType} &middot; {req.unitsNeeded}{" "}
                        unit{req.unitsNeeded === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {req.requester.name}
                        {req.requester.phone ? ` · ${req.requester.phone}` : ""}
                        {req.patientName ? ` · for ${req.patientName}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        #{req.id.slice(0, 8)} &middot; Requested{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {req.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "APPROVED")}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "DECLINED")}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Decline
                        </button>
                      </>
                    ) : (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-[0.12em] ${
                          req.status === "APPROVED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
                {req.contactPhone || req.notes ? (
                  <p className="mt-3 text-xs text-[var(--ink-soft)]">
                    {req.contactPhone ? `Contact: ${req.contactPhone}` : ""}
                    {req.contactPhone && req.notes ? " · " : ""}
                    {req.notes ? req.notes : ""}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
            <Plus className="h-5 w-5 text-[var(--coral)]" strokeWidth={1.8} />
            Log a Collected Blood Bag
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Donor">
              <select
                required
                value={form.donorProfileId}
                onChange={(e) => setForm((f) => ({ ...f, donorProfileId: e.target.value }))}
                className={inputCls}
              >
                {data.donors.length === 0 && <option value="">No verified donors yet</option>}
                {data.donors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user.name} · {BLOOD_TYPE_LABELS[d.bloodType] ?? ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Blood Type">
              <select
                required
                value={form.bloodType}
                onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))}
                className={inputCls}
              >
                {Object.entries(BLOOD_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Volume (ml)">
              <input
                type="number"
                min="1"
                value={form.volume}
                onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Expiry Date">
              <input
                required
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Collection Date">
              <input
                type="date"
                value={form.collectionDate}
                onChange={(e) => setForm((f) => ({ ...f, collectionDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Link to Stock Batch">
              <select
                value={form.batchId}
                onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                className={inputCls}
              >
                <option value="">None (direct tracking)</option>
                {data.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.item.name} · {b.batchNumber}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy || data.donors.length === 0}
                className="w-full rounded-full bg-[var(--coral)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Saving..." : "Log Bag"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Units list */}
      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
          <FlaskConical className="h-5 w-5 text-[var(--teal-700)]" strokeWidth={1.8} />
          Units ({data.units.length})
        </h2>

        {data.units.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--ink-soft)]">
            No blood bags logged yet. Patients search this org by the bags you mark READY.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {data.units.map((unit) => {
              const available = unit.status === "READY";
              const expiringSoon = unit.expiringSoon;
              const next = nextStatus(unit.status);
              return (
                <div key={unit.id} className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--coral)]/10 text-[var(--coral)]">
                        <Droplet className="h-5 w-5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--teal-900)]">
                          {BLOOD_TYPE_LABELS[unit.bloodType]} · {unit.volume} ml
                        </p>
                        <p className="text-xs text-[var(--ink-soft)]">
                          #{unit.id.slice(0, 8)}
                          {unit.batch ? ` · ${unit.batch.item.name} ${unit.batch.batchNumber}` : ""}
                        </p>
                        <p className="text-xs text-[var(--ink-soft)]">
                          Donor: {unit.donorProfile.user.name}
                          {unit.donorProfile.user.phone ? ` · ${unit.donorProfile.user.phone}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-[0.12em] ${STATUS_TONE[unit.status]}`}>
                        {unit.status}
                      </span>
                      {available && (
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.12em] ${expiringSoon ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                          {expiringSoon ? "Expiring soon" : "Searchable"}
                        </span>
                      )}
                      {next && (
                        <button
                          type="button"
                          onClick={() => handleStatus(unit.id, next)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--teal-900)] px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          {next === "TESTED" ? <TestTube className="h-3.5 w-3.5" strokeWidth={2} /> : next === "READY" ? <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} /> : <Syringe className="h-3.5 w-3.5" strokeWidth={2} />}
                          Mark {next === "DISPENSED" ? "Dispensed" : next.charAt(0) + next.slice(1).toLowerCase()}
                        </button>
                      )}
                      {(unit.status === "COLLECTED" || unit.status === "TESTED" || unit.status === "READY") && (
                        <button
                          type="button"
                          onClick={() => handleStatus(unit.id, "WASTED")}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                          title="Mark as wasted"
                        >
                          <CircleOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Wasted
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                    <span>Collected: {new Date(unit.collectionDate).toLocaleDateString()}</span>
                    <span className={available && expiringSoon ? "font-semibold text-amber-700" : ""}>
                      Expires: {new Date(unit.expiryDate).toLocaleDateString()}
                    </span>
                    {unit.notes ? <span>{unit.notes}</span> : null}
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