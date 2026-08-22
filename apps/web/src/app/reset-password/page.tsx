"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Check if session exists (which means user landed via valid recovery link)
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsValidToken(false);
      } else {
        setIsValidToken(true);
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("password", password);

    const result = await resetPassword(formData);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setMessage({ type: "error", text: result.message });
    }

    setLoading(false);
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
        <div className="text-[var(--ink-soft)] font-body">Verifying reset link...</div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[var(--sage-200)] shadow-xl max-w-md w-full p-8 text-center">
          <h1 className="font-display text-2xl text-[var(--teal-900)]">Invalid Reset Link</h1>
          <p className="font-body text-[var(--ink-soft)] mt-2">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block mt-4 px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 font-medium"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-[var(--teal-900)]">Create New Password</h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[var(--sage-200)] font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--teal-900)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.6} /> : <Eye className="w-4 h-4" strokeWidth={1.6} />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
            {loading ? "Resetting..." : "Reset Password"}
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
