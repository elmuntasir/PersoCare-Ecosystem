"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  History,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import type { MovementHistoryData } from "@/actions/inventory/manage";
import Link from "next/link";

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  DONATION: "Donation",
  DISPENSE: "Dispense",
  WASTAGE: "Wastage",
  ADJUSTMENT: "Adjustment",
};

const MOVEMENT_TONE: Record<string, string> = {
  PURCHASE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DONATION: "bg-sky-50 text-sky-700 border-sky-200",
  DISPENSE: "bg-violet-50 text-violet-700 border-violet-200",
  WASTAGE: "bg-rose-50 text-rose-700 border-rose-200",
  ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200",
};

export function TrackHistoryClient({
  organizationName,
  history,
}: {
  organizationName: string;
  history: MovementHistoryData;
}) {
  const [itemId, setItemId] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(() => {
    return history.items.filter(
      (m) => (!itemId || m.itemId === itemId) && (!type || m.type === type)
    );
  }, [history.items, itemId, type]);

  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/dashboard/inventory/track"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to Track Items
      </Link>

      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--ink-soft)]">
          <History className="h-3.5 w-3.5 text-[var(--teal-700)]" strokeWidth={2} />
          TRACK HISTORY · {organizationName.toUpperCase()}
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold text-[var(--teal-900)] md:text-3xl">
          Stock Movement History
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Complete audit trail of every batch movement in and out of stock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--sage-200)] bg-white p-4 shadow-xs">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Movements</p>
          <p className="mt-1 font-display text-2xl font-semibold text-[var(--teal-900)]">{history.items.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
          <p className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> Incoming
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-700">+{history.totals.incoming}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-xs">
          <p className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-rose-700">
            <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} /> Outgoing
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-rose-700">-{history.totals.outgoing}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--sage-200)] bg-white p-4 shadow-xs flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)] mr-1 self-center">
          <Filter className="w-4 h-4 text-[var(--teal-700)]" strokeWidth={1.8} />
          <span>FILTER:</span>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-1">
            Item
          </label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
          >
            <option value="">All items</option>
            {history.itemOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
          >
            <option value="">All types</option>
            {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {(itemId || type) && (
          <button
            type="button"
            onClick={() => {
              setItemId("");
              setType("");
            }}
            className="text-xs text-[var(--coral)] font-semibold hover:underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-xl text-[var(--teal-900)]">
          <ArrowDownUp className="h-5 w-5 text-[var(--teal-700)]" strokeWidth={1.8} />
          Movements ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--ink-soft)]">
            No movements match the current filters.
          </p>
        ) : (
          <div className="mt-5 space-y-2">
            {filtered.map((m) => {
              const incoming = m.quantity >= 0;
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        incoming ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {incoming ? (
                        <ArrowDownRight className="h-5 w-5" strokeWidth={1.8} />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.8} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--teal-900)]">
                        {m.itemName} · {m.batchNumber}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {m.category}
                        {m.performedByName ? ` · by ${m.performedByName}` : ""}
                        {" · "}
                        {new Date(m.performedAt).toLocaleString()}
                      </p>
                      {m.notes ? <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">{m.notes}</p> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${MOVEMENT_TONE[m.type] ?? ""}`}>
                      {MOVEMENT_LABELS[m.type] ?? m.type}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        incoming ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {incoming ? `+${m.quantity}` : m.quantity}
                    </span>
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