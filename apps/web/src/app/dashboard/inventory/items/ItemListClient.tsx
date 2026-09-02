"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Layers,
  ClipboardList,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { InventoryManagementData } from "@/actions/inventory/manage";
import { setInventoryItemMethod } from "@/actions/inventory";
import Link from "next/link";

type Batch = InventoryManagementData["items"][number]["batches"][number];

const METHOD_OPTIONS: Array<{
  value: string;
  label: string;
  description: string;
}> = [
  { value: "FIFO", label: "FIFO", description: "First In, First Out — oldest received batch used first" },
  { value: "LIFO", label: "LIFO", description: "Last In, First Out — newest received batch used first" },
  { value: "FEFO", label: "FEFO", description: "First Expiry, First Out — soonest-expiring batch used first" },
  { value: "AVERAGE", label: "AVERAGE", description: "Pooled stock — no single batch priority" },
];

function sortBatches(batches: Batch[], method: string): Batch[] {
  const active = batches.filter((b) => b.quantity > 0);
  const ts = (value: string | null) => (value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER);
  switch (method) {
    case "LIFO":
      return [...active].sort((a, b) => ts(b.receivedAt) - ts(a.receivedAt));
    case "FEFO":
      return [...active].sort((a, b) => ts(a.expiryDate) - ts(b.expiryDate));
    case "AVERAGE":
      return [...active].sort((a, b) => a.batchNumber.localeCompare(b.batchNumber));
    case "FIFO":
    default:
      return [...active].sort(
        (a, b) => ts(a.receivedAt) - ts(b.receivedAt) || ts(a.expiryDate) - ts(b.expiryDate)
      );
  }
}

const inputCls =
  "w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-white";

export function ItemListClient({
  organizationName,
  manageData,
}: {
  organizationName: string;
  manageData: InventoryManagementData;
}) {
  const router = useRouter();
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleMethodChange = async (itemId: string, stockMethod: string) => {
    setSavingId(itemId);
    try {
      const fd = new FormData();
      fd.append("itemId", itemId);
      fd.append("stockMethod", stockMethod);
      await setInventoryItemMethod(fd);
      router.refresh();
    } catch (err) {
      console.error("Failed to update stock method", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to Dashboard
      </Link>

      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--ink-soft)]">
          <ClipboardList className="h-3.5 w-3.5 text-[var(--teal-700)]" strokeWidth={2} />
          ITEMS · {organizationName.toUpperCase()}
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--teal-900)] md:text-3xl">
          Item List & Consumption Order
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Choose how each item&apos;s batches are consumed — set which batch is sold or used first.
        </p>
      </div>

      {manageData.items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--sage-200)] bg-white p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[var(--ink-soft)]" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            No active items yet. Add your first item on the{" "}
            <Link href="/dashboard/inventory/add-item" className="font-semibold text-[var(--teal-900)] underline">
              Add Items
            </Link>{" "}
            page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {manageData.items.map((item) => {
            const ordered = sortBatches(item.batches, item.stockMethod);
            const nextBatch = ordered[0] ?? null;
            const methodInfo = METHOD_OPTIONS.find((m) => m.value === item.stockMethod) ?? METHOD_OPTIONS[0];
            const expanded = openItemId === item.id;

            return (
              <div key={item.id} className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-[var(--teal-900)]">{item.name}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {item.category.name}
                      {item.unit ? ` · ${item.unit}` : ""}
                      {item.reorderLevel != null ? ` · reorder @ ${item.reorderLevel}` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] px-3 py-1 font-mono text-[var(--ink-soft)]">
                        <Layers className="h-3.5 w-3.5 text-[var(--teal-700)]" strokeWidth={1.8} />
                        {item.totalUnits} {item.unit ?? "units"} · {item.batchCount} batch(es)
                      </span>
                      {nextBatch ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-mono font-semibold text-emerald-700">
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Use next: {nextBatch.batchNumber} ({nextBatch.quantity})
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 font-mono text-rose-600">
                          No stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                      Consumption Method
                    </label>
                    <div className="relative">
                      <select
                        value={item.stockMethod}
                        onChange={(e) => handleMethodChange(item.id, e.target.value)}
                        disabled={savingId === item.id}
                        className={`${inputCls} pr-9 disabled:opacity-60`}
                      >
                        {METHOD_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      {savingId === item.id && (
                        <Save className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-pulse text-[var(--teal-700)]" />
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-4 text-[var(--ink-soft)]">{methodInfo.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenItemId(expanded ? null : item.id)}
                    className="self-end inline-flex items-center gap-1 rounded-full border border-[var(--sage-200)] bg-white px-4 py-2 text-xs font-semibold text-[var(--teal-900)] transition-colors hover:bg-[var(--paper)] cursor-pointer"
                  >
                    {expanded ? <ChevronUp className="h-4 w-4" strokeWidth={1.8} /> : <ChevronDown className="h-4 w-4" strokeWidth={1.8} />}
                    {expanded ? "Hide batches" : "View batches"}
                  </button>
                </div>

                {expanded && (
                  <div className="mt-5 border-t border-[var(--sage-200)] pt-5">
                    {item.batches.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
                        No batches registered for this item yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {item.batches.map((b) => {
                          const rank = ordered.findIndex((o) => o.id === b.id);
                          const isNext = rank === 0;
                          return (
                            <div
                              key={b.id}
                              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${
                                isNext
                                  ? "border-emerald-200 bg-emerald-50/60"
                                  : rank >= 0
                                    ? "border-[var(--sage-200)] bg-[var(--paper)]"
                                    : "border-[var(--sage-200)] bg-white opacity-60"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--teal-900)]">
                                  {b.batchNumber}
                                  {rank >= 0 && (
                                    <span className="ml-2 font-mono text-xs text-[var(--ink-soft)]">
                                      #{rank + 1} in {item.stockMethod}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-[var(--ink-soft)]">
                                  {b.quantity} {item.unit ?? "units"}
                                  {b.expiryDate
                                    ? ` · expires ${new Date(b.expiryDate).toLocaleDateString()}`
                                    : " · no expiry"}
                                  {" · "}received {new Date(b.receivedAt).toLocaleDateString()}
                                </p>
                              </div>
                              {isNext && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-mono font-bold text-white">
                                  <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} />
                                  NEXT TO USE
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}