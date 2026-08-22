"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateOrganization } from "@/actions/admin/updateOrganization";
import {
  createAdminVote,
  voteOnAdminChange,
  getPendingVotes,
} from "@/actions/admin/votes";
import {
  Building2,
  MapPin,
  UserPlus,
  Users,
  Vote,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Search,
  Loader2,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  specialties: string[];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  logo: string | null;
  motto: string | null;
  vision: string | null;
  mission: string | null;
  establishedYear: number | null;
  organizationType: { id: string; name: string; code: string };
  admins: Array<{
    id: string;
    user: { id: string; name: string; email: string };
    isPrimaryAdmin: boolean;
    isActive: boolean;
  }>;
}

interface OrgType {
  id: string;
  name: string;
  code: string;
}

interface EditOrganizationClientProps {
  organization: Organization;
  orgTypes: OrgType[];
  currentUserId: string;
}

export function EditOrganizationClient({
  organization,
  orgTypes,
  currentUserId,
}: EditOrganizationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(organization.name);
  const [typeId, setTypeId] = useState(organization.organizationType.id);
  const [specialties, setSpecialties] = useState(
    organization.specialties?.join(", ") || ""
  );
  const [address, setAddress] = useState(organization.address || "");
  const [latitude, setLatitude] = useState(
    organization.latitude?.toString() || ""
  );
  const [longitude, setLongitude] = useState(
    organization.longitude?.toString() || ""
  );
  const [logo, setLogo] = useState(organization.logo || "");
  const [motto, setMotto] = useState(organization.motto || "");
  const [vision, setVision] = useState(organization.vision || "");
  const [mission, setMission] = useState(organization.mission || "");
  const [establishedYear, setEstablishedYear] = useState(
    organization.establishedYear?.toString() || ""
  );

  // Admin vote management
  const [voteAction, setVoteAction] = useState<"ADD_ADMIN" | "REMOVE_ADMIN">("ADD_ADMIN");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedTargetAdminId, setSelectedTargetAdminId] = useState("");
  const [reason, setReason] = useState("");
  const [submittingVote, setSubmittingVote] = useState(false);
  const [pendingVotes, setPendingVotes] = useState<any[]>([]);
  const [votesLoading, setVotesLoading] = useState(false);

  const isCurrentPrimaryAdmin = organization.admins.some(
    (a) => a.user.id === currentUserId && a.isPrimaryAdmin && a.isActive
  );

  const fetchPendingVotes = async () => {
    setVotesLoading(true);
    try {
      const votes = await getPendingVotes(organization.id);
      setPendingVotes(votes);
    } catch (err) {
      console.error(err);
    } finally {
      setVotesLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVotes();
  }, [organization.id]);

  const geocodeAddress = async () => {
    if (!address.trim()) {
      setError("Please enter an address first.");
      return;
    }

    setGeocoding(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "PersoCare-Ecosystem/1.0",
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat).toFixed(6));
        setLongitude(parseFloat(data[0].lon).toFixed(6));
        setSuccess("Coordinates populated from address!");
      } else {
        setError("Could not resolve location. Please enter coordinates manually.");
      }
    } catch (err) {
      setError("Geocoding lookup failed. Please enter coordinates manually.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("organizationId", organization.id);
      formData.append("name", name);
      formData.append("organizationTypeId", typeId);
      formData.append("specialties", specialties);
      formData.append("address", address);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("logo", logo);
      formData.append("motto", motto);
      formData.append("vision", vision);
      formData.append("mission", mission);
      formData.append("establishedYear", establishedYear);

      await updateOrganization(formData);
      setSuccess("Organization details saved successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update organization.");
    } finally {
      setLoading(false);
    }
  };

  const handleProposeVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVote(true);
    setError(null);
    setSuccess(null);

    try {
      let targetUserId = selectedTargetAdminId;

      if (voteAction === "ADD_ADMIN") {
        if (!newAdminEmail.trim()) {
          throw new Error("Please enter the user's email address");
        }
        // Lookup target user by email
        const res = await fetch("/api/users/by-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newAdminEmail.trim() }),
        });
        const data = await res.json();
        if (!data.user) {
          throw new Error("No registered PersoCare user found with this email address");
        }
        targetUserId = data.user.id;
      } else {
        if (!targetUserId) {
          throw new Error("Please select an admin to remove");
        }
      }

      const formData = new FormData();
      formData.append("organizationId", organization.id);
      formData.append("targetAdminId", targetUserId);
      formData.append("action", voteAction);
      formData.append("reason", reason);

      await createAdminVote(formData);
      setSuccess(
        voteAction === "ADD_ADMIN"
          ? "Vote initiated to add new administrator!"
          : "Vote initiated to remove administrator!"
      );
      setNewAdminEmail("");
      setSelectedTargetAdminId("");
      setReason("");
      await fetchPendingVotes();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to initiate vote.");
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleVote = async (voteId: string, approved: boolean) => {
    try {
      setError(null);
      setSuccess(null);
      const formData = new FormData();
      formData.append("voteId", voteId);
      formData.append("approved", String(approved));
      await voteOnAdminChange(formData);
      setSuccess(approved ? "Vote submitted: Approved" : "Vote submitted: Rejected");
      await fetchPendingVotes();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit vote.");
    }
  };

  const activeAdmins = organization.admins.filter((a) => a.isActive);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/organization"
        className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organization Overview
      </Link>

      {/* Alert Banners */}
      {success && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-body">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-body">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <form
        onSubmit={handleUpdate}
        className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm space-y-5"
      >
        <h2 className="font-display text-xl text-[var(--teal-900)] font-semibold flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-[var(--teal-900)]">
            <Building2 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          Organization Details
        </h2>

        <div>
          <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
            Organization Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            required
          />
        </div>

        <div>
          <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
            Organization Type *
          </label>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            required
          >
            {orgTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
            Medical Specialties (Comma Separated)
          </label>
          <input
            type="text"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="Cardiology, Neurology, Orthopedics..."
            className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Logo URL
            </label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Motto
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Compassion with excellence"
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Established Year
            </label>
            <input
              type="number"
              value={establishedYear}
              onChange={(e) => setEstablishedYear(e.target.value)}
              placeholder="1965"
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Vision
            </label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Mission
            </label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block">
              Physical Address
            </label>
            <button
              type="button"
              onClick={geocodeAddress}
              disabled={geocoding}
              className="text-xs font-semibold text-[var(--coral)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Fetch Coordinates
            </button>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Hospital Road, Dhaka, Bangladesh"
            className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Latitude
            </label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 23.8103"
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--ink)] block mb-1.5">
              Longitude
            </label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 90.4125"
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/organization")}
            className="px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90 transition-opacity font-body shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Admin Governance & Voting Section */}
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
        <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold mb-4 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-[var(--teal-900)]">
            <Users className="w-5 h-5" strokeWidth={1.8} />
          </div>
          Administrators & Governance
        </h3>

        {/* Current Active Admins */}
        <div className="space-y-3 mb-6">
          {activeAdmins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--paper)]/60 border border-[var(--sage-200)]"
            >
              <div>
                <p className="font-body text-sm font-semibold text-[var(--ink)]">
                  {admin.user.name} {admin.user.id === currentUserId && "(You)"}
                </p>
                <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
                  {admin.user.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {admin.isPrimaryAdmin ? (
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[var(--teal-900)] text-white shadow-2xs">
                    Primary Admin
                  </span>
                ) : (
                  <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-white border border-[var(--sage-200)] text-[var(--teal-900)]">
                    Co-Admin
                  </span>
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Propose Admin Vote Form */}
        <form
          onSubmit={handleProposeVote}
          className="border-t border-[var(--sage-200)] pt-6 mt-6 space-y-4"
        >
          <h4 className="font-display text-base text-[var(--teal-900)] font-semibold flex items-center gap-2">
            <Vote className="w-4 h-4 text-[var(--coral)]" />
            Propose Co-Admin Vote
          </h4>
          <p className="text-xs text-[var(--ink-soft)] font-body">
            Adding or removing an administrator requires approval from all active organization administrators.
          </p>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-body text-[var(--ink)] cursor-pointer">
              <input
                type="radio"
                name="voteAction"
                value="ADD_ADMIN"
                checked={voteAction === "ADD_ADMIN"}
                onChange={() => setVoteAction("ADD_ADMIN")}
                className="text-[var(--coral)]"
              />
              ➕ Propose Adding Co-Admin
            </label>
            <label className="flex items-center gap-2 text-xs font-body text-[var(--ink)] cursor-pointer">
              <input
                type="radio"
                name="voteAction"
                value="REMOVE_ADMIN"
                checked={voteAction === "REMOVE_ADMIN"}
                onChange={() => setVoteAction("REMOVE_ADMIN")}
                className="text-[var(--coral)]"
              />
              ➖ Propose Removing Co-Admin
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            {voteAction === "ADD_ADMIN" ? (
              <div className="flex-1 min-w-[240px]">
                <input
                  type="email"
                  placeholder="New admin's registered email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm bg-[var(--paper)]/50"
                  required
                />
              </div>
            ) : (
              <div className="flex-1 min-w-[240px]">
                <select
                  value={selectedTargetAdminId}
                  onChange={(e) => setSelectedTargetAdminId(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm bg-[var(--paper)]/50"
                  required
                >
                  <option value="">Select co-admin to remove</option>
                  {activeAdmins
                    .filter((a) => !a.isPrimaryAdmin)
                    .map((a) => (
                      <option key={a.user.id} value={a.user.id}>
                        {a.user.name} ({a.user.email})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Reason for change (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm bg-[var(--paper)]/50"
              />
            </div>

            <button
              type="submit"
              disabled={submittingVote}
              className="px-6 py-2.5 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-800)] text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submittingVote ? "Proposing..." : "Start Vote"}
            </button>
          </div>
        </form>

        {/* Pending Votes List */}
        {pendingVotes.length > 0 && (
          <div className="border-t border-[var(--sage-200)] pt-6 mt-6 space-y-3">
            <h4 className="font-display text-base text-[var(--teal-900)] font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Active Admin Votes ({pendingVotes.length})
            </h4>

            {pendingVotes.map((vote) => {
              const hasVoted = vote.votes.some(
                (v: any) => v.adminId === currentUserId
              );
              return (
                <div
                  key={vote.id}
                  className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-body text-sm font-semibold text-[var(--ink)]">
                        {vote.action === "ADD_ADMIN" ? "➕ Add Co-Admin" : "➖ Remove Co-Admin"}:{" "}
                        {vote.targetAdmin?.name || vote.targetAdmin?.email || "User"}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
                        Proposed by <strong>{vote.initiatedBy.name}</strong> •{" "}
                        {vote.votes.length}/{activeAdmins.length} votes recorded
                      </p>
                      {vote.reason && (
                        <p className="text-xs italic text-[var(--ink)] mt-1">
                          "{vote.reason}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!hasVoted ? (
                        <>
                          <button
                            onClick={() => handleVote(vote.id, true)}
                            className="px-4 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleVote(vote.id, false)}
                            className="px-4 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-mono text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full font-medium">
                          ✓ You have voted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vote breakdown */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200/50 text-[11px] font-body text-[var(--ink-soft)]">
                    {vote.votes.map((v: any) => (
                      <span
                        key={v.id}
                        className={`px-2 py-0.5 rounded-full ${
                          v.approved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {v.admin.name}: {v.approved ? "Approved" : "Rejected"}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
