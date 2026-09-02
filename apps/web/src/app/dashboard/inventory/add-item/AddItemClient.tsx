"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import type { InventoryManagementData } from "@/actions/inventory/manage";
import {
  upsertInventoryItem,
  upsertInventoryBatch,
} from "@/actions/inventory";
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
  manageData: InventoryManagementData;
};

export function AddItemClient({
  organizationId,
  organizationName,
  manageData,
}: Props) {
  const router = useRouter();
  const [flash, setFlash] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // ── Item form ─────────────────────────────────────────────
  const [itemForm, setItemForm] = useState({
    name: "",
    categoryId: manageData.categories[0]?.id ?? "",
    unit: "",
    reorderLevel: "",
    description: "",
  });

  // ── Batch form ────────────────────────────────────────────
  const [batchForm, setBatchForm] = useState({
    itemId: manageData.items[0]?.id ?? "",
    batchNumber: "",
    quantity: "",
    inboundType: "PURCHASE",
    expiryDate: "",
    departmentId: "",
    notes: "",
  });

  const showError = (err: unknown) =>
    setFlash({ tone: "err", msg: err instanceof Error ? err.message : "Something went wrong" });

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    try {
      const fd = new FormData();
      fd.append("name", itemForm.name);
      fd.append("categoryId", itemForm.categoryId);
      fd.append("unit", itemForm.unit);
      if (itemForm.reorderLevel) fd.append("reorderLevel", itemForm.reorderLevel);
      if (itemForm.description) fd.append("description", itemForm.description);
      await upsertInventoryItem(fd);
      setFlash({ tone: "ok", msg: "Item added to inventory" });
      setItemForm((f) => ({ ...f, name: "", unit: "", reorderLevel: "", description: "" }));
      router.refresh();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFlash(null);
    try {
      const fd = new FormData();
      fd.append("itemId", batchForm.itemId);
      fd.append("organizationId", organizationId);
      fd.append("batchNumber", batchForm.batchNumber);
      fd.append("quantity", batchForm.quantity);
      fd.append("inboundType", batchForm.inboundType);
      if (batchForm.expiryDate) fd.append("expiryDate", batchForm.expiryDate);
      if (batchForm.departmentId) fd.append("departmentId", batchForm.departmentId);
      if (batchForm.notes) fd.append("notes", batchForm.notes);
      await upsertInventoryBatch(fd);
      setFlash({ tone: "ok", msg: `Batch ${batchForm.batchNumber} created` });
      setBatchForm((f) => ({ ...f, batchNumber: "", quantity: "", expiryDate: "", notes: "" }));
      router.refresh();
    } catch (err) {
      showError(err);
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
          <Package className="h-3.5 w-3.5 text-[var(--teal-700)]" strokeWidth={2} />
          ADD ITEMS · {organizationName.toUpperCase()}
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--teal-900)] md:text-3xl">
          Add Items & Stock
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Create new tracked item definitions and register inbound stock batches.
        </p>
      </div>

      {flash && <Flip tone={flash.tone}>{flash.msg}</Flip>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* ── Create Item ───────────────────────────────────── */}
        <form onSubmit={handleItemSubmit} className="h-fit rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
            <Plus className="h-5 w-5 text-[var(--teal-700)]" strokeWidth={1.8} />
            Add Item
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Define a new tracked item definition.</p>
          <div className="mt-5 space-y-4">
            <Field label="Item Name">
              <input
                required
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
                placeholder="e.g. Paracetamol 500mg, Blood Bag A+"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className={inputCls}
                >
                  {manageData.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit">
                <input
                  value={itemForm.unit}
                  onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. tab, ml, bag"
                />
              </Field>
            </div>
            <Field label="Reorder Level (alert threshold)">
              <input
                type="number"
                min="0"
                value={itemForm.reorderLevel}
                onChange={(e) => setItemForm((f) => ({ ...f, reorderLevel: e.target.value }))}
                className={inputCls}
                placeholder="e.g. 20"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputCls} min-h-20 resize-y`}
              />
            </Field>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[var(--teal-900)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Saving..." : "Add Item"}
            </button>
          </div>
        </form>

        {/* ── Create Batch ──────────────────────────────────── */}
        <form onSubmit={handleBatchSubmit} className="h-fit rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
            <Layers className="h-5 w-5 text-[var(--coral)]" strokeWidth={1.8} />
            Add Stock / Batch
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Register a new inbound batch for an existing item.</p>
          {manageData.items.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
              Add an item first, then come back to create a batch for it.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <Field label="Item">
                <select
                  required
                  value={batchForm.itemId}
                  onChange={(e) => setBatchForm((f) => ({ ...f, itemId: e.target.value }))}
                  className={inputCls}
                >
                  {manageData.items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Batch Number">
                  <input
                    required
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm((f) => ({ ...f, batchNumber: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. B-2024002"
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    required
                    type="number"
                    min="1"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm((f) => ({ ...f, quantity: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Origin">
                  <select
                    value={batchForm.inboundType}
                    onChange={(e) => setBatchForm((f) => ({ ...f, inboundType: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="PURCHASE">Purchase</option>
                    <option value="DONATION">Donation</option>
                  </select>
                </Field>
                <Field label="Expiry Date">
                  <input
                    type="date"
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Department">
                <select
                  value={batchForm.departmentId}
                  onChange={(e) => setBatchForm((f) => ({ ...f, departmentId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Main store</option>
                  {manageData.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes">
                <input
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-[var(--coral)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Saving..." : "Create Batch"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}