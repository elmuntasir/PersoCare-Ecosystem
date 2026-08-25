"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { verifyPayment } from "@/actions/payment/verifyPayment";
import { XCircle, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const recordFailure = async () => {
      const appointmentId = searchParams.get("appointmentId");
      const tranId = searchParams.get("tranId");

      if (appointmentId && tranId) {
        const fd = new FormData();
        fd.append("appointmentId", appointmentId);
        fd.append("tranId", tranId);
        fd.append("status", "fail");
        try {
          await verifyPayment(fd);
        } catch (e) {
          console.error("Failure recording error:", e);
        }
      }

      if (active) {
        setLoading(false);
      }
    };

    void recordFailure();

    return () => {
      active = false;
    };
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-2" />
        <p className="font-body text-sm text-[var(--ink-soft)]">Processing transaction update...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
          <XCircle className="w-10 h-10" />
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-semibold">
          Payment Failed
        </span>

        <h1 className="font-display text-2xl font-bold text-rose-900">
          Payment Could Not Be Completed
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)]">
          SSLCommerz was unable to process your transaction. No charges were made to your account, or failed amounts will be automatically reversed.
        </p>

        <div className="pt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--coral)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Try Booking Again
          </Link>
          <Link
            href="/dashboard/appointments/my"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[var(--sage-200)] text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--paper)]"
          >
            <ArrowLeft className="w-4 h-4" />
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto mb-2" />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
