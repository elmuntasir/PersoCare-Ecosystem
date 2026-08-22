"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendAnnouncement } from "@/actions/platform-admin/announcements";
import { Send, CheckCircle2, AlertCircle, Megaphone, Sparkles } from "lucide-react";

export function AnnouncementsClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setResult({ type: "error", text: "Title and message are required." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("message", message);
      fd.append("targetRoles", JSON.stringify(targetRoles));

      const res = await sendAnnouncement(fd);
      setResult({ type: "success", text: `Successfully broadcasted notification to ${res.sentCount} users!` });
      setTitle("");
      setMessage("");
      router.refresh();
    } catch (err: any) {
      setResult({ type: "error", text: err.message || "Failed to send announcement" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--coral)]/10 text-[var(--coral)] flex items-center justify-center">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--teal-900)]">
            Broadcast Notification
          </h2>
          <p className="font-body text-xs text-[var(--ink-soft)]">
            Dispatched directly to user notifications with instant in-app delivery.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase font-mono tracking-wider">
            Announcement Title *
          </label>
          <input
            type="text"
            placeholder="e.g., Scheduled Platform Maintenance or System Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--teal-900)]"
            required
          />
        </div>

        <div>
          <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase font-mono tracking-wider">
            Broadcast Message *
          </label>
          <textarea
            rows={4}
            placeholder="Write the announcement message details here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--teal-900)] resize-none"
            required
          />
        </div>

        <div>
          <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-2 uppercase font-mono tracking-wider">
            Recipient Target Roles
          </label>
          <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-[var(--paper)]/60 border border-[var(--sage-200)]">
            {[
              { id: "patient", label: "Patients / General Users" },
              { id: "doctor", label: "Doctors & Specialists" },
              { id: "admin", label: "Organization Admins" },
            ].map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-xs font-body text-[var(--ink)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={targetRoles.includes(role.id)}
                  onChange={() =>
                    setTargetRoles((prev) =>
                      prev.includes(role.id)
                        ? prev.filter((r) => r !== role.id)
                        : [...prev, role.id]
                    )
                  }
                  className="rounded text-[var(--teal-900)] focus:ring-[var(--teal-900)]"
                />
                <span>{role.label}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] font-mono text-[var(--ink-soft)] mt-1.5">
            Leave all checkboxes unchecked to broadcast to <strong>ALL users</strong> across the platform.
          </p>
        </div>

        {result && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-body ${
              result.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{result.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 font-body text-sm font-semibold flex items-center gap-2 shadow-xs transition-opacity disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? "Broadcasting..." : "Send Announcement"}</span>
        </button>
      </form>
    </div>
  );
}
