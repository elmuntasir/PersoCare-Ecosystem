"use client";

export function PrintBookingButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-[var(--teal-900)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--teal-700)]"
    >
      Print / Save PDF
    </button>
  );
}
