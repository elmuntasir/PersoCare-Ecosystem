"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPayment } from "@/actions/payment/verifyPayment";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Calendar, User, Building2 } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    appointmentId?: string;
    serialNumber?: number | null;
    doctorName?: string;
    organizationName?: string;
    paymentAmount?: number | null;
    consultationFee?: number | null;
    bookedSlotTime?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const appointmentId = searchParams.get("appointmentId");
      const tranId = searchParams.get("tranId");

      if (!appointmentId || !tranId) {
        setError("Missing payment transaction parameters in redirect URL.");
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("appointmentId", appointmentId);
      fd.append("tranId", tranId);
      fd.append("status", "success");

      try {
        const result = await verifyPayment(fd);
        if (!active) return;

        if (result.success) {
          setPaymentData({
            appointmentId: result.appointmentId,
            serialNumber: result.serialNumber,
            doctorName: result.doctorName,
            organizationName: result.organizationName,
            paymentAmount: result.paymentAmount,
            consultationFee: result.consultationFee,
            bookedSlotTime: result.bookedSlotTime,
          });
        } else {
          setError(result.reason || "Payment could not be verified.");
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Payment verification failed.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void verify();

    return () => {
      active = false;
    };
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 text-[var(--teal-900)] animate-spin" />
        </div>
        <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">Verifying Payment...</h2>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
          Please wait while we confirm your transaction and assign your queue serial.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-rose-700">Verification Issue</h2>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-2 max-w-md">{error}</p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/dashboard/appointments/my"
            className="px-5 py-2.5 rounded-full bg-[var(--teal-900)] text-white text-xs font-semibold hover:bg-[var(--teal-800)]"
          >
            Check My Appointments
          </Link>
          <Link
            href="/dashboard/appointments"
            className="px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper)]"
          >
            Find Doctor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[var(--sage-200)] p-8 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-semibold">
          Payment Successful
        </span>

        <h1 className="font-display text-3xl font-bold text-[var(--teal-900)] mt-3">
          Appointment Confirmed!
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mt-2">
          Your booking has been registered and verified on the PersoCare network.
        </p>

        {paymentData && (
          <div className="mt-6 text-left rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-5 space-y-3">
            {paymentData.serialNumber && (
              <div className="flex items-center justify-between border-b border-[var(--sage-200)]/70 pb-2">
                <span className="font-mono text-xs uppercase text-[var(--ink-soft)]">Queue Serial</span>
                <span className="font-mono text-xl font-bold text-[var(--coral)]">
                  #{paymentData.serialNumber}
                </span>
              </div>
            )}

            {paymentData.doctorName && (
              <div className="flex items-center gap-2 text-sm text-[var(--ink)]">
                <User className="w-4 h-4 text-[var(--teal-700)] shrink-0" />
                <span className="font-semibold">Dr. {paymentData.doctorName}</span>
              </div>
            )}

            {paymentData.organizationName && (
              <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <Building2 className="w-4 h-4 text-[var(--teal-700)] shrink-0" />
                <span>{paymentData.organizationName}</span>
              </div>
            )}

            {paymentData.bookedSlotTime && (
              <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                <Calendar className="w-4 h-4 text-[var(--coral)] shrink-0" />
                <span>{new Date(paymentData.bookedSlotTime).toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-[var(--sage-200)]/70 pt-2 space-y-1 text-xs">
              <div className="flex items-center justify-between text-[var(--ink-soft)]">
                <span>Platform Booking Fee Paid:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {paymentData.paymentAmount || 10} BDT
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--ink-soft)]">
                <span>Doctor Consultation Fee:</span>
                <span className="font-mono font-semibold text-[var(--ink)]">
                  {paymentData.consultationFee && paymentData.consultationFee > 0
                    ? `${paymentData.consultationFee} BDT (to pay at clinic)`
                    : "Paid directly at clinic"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/appointments/my"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--teal-900)] text-white text-xs font-semibold hover:bg-[var(--teal-800)] transition-colors shadow-xs"
          >
            View My Appointments
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-[var(--sage-200)] text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors"
          >
            Find Another Doctor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-[var(--teal-900)] animate-spin mx-auto mb-2" />
          <p className="text-sm font-mono text-[var(--ink-soft)]">Loading confirmation...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
