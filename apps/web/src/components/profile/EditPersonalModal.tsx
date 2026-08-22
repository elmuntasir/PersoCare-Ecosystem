"use client";

import { useState } from "react";
import { updatePersonalInfo } from "@/actions/profile/updatePersonal";
import { X } from "lucide-react";

interface EditPersonalModalProps {
  data: {
    name: string;
    phone: string | null;
    dob: string | null;
    gender: string | null;
    username: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function EditPersonalModal({ data, onClose, onSaved }: EditPersonalModalProps) {
  const [name, setName] = useState(data.name || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [dob, setDob] = useState(data.dob ? data.dob.split("T")[0] : "");
  const [gender, setGender] = useState(data.gender || "");
  const [username, setUsername] = useState(data.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("username", username);

      await updatePersonalInfo(formData);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update personal information";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[var(--sage-200)] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
            Edit Personal Information
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/40 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              required
            />
          </div>

          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1700 000000"
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            />
          </div>

          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            />
          </div>

          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rafin01"
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 font-body font-medium">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--sage-200)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-full bg-[var(--coral)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
