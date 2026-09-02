"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Layers,
  Trash2,
} from "lucide-react";
import type { InventoryDashboardData } from "@/lib/inventory";
import { recordInventoryMovement, updateInventoryAlert } from "@/actions/inventory";
import { getInventoryManagementData } from "@/actions/inventory/manage";
import Link from "next/link";

function Flip({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border p-4 text-sm font-body ${
        tone === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {tone === "ok" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
      )}
      <span>{children}</span>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
        {label}
      </label>
      {children}
    </div>
  );
}

type Props = {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  data: InventoryDashboardData;
};

export function TrackItemsClient({
  organizationId,
  organizationName,
  data,
}: Props) {
  const router = useRouter();
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [batches, setBatches] = useState<
    Array<{ id: string; batchNumber: string; quantity: number; item: { name: string; unit: string | null } }>
  >([]);

  // Fetch batches lazily when user expands the movement form
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [batchesLoaded, setBatchesLoaded] = useState(false);

  const loadBatches = async () => {
    if (batchesLoaded) return;
    try {
      const d = await getInventoryManagementData(organizationId);
      setBatches(d.batches.map((b) => ({ id: b.id, batchNumber: b.batchNumber, quantity: b.quantity, item: b.item })));
      setBatchesLoaded(true);
    } catch (err) {
      setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Failed to load batches" });
    }
  };

  const [movementForm, setMovementForm] = useState({
    batchId: "",
    quantity: "",
    direction: "in",
    type: "PURCHASE",
    notes: "",
  });

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    try {
      const abs = Number(movementForm.quantity);
      if (!abs || abs <= 0) throw new Error("Enter a positive quantity");
      const signed = movementForm.direction === "in" ? abs : -abs;
      const fd = new FormData();
      fd.append("batchId", movementForm.batchId || batches[0]?.id || "");
      fd.append("quantity", String(signed));
      fd.append("type", movementForm.type);
      if (movementForm.notes) fd.append("notes", movementForm.notes);
      await recordInventoryMovement(fd);
      setFlash({ tone: "ok", msg: "Stock movement recorded" });
      setMovementForm((f) => ({ ...f, quantity: "", notes: "" }));
      router.refresh();
    } catch (err) {
      setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  };

  const handleAlert = async (alertId: string, status: string) => {
    setBusy(true);
    setFlash(null);
    try {
      const fd = new FormData();
      fd.append("alertId", alertId);
      fd.append("status", status);
      await updateInventoryAlert(fd);
      setFlash({ tone: "ok", msg: `Alert ${status.toLowerCase()}` });
      router.refresh();
    } catch (err) {
      setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Back link */}
      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--ink-soft)]">
          <ArrowDownUp className="h-3.5 w-3.5 text-[var(--teal-700)]" strokeWidth={2} />
          TRACK ITEMS · {organizationName.toUpperCase()}
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--teal-900)] md:text-3xl">
          Movements & Alerts
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          View recent stock movements and manage low-stock alerts.
        </p>
      </div>

      {flash && <Flip tone={flash.tone}>{flash.msg}</Flip>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {/* ── Record Movement ───────────────────────────────── */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
                <Layers className="h-5 w-5 text-indigo-600" strokeWidth={1.8} />
                Record Movement
              </h2>
              {!showMovementForm && (
                <button
                  type="button"
                  onClick={async () => {
                    await loadBatches();
                    setShowMovementForm(true);
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  New Movement
                </button>
              )}
            </div>

            {!showMovementForm ? (
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                Click &quot;New Movement&quot; above to record incoming or outgoing stock.
              </p>
            ) : batches.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
                No batches found. Add stock batches first from the{" "}
                <Link href="/dashboard/inventory/add-item" className="font-semibold text-[var(--teal-900)] underline">
                  Add Items page
                </Link>.
              </p>
            ) : (
              <form onSubmit={handleMovementSubmit} className="mt-5 space-y-4">
                <Field label="Batch">
                  <select
                    required
                    value={movementForm.batchId || batches[0]?.id}
                    onChange={(e) => setMovementForm((f) => ({ ...f, batchId: e.target.value }))}
                    className={inputCls}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.item.name} · {b.batchNumber} ({b.quantity})
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Direction">
                    <select
                      value={movementForm.direction}
                      onChange={(e) => {
                        const direction = e.target.value;
                        setMovementForm((f) => ({
                          ...f,
                          direction,
                          type: direction === "in" ? "PURCHASE" : "WASTAGE",
                        }));
                      }}
                      className={inputCls}
                    >
                      <option value="in">Incoming (add stock)</option>
                      <option value="out">Outgoing (remove stock)</option>
                    </select>
                  </Field>
                  <Field label="Quantity">
                    <input
                      required
                      type="number"
                      min="1"
                      value={movementForm.quantity}
                      onChange={(e) => setMovementForm((f) => ({ ...f, quantity: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Type">
                  <select
                    value={movementForm.type}
                    onChange={(e) => setMovementForm((f) => ({ ...f, type: e.target.value }))}
                    className={inputCls}
                  >
                    {movementForm.direction === "in" ? (
                      <>
                        <option value="PURCHASE">Purchase</option>
                        <option value="DONATION">Donation</option>
                        <option value="ADJUSTMENT">Adjustment (+)</option>
                      </>
                    ) : (
                      <>
                        <option value="WASTAGE">Wastage / Expiry</option>
                        <option value="DISPENSE">Dispense</option>
                        <option value="ADJUSTMENT">Adjustment (−)</option>
                      </>
                    )}
                  </select>
                </Field>
                <Field label="Notes">
                  <input
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm((f) => ({ ...f, notes: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Saving..." : "Record Movement"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMovementForm(false)}
                    className="rounded-full border border-[var(--sage-200)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--teal-900)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────── */}
        <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
            <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={1.8} />
            Active Alerts ({data.activeAlerts.length})
          </h2>
          {data.activeAlerts.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--ink-soft)]">
              No active alerts. Stock levels are healthy.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {data.activeAlerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--teal-900)]">{alert.itemName}</p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {alert.category}
                        {alert.departmentName ? ` · ${alert.departmentName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-mono text-amber-700">
                        {alert.currentQuantity} / {alert.threshold}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAlert(alert.id, "RESOLVED")}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlert(alert.id, "DISMISSED")}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-[var(--sage-200)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                        title="Dismiss"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[var(--ink-soft)]">
                    Triggered {new Date(alert.triggeredAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Movements ────────────────────────────────── */}
      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
          <ArrowDownUp className="h-5 w-5 text-[var(--teal-700)]" strokeWidth={1.8} />
          Recent Movements
        </h2>
        {data.recentMovements.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--ink-soft)]">
            No movements recorded yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {data.recentMovements.map((m) => (
              <div key={m.id} className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--teal-900)]">{m.itemName}</p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {m.category} · {m.batchNumber}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${
                      m.quantity >= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {m.type}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                  <span>Quantity: {m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span>
                  <span>{new Date(m.performedAt).toLocaleString()}</span>
                </div>
                {m.notes ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{m.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}