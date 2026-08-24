import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function VerifyDonePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[var(--sage-200)] p-8 shadow-sm text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <CheckCircle className="w-7 h-7" strokeWidth={1.8} />
        </div>
        <h1 className="font-display text-2xl text-[var(--teal-900)] font-semibold">
          Verification Submitted
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-2 leading-relaxed">
          Your identity check has been submitted. Status updates shortly via Didit — you can return
          to your profile to see the result.
        </p>
        <Link
          href="/dashboard/profile"
          className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-[var(--coral)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to Profile
        </Link>
      </div>
    </div>
  );
}
