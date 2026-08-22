"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  ShieldCheck,
  MapPin,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  FolderTree,
  Sliders,
  Sparkles,
  QrCode,
} from "lucide-react";
import {
  respondToInvitation,
  createAdminInvitation,
  type AdminOrgResponse,
} from "@/actions/admin/invitations";
import { InviteAdminModal } from "./InviteAdminModal";
import { ManageDepartments } from "@/components/admin/ManageDepartments";
import { ManageRoles } from "@/components/admin/ManageRoles";
import { ManageQrGeneration } from "./ManageQrGeneration";

interface ManageOrganizationClientProps {
  initialData: AdminOrgResponse;
  userEmail: string;
}

export function ManageOrganizationClient({
  initialData,
  userEmail,
}: ManageOrganizationClientProps) {
  const router = useRouter();
  const data = initialData;
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "departments" | "roles" | "qr">("details");

  // Handle Accept/Decline Invitation
  const handleRespond = async (invitationId: string, accept: boolean) => {
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const formData = new FormData();
      formData.append("invitationId", invitationId);
      formData.append("accept", String(accept));
      await respondToInvitation(formData);
      setActionSuccess(
        accept
          ? "Invitation accepted successfully! Organization joined."
          : "Invitation declined."
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to respond to invitation.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Invite Co-Admin
  const handleInvite = async (email: string) => {
    if (data.type !== "admin") return;
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("organizationId", data.organization.id);
      await createAdminInvitation(formData);
      setActionSuccess(`Invitation sent to ${email}`);
      setShowInviteModal(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global alert feedback */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-body">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-body">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── State 1: User has a pending invitation ─── */}
      {data.type === "invitation" && data.invitation && (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--coral)]/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[var(--coral)]/10 text-[var(--coral)] flex items-center justify-center">
              <Mail className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--coral)] font-semibold">
                Pending Co-Admin Invitation
              </span>
              <h2 className="font-display text-2xl text-[var(--teal-900)] font-semibold">
                You&apos;re invited to join
              </h2>
            </div>
          </div>

          <div className="bg-[var(--paper)] rounded-2xl p-5 border border-[var(--sage-200)]/80 my-5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-display text-xl font-semibold text-[var(--teal-900)]">
                {data.invitation.organization.name}
              </span>
              {data.invitation.organization.specialties?.length > 0 && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-teal-100 text-[var(--teal-900)]">
                  {data.invitation.organization.specialties.join(", ")}
                </span>
              )}
            </div>
            <p className="font-body text-sm text-[var(--ink-soft)]">
              Invited by{" "}
              <strong className="text-[var(--ink)] font-semibold">
                {data.invitation.invitedBy.name}
              </strong>{" "}
              ({data.invitation.invitedBy.email}) to serve as an organization administrator.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRespond(data.invitation!.id, true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Accepting..." : "Accept Invitation"}
            </button>
            <button
              onClick={() => handleRespond(data.invitation!.id, false)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      )}

      {/* ─── State 2: User is an active Admin with an organization ─── */}
      {data.type === "admin" && (
        <div className="space-y-6">
          {/* Organization Overview Card */}
          <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-[var(--teal-900)] flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7" strokeWidth={1.7} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-display text-2xl md:text-3xl text-[var(--teal-900)] font-bold">
                      {data.organization.name}
                    </h2>
                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {data.organization.verificationStatus.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {data.organization.organizationType.name}
                    </span>
                  </div>

                  {data.organization.specialties?.length > 0 && (
                    <p className="font-body text-xs text-[var(--ink-soft)] mt-1.5 font-medium">
                      Specialties: {data.organization.specialties.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-xs font-mono text-[var(--teal-900)] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {data.adminRecord.isPrimaryAdmin ? "Primary Admin" : "Co-Admin"}
                </span>
              </div>
            </div>

            {/* Navigation Tabs for Facility Management */}
            <div className="pt-4 border-t border-[var(--sage-200)]/80">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition-colors font-semibold ${
                    activeTab === "details"
                      ? "bg-[var(--teal-900)] text-white shadow-xs"
                      : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  }`}
                >
                  Organization Details &amp; Admins
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("departments")}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition-colors font-semibold flex items-center gap-1.5 ${
                    activeTab === "departments"
                      ? "bg-[var(--teal-900)] text-white shadow-xs"
                      : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Departments ({data.organization.departments?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("roles")}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition-colors font-semibold flex items-center gap-1.5 ${
                    activeTab === "roles"
                      ? "bg-[var(--teal-900)] text-white shadow-xs"
                      : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  }`}
                  >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Custom Roles ({data.organization.roles?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("qr")}
                  className={`px-4 py-2 rounded-full text-xs font-mono transition-colors font-semibold flex items-center gap-1.5 ${
                    activeTab === "qr"
                      ? "bg-[var(--teal-900)] text-white shadow-xs"
                      : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Generation</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── TAB 1: Organization Details & Admins ─── */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Geolocation and Address */}
            <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-body text-[var(--ink-soft)]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--coral)] shrink-0" />
                <span>{data.organization.address || "Address not provided"}</span>
              </div>

                {data.organization.latitude && data.organization.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${data.organization.latitude},${data.organization.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[var(--coral)] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on Google Maps ({data.organization.latitude.toFixed(4)}, {data.organization.longitude.toFixed(4)})
                  </a>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {data.organization.logo ? (
                      <div
                        role="img"
                        aria-label={`${data.organization.name} logo`}
                        className="w-16 h-16 rounded-2xl border border-[var(--sage-200)] bg-center bg-cover bg-no-repeat"
                        style={{ backgroundImage: `url(${data.organization.logo})` }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--teal-900)] flex items-center justify-center">
                        <Building2 className="w-8 h-8" strokeWidth={1.6} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
                        Organization Profile
                      </h3>
                      <p className="text-xs text-[var(--ink-soft)] font-body">
                        Manage the public-facing identity and clinical narrative of your institution.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/dashboard/organization/edit/${data.organization.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--teal-900)] text-white text-xs font-semibold hover:bg-[var(--teal-800)] transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Edit profile
                  </a>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {data.organization.motto && (
                    <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-mono mb-1">
                        Motto
                      </p>
                      <p className="font-body text-sm text-[var(--ink)]">{data.organization.motto}</p>
                    </div>
                  )}
                  {data.organization.establishedYear && (
                    <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-mono mb-1">
                        Established
                      </p>
                      <p className="font-body text-sm text-[var(--ink)]">{data.organization.establishedYear}</p>
                    </div>
                  )}
                  {data.organization.vision && (
                    <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4 md:col-span-2">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-mono mb-1">
                        Vision
                      </p>
                      <p className="font-body text-sm text-[var(--ink)] leading-relaxed">{data.organization.vision}</p>
                    </div>
                  )}
                  {data.organization.mission && (
                    <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4 md:col-span-2">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-mono mb-1">
                        Mission
                      </p>
                      <p className="font-body text-sm text-[var(--ink)] leading-relaxed">{data.organization.mission}</p>
                    </div>
                  )}
                  {typeof data.organization.patientServedCount === "number" && (
                    <div className="rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)] p-4 md:col-span-2">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-mono mb-1">
                        Patients served
                      </p>
                      <p className="font-body text-sm text-[var(--ink)]">
                        {data.organization.patientServedCount.toLocaleString()} people served
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Administrators & Team Management */}
              <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-50 text-[var(--teal-900)]">
                      <Users className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold">
                        Organization Administrators
                      </h3>
                      <p className="text-xs text-[var(--ink-soft)] font-mono">
                        Multi-admin authority governance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/organization/edit/${data.organization.id}`}
                      className="text-xs font-semibold text-[var(--coral)] hover:underline font-body"
                    >
                      Manage Admins &amp; Voting →
                    </Link>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--coral)] text-white text-xs font-semibold hover:opacity-90 shadow-sm transition-opacity cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Co-Admin
                    </button>
                  </div>
                </div>

                {/* Admin Members List */}
                <div className="space-y-3">
                  {data.organization.admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-[var(--paper)]/60 border border-[var(--sage-200)]/80 hover:bg-[var(--paper)] transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[var(--teal-900)] text-white flex items-center justify-center font-display font-semibold text-sm">
                          {admin.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-body font-semibold text-sm text-[var(--ink)]">
                              {admin.user.name}
                            </p>
                            {admin.user.email === userEmail && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                                You
                              </span>
                            )}
                          </div>
                          <p className="font-body text-xs text-[var(--ink-soft)]">{admin.user.email}</p>
                        </div>
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
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Invitations section */}
                {data.organization.adminInvitations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[var(--sage-200)]/80">
                    <h4 className="font-body text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-3">
                      Pending Invitations ({data.organization.adminInvitations.length})
                    </h4>
                    <div className="space-y-2">
                      {data.organization.adminInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs font-body"
                        >
                          <div className="flex items-center gap-2 text-[var(--ink)]">
                            <Mail className="w-4 h-4 text-amber-600" />
                            <span className="font-medium">{inv.invitedUser.name}</span>
                            <span className="text-[var(--ink-soft)]">({inv.invitedUser.email})</span>
                          </div>
                          <span className="flex items-center gap-1.5 font-mono text-amber-700 text-[11px] font-medium bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Waiting Response
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB 2: Departments ─── */}
          {activeTab === "departments" && (
            <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
              <ManageDepartments
                organizationId={data.organization.id}
                departments={data.organization.departments || []}
              />
            </div>
          )}

          {/* ─── TAB 3: Roles ─── */}
          {activeTab === "roles" && (
            <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
              <ManageRoles
                organizationId={data.organization.id}
                roles={data.organization.roles || []}
              />
            </div>
          )}

          {/* ─── TAB 4: QR Generation ─── */}
          {activeTab === "qr" && (
            <ManageQrGeneration organization={data.organization} />
          )}
        </div>
      )}

      {/* ─── State 3: User has no organization and no pending invitation ─── */}
      {data.type === "none" && (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-8 md:p-12 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 text-[var(--teal-900)] flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" strokeWidth={1.6} />
          </div>
          <div>
            <h2 className="font-display text-2xl text-[var(--teal-900)] font-semibold">
              No Organization Active
            </h2>
            <p className="font-body text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed">
              You currently do not manage or belong to an organization. Create your hospital or clinic profile to start managing doctors, staff, and appointments.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/organization/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90 shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create Organization
            </Link>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteAdminModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}
