"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ProfileData } from "@/actions/profile";
import {
  User,
  Heart,
  Briefcase,
  Edit,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { EditPersonalModal } from "./EditPersonalModal";
import { EditHealthModal } from "./EditHealthModal";
import { DiditVerifyButton } from "@/components/ekyc/DiditVerifyButton";
import { switchActiveRole } from "@/actions/switchRole";
import { type SwitchableRole } from "@/lib/auth-constants";
import { useRole, ROLE_SWITCH_OUT_MS } from "@/contexts/RoleContext";

interface ProfileClientProps {
  initialData: ProfileData;
}

// Allowed roles for switching
const ROLES: Array<{ value: SwitchableRole; label: string }> = [
  { value: "user", label: "User" },
  { value: "doctor", label: "Doctor" },
  { value: "physiotherapist", label: "Physiotherapist" },
  { value: "radiologist", label: "Radiologist" },
  { value: "admin", label: "Admin / Org Lead" },
  { value: "inventory_manager", label: "Inventory Manager" },
];

type TabType = "personal" | "health" | "professional";

export function ProfileClient({ initialData }: ProfileClientProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [selectedRole, setSelectedRole] = useState<SwitchableRole>(() => {
    return (initialData.activeRole as SwitchableRole) || "user";
  });
  const [showEKYCWarning, setShowEKYCWarning] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const isIdentityVerified = data.identityVerification?.status === "APPROVED";

  // Check if user has a verified profession of the given role
  // 'user' always passes — it's the base role with no profession requirement.
  // Platform owners can switch to any role directly to inspect and manage views.
  const hasVerifiedProfession = (roleCode: SwitchableRole) => {
    if (data.isPlatformOwner) return true;
    if (roleCode === "user") return true;
    if (roleCode === "inventory_manager") {
      return (data.inventoryManagerRoles?.length || 0) > 0;
    }
    if (roleCode === "admin") {
      const hasAdminRole = (data.adminRoles?.length || 0) > 0;
      const hasAdminProfession = data.professions.some(
        (p) => p.code.toUpperCase() === "ADMIN" && p.status === "VERIFIED"
      );
      return hasAdminRole || hasAdminProfession;
    }
    return data.professions.some(
      (p) => p.code.toLowerCase() === roleCode.toLowerCase() && p.status === "VERIFIED"
    );
  };

  const handleRoleSwitch = async (role: SwitchableRole) => {
    // "user" is always allowed
    if (role !== "user" && !hasVerifiedProfession(role)) {
      setPendingRole(role);
      setShowEKYCWarning(true);
      return;
    }

    setIsSwitching(true);
    try {
      const result = await switchActiveRole(role);
      if (result.ok) {
        setSelectedRole(role);
        console.log("[ProfileClient] Active role switched to:", role);
        router.refresh(); // triggers re-fetch of server components (sidebar, topbar)
      } else {
        console.error("[ProfileClient] Role switch failed:", result.error);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const closeModal = () => {
    setShowEKYCWarning(false);
    setPendingRole(null);
  };

  const handleDataSaved = () => {
    router.refresh();
  };

  const roleDisplayName = (role: string) => {
    const found = ROLES.find((r) => r.value === role);
    return found ? found.label : role;
  };

  const tabs: Array<{ id: TabType; label: string; icon: typeof User }> = [
    { id: "personal", label: "Personal", icon: User },
    { id: "health", label: "Health", icon: Heart },
    { id: "professional", label: "Professional", icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Hero Card ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt={data.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-[var(--teal-900)] font-semibold">
                {data.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-medium">
                Active
              </span>
            </div>
            <p className="font-body text-xs text-[var(--ink-soft)] mt-0.5">{data.email}</p>
          </div>
        </div>

        {/* Switch Profile Role Dropdown */}
        <div className="flex items-center gap-3 bg-[var(--paper)] p-2 rounded-2xl border border-[var(--sage-200)]">
          <span className="text-xs font-mono text-[var(--ink-soft)] px-1">Switch Profile:</span>
          <div className="relative">
            <select
              value={selectedRole}
              disabled={isSwitching}
              onChange={(e) => handleRoleSwitch(e.target.value as SwitchableRole)}
              className={`appearance-none bg-white text-[var(--teal-900)] font-body text-xs font-semibold px-3.5 py-2 pr-8 rounded-xl border border-[var(--sage-200)] shadow-2xs hover:border-[var(--coral)] focus:outline-hidden cursor-pointer transition-all duration-300 ${
                isSwitching ? "opacity-50 scale-95 cursor-not-allowed" : ""
              }`}
            >
              {ROLES.map((r) => {
                const verified = hasVerifiedProfession(r.value);
                return (
                  <option key={r.value} value={r.value}>
                    {r.label} {!verified ? "(Unverified)" : ""}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] pointer-events-none" />
          </div>
          <div
            className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-[var(--teal-900)] text-white font-semibold shadow-2xs transition-all duration-300 ${
              isSwitching ? "opacity-50 scale-95" : ""
            }`}
          >
            {roleDisplayName(selectedRole)}
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ──────────────────────────────── */}
      <div className="border-b border-[var(--sage-200)] pb-px">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--teal-900)] text-white shadow-xs"
                    : "text-[var(--ink-soft)] hover:text-[var(--teal-900)] hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-[var(--coral)]" : "text-[var(--ink-soft)]"}`}
                  strokeWidth={1.8}
                />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Content Container ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm min-h-[340px]">
        {activeTab === "personal" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-[var(--teal-900)] font-semibold">
                Personal Information
              </h2>
              <button
                type="button"
                onClick={() => setShowPersonalModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--teal-900)]/10 text-[var(--teal-900)] hover:bg-[var(--teal-900)] hover:text-white font-body text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" strokeWidth={1.8} />
                Edit Profile
              </button>
            </div>
            <PersonalTab data={data} />
          </div>
        )}

        {activeTab === "health" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-[var(--teal-900)] font-semibold">
                Health &amp; Clinical Information
              </h2>
              <button
                type="button"
                onClick={() => setShowHealthModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--coral)]/10 text-[var(--coral)] hover:bg-[var(--coral)] hover:text-white font-body text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" strokeWidth={1.8} />
                Edit Health Data
              </button>
            </div>
            <HealthTab data={data} />
          </div>
        )}

        {activeTab === "professional" && <ProfessionalTab data={data} />}
      </div>

      {/* ─── Edit Personal Modal ──────────────────────────── */}
      {showPersonalModal && (
        <EditPersonalModal
          data={{
            name: data.name,
            phone: data.phone,
            dob: data.dob,
            gender: data.gender,
            username: data.username,
          }}
          onClose={() => setShowPersonalModal(false)}
          onSaved={handleDataSaved}
        />
      )}

      {/* ─── Edit Health Modal ────────────────────────────── */}
      {showHealthModal && (
        <EditHealthModal
          data={{
            bloodType: data.patientProfile?.bloodType || null,
            allergies: data.patientProfile?.allergies || [],
            emergencyContactName: data.patientProfile?.emergencyContactName || null,
            emergencyContactPhone: data.patientProfile?.emergencyContactPhone || null,
            insuranceProvider: data.patientProfile?.insuranceProvider || null,
            insurancePolicyNumber: data.patientProfile?.insurancePolicyNumber || null,
            smokingStatus: data.patientProfile?.smokingStatus || null,
            alcoholConsumption: data.patientProfile?.alcoholConsumption || null,
            dietaryRestrictions: data.patientProfile?.dietaryRestrictions || [],
            languagePreference: data.patientProfile?.languagePreference || null,
            requiresGuardianConsent: data.patientProfile?.requiresGuardianConsent || false,
          }}
          onClose={() => setShowHealthModal(false)}
          onSaved={handleDataSaved}
        />
      )}

      {/* ─── eKYC Warning Modal ───────────────────────────── */}
      {showEKYCWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--sage-200)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <AlertCircle className="w-6 h-6" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
                    Complete Your eKYC
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] font-mono">Verification Required</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-body text-sm text-[var(--ink-soft)] mb-5 leading-relaxed">
              To switch your active authority to{" "}
              <strong className="text-[var(--teal-900)] font-semibold">
                {roleDisplayName(pendingRole || "")}
              </strong>
              , you need to complete identity verification (Didit eKYC) and credential validation for
              this profession.
            </p>

            {isIdentityVerified ? (
              <p className="text-sm text-emerald-600 flex items-center gap-1.5 mb-5">
                <CheckCircle className="w-4 h-4" strokeWidth={1.6} />
                Identity verified. Open the Professional tab to finish credential validation.
              </p>
            ) : (
              <p className="text-xs font-body text-[var(--ink-soft)] mb-4">
                Proceed to open Didit for NID + selfie verification. After approval, return here to
                apply for the role.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {isIdentityVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("professional");
                    closeModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--coral)] text-white text-sm font-medium hover:opacity-90 shadow-sm transition-opacity cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Go to Professional Tab
                </button>
              ) : (
                <DiditVerifyButton
                  label="Proceed to eKYC"
                  showHint={false}
                  onComplete={closeModal}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--coral)] text-white text-sm font-medium hover:opacity-90 shadow-sm transition-opacity cursor-pointer disabled:opacity-60"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Personal Tab View ─────────────────────────────────────

function PersonalTab({ data }: { data: ProfileData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
      <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
        <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
          Full Name
        </span>
        <p className="font-body font-medium text-[var(--ink)]">{data.name}</p>
      </div>
      <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
        <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
          Email
        </span>
        <p className="font-body font-medium text-[var(--ink)] truncate">{data.email}</p>
      </div>
      <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
        <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
          Phone
        </span>
        <p className="font-body font-medium text-[var(--ink)]">{data.phone || "—"}</p>
      </div>
      <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
        <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
          Date of Birth
        </span>
        <p className="font-body font-medium text-[var(--ink)]">
          {data.dob ? format(parseISO(data.dob), "PPP") : "—"}
        </p>
      </div>
      <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
        <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
          Gender
        </span>
        <p className="font-body font-medium text-[var(--ink)] capitalize">{data.gender || "—"}</p>
      </div>
      <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
        <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
          Username
        </span>
        <p className="font-body font-medium text-[var(--ink)] font-mono">{data.username || "—"}</p>
      </div>
    </div>
  );
}

// ─── Health Tab View ───────────────────────────────────────

function HealthTab({ data }: { data: ProfileData }) {
  return (
    <>
      {data.patientProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Blood Group
            </span>
            <p className="font-display font-semibold text-rose-700 text-base">
              {data.patientProfile.bloodType || "—"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Allergies
            </span>
            <p className="font-body font-medium text-[var(--ink)]">
              {data.patientProfile.allergies?.length
                ? data.patientProfile.allergies.join(", ")
                : "None recorded"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Smoking Status
            </span>
            <p className="font-body font-medium text-[var(--ink)] capitalize">
              {data.patientProfile.smokingStatus || "Non-smoker"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Alcohol Intake
            </span>
            <p className="font-body font-medium text-[var(--ink)] capitalize">
              {data.patientProfile.alcoholConsumption || "None"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Dietary Restrictions
            </span>
            <p className="font-body font-medium text-[var(--ink)]">
              {data.patientProfile.dietaryRestrictions?.length
                ? data.patientProfile.dietaryRestrictions.join(", ")
                : "None"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Language Preference
            </span>
            <p className="font-body font-medium text-[var(--ink)] capitalize">
              {data.patientProfile.languagePreference || "English"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60 md:col-span-2">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Emergency Contact
            </span>
            <p className="font-body font-medium text-[var(--ink)]">
              {data.patientProfile.emergencyContactName
                ? `${data.patientProfile.emergencyContactName} · ${data.patientProfile.emergencyContactPhone || "No phone provided"}`
                : "Not configured"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/60">
            <span className="text-xs font-mono uppercase text-[var(--ink-soft)] tracking-wider block mb-1">
              Insurance Details
            </span>
            <p className="font-body font-medium text-[var(--ink)] truncate">
              {data.patientProfile.insuranceProvider
                ? `${data.patientProfile.insuranceProvider} (${data.patientProfile.insurancePolicyNumber || "N/A"})`
                : "None"}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-[var(--paper)] rounded-xl text-center border border-dashed border-[var(--sage-200)]">
          <p className="font-body text-sm text-[var(--ink-soft)]">
            No health profile data recorded yet.
          </p>
        </div>
      )}

      {/* Medical Conditions */}
      {data.conditions && data.conditions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--sage-200)]">
          <h3 className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-2.5">
            Medical Conditions &amp; Diagnoses
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.conditions.map((cond, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--sage-200)]/70 text-xs font-body font-medium text-[var(--teal-900)] border border-[var(--sage-200)]"
              >
                {cond.title}
                {cond.status === "CHRONIC" && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded-sm font-mono uppercase">
                    Chronic
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Professional Tab View ─────────────────────────────────

function ProfessionalTab({ data }: { data: ProfileData }) {
  const isVerified = data.identityVerification?.status === "APPROVED";
  const verificationStatus = data.identityVerification;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl text-[var(--teal-900)] font-semibold">
          Professional Credentials &amp; Verification
        </h2>
        <span className="text-xs font-mono text-[var(--ink-soft)] bg-[var(--paper)] px-3 py-1 rounded-full border border-[var(--sage-200)]">
          eKYC Gateway
        </span>
      </div>

      <div className="mb-5 p-4 bg-[var(--paper)] rounded-xl border border-[var(--sage-200)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-body font-medium text-[var(--ink)]">Identity Verification</p>
            {isVerified ? (
              <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle className="w-4 h-4" strokeWidth={1.6} />
                Verified on{" "}
                {verificationStatus?.verifiedAt
                  ? new Date(verificationStatus.verifiedAt).toLocaleDateString()
                  : "recently"}
              </p>
            ) : verificationStatus?.status === "PENDING" ||
              verificationStatus?.status === "IN_REVIEW" ? (
              <p className="text-sm text-amber-700 mt-1">
                Verification {verificationStatus.status.toLowerCase().replace("_", " ")} — refresh
                after Didit finishes.
              </p>
            ) : verificationStatus?.status === "DECLINED" ? (
              <p className="text-sm text-rose-700 mt-1">
                Verification declined — please try again with a clear NID and selfie.
              </p>
            ) : (
              <p className="text-sm text-[var(--ink-soft)] mt-1">
                Not verified – you need to verify your identity before applying for a professional
                role.
              </p>
            )}
          </div>
          {!isVerified ? (
            <DiditVerifyButton />
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-mono">
              Verified
            </span>
          )}
        </div>
      </div>

      {data.professions.length === 0 ? (
        <div className="text-center py-10 bg-[var(--paper)] rounded-xl border border-dashed border-[var(--sage-200)]">
          <Briefcase className="w-10 h-10 mx-auto text-[var(--ink-soft)] opacity-30" strokeWidth={1.6} />
          <p className="font-body text-sm text-[var(--ink-soft)] mt-3">
            No professional licenses or certifications linked to this account.
          </p>
          <p className="font-body text-xs text-[var(--ink-soft)]/70 mt-1">
            Apply to verify your medical or allied healthcare practitioner credentials through accredited eKYC.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.professions.map((prof) => {
            const isVerified = prof.status === "VERIFIED";
            const isPending = prof.status === "PENDING";
            const isRejected = prof.status === "REJECTED";

            let statusBadge = null;
            if (isVerified) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-medium border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  Verified
                </span>
              );
            } else if (isPending) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-medium border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  Pending Verification
                </span>
              );
            } else if (isRejected) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-medium border border-rose-200">
                  <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  Rejected
                </span>
              );
            }

            return (
              <div
                key={prof.id}
                className="border border-[var(--sage-200)] rounded-xl p-4 bg-[var(--paper)]/40 hover:bg-white transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-[var(--sage-200)] shadow-2xs">
                      <Briefcase className="w-4 h-4 text-[var(--teal-900)]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-[var(--ink)]">
                        {prof.professionType}
                      </p>
                      <p className="text-xs font-mono text-[var(--ink-soft)] uppercase">
                        Code: {prof.code}
                      </p>
                    </div>
                  </div>
                  {statusBadge}
                </div>

                {/* Doctor credentials details */}
                {prof.doctorCredential && (
                  <div className="mt-3.5 pt-3 border-t border-[var(--sage-200)] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-body">
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">BMDC Reg No:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.doctorCredential.bmdcRegistrationNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">Institution:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.doctorCredential.degreeInstitution} ({prof.doctorCredential.graduationYear})
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">Specialization:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.doctorCredential.specialization || "General Practice"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Physiotherapist credentials details */}
                {prof.physiotherapistCredential && (
                  <div className="mt-3.5 pt-3 border-t border-[var(--sage-200)] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-body">
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">License Number:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.physiotherapistCredential.licenseNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">Issuing Body:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.physiotherapistCredential.licenseIssuingBody}
                      </span>
                    </div>
                  </div>
                )}

                {/* Radiologist credentials details */}
                {prof.radiologistCredential && (
                  <div className="mt-3.5 pt-3 border-t border-[var(--sage-200)] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-body">
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">BMDC Reg No:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.radiologistCredential.bmdcRegistrationNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--ink-soft)] block font-mono">Certifying Body:</span>
                      <span className="font-semibold text-[var(--ink)]">
                        {prof.radiologistCredential.certificationBody}
                      </span>
                    </div>
                  </div>
                )}

                {isRejected && prof.rejectedReason && (
                  <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    <strong>Rejection Note:</strong> {prof.rejectedReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-2 text-xs font-body text-[var(--ink-soft)] pt-3 border-t border-[var(--sage-200)]/60">
        <Shield className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.8} />
        <span>Professional roles require eKYC verification and document clearance.</span>
      </div>
    </div>
  );
}
