"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "@/actions/auth";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("email", email);

    const result = await sendPasswordResetEmail(formData);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      setEmail("");
    } else {
      setMessage({ type: "error", text: result.message || "Something went wrong." });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-[var(--teal-900)]">Reset Password</h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--sage-200)] font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                required
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-body ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--coral)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm font-body text-[var(--teal-900)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.6} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
