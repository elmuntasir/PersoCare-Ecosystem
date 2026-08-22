"use client";

import { useState } from "react";
import { X, Mail, AlertCircle, Loader2 } from "lucide-react";

interface InviteAdminModalProps {
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  loading: boolean;
  error?: string | null;
}

export function InviteAdminModal({
  onClose,
  onSubmit,
  loading,
  error,
}: InviteAdminModalProps) {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !email.includes("@")) {
      setLocalError("Please enter a valid email address");
      return;
    }

    try {
      await onSubmit(email.trim().toLowerCase());
    } catch {
      // Handled by parent
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--sage-200)] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-[var(--teal-900)]">
              <Mail className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
                Invite Administrator
              </h3>
              <p className="text-xs text-[var(--ink-soft)] font-mono">Co-Admin Onboarding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-soft)] hover:text-[var(--ink)] p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-body text-xs text-[var(--ink-soft)] leading-relaxed">
            Invite another user to co-administer this organization. They will receive an invitation in their organization dashboard.
          </p>

          <div>
            <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
              User Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. coadmin@persocare.com"
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
              required
            />
          </div>

          {(localError || error) && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--coral)] text-white text-sm font-medium hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
