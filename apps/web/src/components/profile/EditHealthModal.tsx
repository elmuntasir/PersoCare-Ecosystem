"use client";

import { useState } from "react";
import { updateHealthInfo } from "@/actions/profile/updateHealth";
import { X, Plus, Trash2 } from "lucide-react";

interface EditHealthModalProps {
  data: {
    bloodType: string | null;
    allergies: string[];
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    smokingStatus: string | null;
    alcoholConsumption: string | null;
    dietaryRestrictions: string[];
    languagePreference: string | null;
    requiresGuardianConsent: boolean;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function EditHealthModal({ data, onClose, onSaved }: EditHealthModalProps) {
  const [bloodType, setBloodType] = useState(data.bloodType || "");
  const [allergies, setAllergies] = useState<string[]>(data.allergies || []);
  const [newAllergy, setNewAllergy] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState(data.emergencyContactName || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(data.emergencyContactPhone || "");
  const [insuranceProvider, setInsuranceProvider] = useState(data.insuranceProvider || "");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(data.insurancePolicyNumber || "");
  const [smokingStatus, setSmokingStatus] = useState(data.smokingStatus || "");
  const [alcoholConsumption, setAlcoholConsumption] = useState(data.alcoholConsumption || "");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(data.dietaryRestrictions || []);
  const [newRestriction, setNewRestriction] = useState("");
  const [languagePreference, setLanguagePreference] = useState(data.languagePreference || "");
  const [requiresGuardianConsent, setRequiresGuardianConsent] = useState(data.requiresGuardianConsent || false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addRestriction = () => {
    if (newRestriction.trim() && !dietaryRestrictions.includes(newRestriction.trim())) {
      setDietaryRestrictions([...dietaryRestrictions, newRestriction.trim()]);
      setNewRestriction("");
    }
  };

  const removeRestriction = (index: number) => {
    setDietaryRestrictions(dietaryRestrictions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bloodType", bloodType);
      allergies.forEach((a) => formData.append("allergies", a));
      formData.append("emergencyContactName", emergencyContactName);
      formData.append("emergencyContactPhone", emergencyContactPhone);
      formData.append("insuranceProvider", insuranceProvider);
      formData.append("insurancePolicyNumber", insurancePolicyNumber);
      formData.append("smokingStatus", smokingStatus);
      formData.append("alcoholConsumption", alcoholConsumption);
      dietaryRestrictions.forEach((r) => formData.append("dietaryRestrictions", r));
      formData.append("languagePreference", languagePreference);
      if (requiresGuardianConsent) {
        formData.append("requiresGuardianConsent", "on");
      }

      await updateHealthInfo(formData);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update health information";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-[var(--sage-200)] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
            Edit Health Information
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/40 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Blood Type */}
          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Blood Type
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          {/* Allergies */}
          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Allergies
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="e.g. Peanuts, Penicillin, Dust"
                className="flex-1 rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-4 py-2.5 rounded-xl bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--sage-200)]/70 text-xs font-body font-medium text-[var(--ink)] border border-[var(--sage-200)]"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      className="text-[var(--ink-soft)] hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Sarah Jenkins (Spouse)"
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              />
            </div>
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+880 1800 000000"
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              />
            </div>
          </div>

          {/* Insurance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                placeholder="e.g. Green Delta Insurance"
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              />
            </div>
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Insurance Policy Number
              </label>
              <input
                type="text"
                value={insurancePolicyNumber}
                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                placeholder="e.g. POL-9920194"
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              />
            </div>
          </div>

          {/* Lifestyle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Smoking Status
              </label>
              <select
                value={smokingStatus}
                onChange={(e) => setSmokingStatus(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              >
                <option value="">Select</option>
                <option value="Never">Never</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Alcohol Consumption
              </label>
              <select
                value={alcoholConsumption}
                onChange={(e) => setAlcoholConsumption(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              >
                <option value="">Select</option>
                <option value="Never">Never</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Regularly">Regularly</option>
              </select>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Dietary Restrictions
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRestriction}
                onChange={(e) => setNewRestriction(e.target.value)}
                placeholder="e.g. Gluten-free, Halal, Lactose intolerant"
                className="flex-1 rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRestriction();
                  }
                }}
              />
              <button
                type="button"
                onClick={addRestriction}
                className="px-4 py-2.5 rounded-xl bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
            {dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {dietaryRestrictions.map((restriction, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--sage-200)]/70 text-xs font-body font-medium text-[var(--ink)] border border-[var(--sage-200)]"
                  >
                    {restriction}
                    <button
                      type="button"
                      onClick={() => removeRestriction(index)}
                      className="text-[var(--ink-soft)] hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Language Preference & Guardian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                Language Preference
              </label>
              <select
                value={languagePreference}
                onChange={(e) => setLanguagePreference(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
              >
                <option value="English">English</option>
                <option value="Bengali">Bengali</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="requiresGuardianConsent"
                checked={requiresGuardianConsent}
                onChange={(e) => setRequiresGuardianConsent(e.target.checked)}
                className="w-4 h-4 accent-[var(--coral)] rounded"
              />
              <label
                htmlFor="requiresGuardianConsent"
                className="font-body text-sm text-[var(--ink)] cursor-pointer select-none"
              >
                Requires Guardian Consent
              </label>
            </div>
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
