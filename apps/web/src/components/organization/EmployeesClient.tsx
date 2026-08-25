"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  inviteEmployee,
  removeEmployee,
  updateEmployee,
  getOrganizationEmployees,
  respondToEmployeeInvitation,
} from "@/actions/admin/employees";
import { setConsultationFee } from "@/actions/payment/setConsultationFee";
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  Trash2,
  History,
  Coins,
  Save,
} from "lucide-react";

interface EmployeesClientProps {
  organizationId: string;
  currentUserId: string;
}

type EmployeeRecord = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    doctorSchedules?: { id: string; consultationFee: number | null }[];
  };
  role: string;
  departmentId: string | null;
  department: { id: string; name: string } | null;
};

type InvitationRecord = {
  id: string;
  email: string | null;
  role: string;
  invitedBy: { id: string; name: string; email: string };
  invitedUser: { id: string; name: string; email: string };
};

type DepartmentRecord = {
  id: string;
  name: string;
};

export function EmployeesClient({
  organizationId,
  currentUserId,
}: EmployeesClientProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<InvitationRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [savingDepartmentId, setSavingDepartmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [departmentDrafts, setDepartmentDrafts] = useState<Record<string, string>>({});

  const [feeDrafts, setFeeDrafts] = useState<Record<string, string>>({});
  const [savingFeeScheduleId, setSavingFeeScheduleId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const data = await getOrganizationEmployees(organizationId);
    setEmployees(data.employees);
    setPendingInvitations(data.pendingInvitations);
    setDepartments(data.departments);
    setDepartmentDrafts(
      Object.fromEntries(
        data.employees.map((employee) => [employee.id, employee.departmentId ?? ""])
      )
    );
    const fees: Record<string, string> = {};
    for (const emp of data.employees) {
      const sched = emp.user.doctorSchedules?.[0];
      if (sched) {
        fees[sched.id] = sched.consultationFee !== null && sched.consultationFee !== undefined ? String(sched.consultationFee) : "";
      }
    }
    setFeeDrafts(fees);
  }, [organizationId]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await getOrganizationEmployees(organizationId);
        if (!active) return;
        setEmployees(data.employees);
        setPendingInvitations(data.pendingInvitations);
        setDepartments(data.departments);
        setDepartmentDrafts(
          Object.fromEntries(
            data.employees.map((employee) => [employee.id, employee.departmentId ?? ""])
          )
        );
        const fees: Record<string, string> = {};
        for (const emp of data.employees) {
          const sched = emp.user.doctorSchedules?.[0];
          if (sched) {
            fees[sched.id] = sched.consultationFee !== null && sched.consultationFee !== undefined ? String(sched.consultationFee) : "";
          }
        }
        setFeeDrafts(fees);
      } catch (error: unknown) {
        if (active) {
          console.error(
            "Failed to load employees:",
            error instanceof Error ? error.message : error
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [organizationId]);

  const handleSaveFee = async (scheduleId: string) => {
    try {
      setSavingFeeScheduleId(scheduleId);
      setError(null);
      setSuccess(null);

      const feeValue = feeDrafts[scheduleId];
      const formData = new FormData();
      formData.append("scheduleId", scheduleId);
      if (feeValue) {
        formData.append("consultationFee", feeValue);
      }

      await setConsultationFee(formData);
      setSuccess("Consultation fee updated successfully.");
      await fetchData();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update consultation fee.");
    } finally {
      setSavingFeeScheduleId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("role", role);
      formData.append("organizationId", organizationId);

      await inviteEmployee(formData);
      setSuccess(`Invitation sent to ${email} as ${role}`);
      setEmail("");
      setRole("STAFF");
      await fetchData();
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    try {
      setError(null);
      setSuccess(null);
      const formData = new FormData();
      formData.append("invitationId", invitationId);
      formData.append("accept", String(accept));
      await respondToEmployeeInvitation(formData);
      setSuccess(accept ? "Invitation accepted!" : "Invitation declined.");
      await fetchData();
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to process invitation.");
    }
  };

  const handleRemove = async (employeeId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the organization staff roster?`)) {
      return;
    }

    try {
      setRemovingId(employeeId);
      setError(null);
      setSuccess(null);
      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("reason", "Removed by administrator");

      await removeEmployee(formData);
      setSuccess(`${name} has been removed from the organization.`);
      await fetchData();
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to remove employee.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleDepartmentSave = async (employeeId: string, nextDepartmentId: string) => {
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return;

    const normalizedDepartmentId = nextDepartmentId || null;

    if ((employee.departmentId ?? null) === normalizedDepartmentId) {
      return;
    }

    try {
      setSavingDepartmentId(employeeId);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("departmentId", nextDepartmentId);

      await updateEmployee(formData);
      setSuccess(
        normalizedDepartmentId
          ? `Department updated for ${employee.user.name}.`
          : `Department cleared for ${employee.user.name}.`
      );
      await fetchData();
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to update department.");
    } finally {
      setSavingDepartmentId(null);
    }
  };

  const roleOptions = [
    "DOCTOR",
    "NURSE",
    "STAFF",
    "RECEPTIONIST",
    "PHYSIOTHERAPIST",
    "RADIOLOGIST",
    "MANAGER",
  ];

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-3xl border border-[var(--sage-200)] p-4 md:px-6 shadow-sm">
        <div>
          <p className="font-body font-bold text-sm text-[var(--teal-900)]">Employee Audit &amp; Activity Log</p>
          <p className="text-xs text-[var(--ink-soft)] font-body">Track all member invitations, onboardings, and removals</p>
        </div>
        <Link
          href={`/admin/employees/history?org=${organizationId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] text-xs font-semibold font-body shadow-xs transition-colors"
        >
          <History className="w-4 h-4" />
          View Member History Log
        </Link>
      </div>

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

      {/* Invite Form */}
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
        <h3 className="font-display text-xl text-[var(--teal-900)] font-semibold mb-4 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-[var(--teal-900)]">
            <UserPlus className="w-5 h-5" strokeWidth={1.8} />
          </div>
          Invite Employee
        </h3>
        <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="email"
              placeholder="Employee registered email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
              required
            />
          </div>
          <div className="w-48">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-[var(--paper)]/50"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90 transition-opacity font-body shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {inviting ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
          <h4 className="font-display text-lg text-[var(--teal-900)] font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
            Pending Invitations ({pendingInvitations.length})
          </h4>
          <div className="space-y-3">
            {pendingInvitations.map((inv) => {
              const isInvitee = inv.invitedUser.id === currentUserId;
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--paper)]/80 border border-[var(--sage-200)]"
                >
                  <div>
                    <p className="font-body text-sm font-semibold text-[var(--ink)]">
                      {inv.invitedUser.name || inv.email}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
                      {inv.email} • Role: <strong className="text-[var(--teal-900)]">{inv.role}</strong> • Invited by {inv.invitedBy.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isInvitee ? (
                      <>
                        <button
                          onClick={() => handleRespond(inv.id, true)}
                          className="px-4 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(inv.id, false)}
                          className="px-4 py-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-mono text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending Response
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display text-xl text-[var(--teal-900)] font-semibold flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-[var(--teal-900)]">
              <Users className="w-5 h-5" strokeWidth={1.8} />
            </div>
            Active Employees ({employees.length})
          </h4>
        </div>
        {employees.length === 0 ? (
          <div className="text-center py-8 text-[var(--ink-soft)] font-body text-sm">
            <Users className="w-12 h-12 mx-auto text-[var(--ink-soft)] opacity-30 mb-2" />
            No employees added to this organization yet.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden rounded-2xl border border-[var(--sage-200)]">
              <table className="w-full border-collapse">
                <thead className="bg-[var(--paper)]/70">
                  <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Consultation Fee (BDT)</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sage-200)] bg-white">
                  {employees.map((emp) => {
                    const doctorSchedule = emp.user.doctorSchedules?.[0];
                    const isDoctor = emp.role === "DOCTOR";
                    return (
                      <tr key={emp.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[var(--teal-900)] text-white flex items-center justify-center font-display font-semibold text-sm shrink-0">
                              {emp.user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-body text-sm font-semibold text-[var(--ink)] truncate">
                                {emp.user.name}
                              </p>
                              <p className="text-xs text-[var(--ink-soft)] font-body truncate">
                                {emp.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex text-xs font-mono font-semibold px-3 py-1 rounded-full bg-teal-100 text-[var(--teal-900)] border border-teal-200">
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 min-w-[200px]">
                          <select
                            value={departmentDrafts[emp.id] ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDepartmentDrafts((current) => ({
                                ...current,
                                [emp.id]: value,
                              }));
                              void handleDepartmentSave(emp.id, value);
                            }}
                            className="w-full rounded-2xl border border-[var(--sage-200)] px-3 py-2 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-white"
                            disabled={departments.length === 0 || savingDepartmentId === emp.id}
                          >
                            <option value="">Unassigned</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 min-w-[190px]">
                          {isDoctor && doctorSchedule ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                placeholder="Fee (BDT)"
                                value={feeDrafts[doctorSchedule.id] ?? ""}
                                onChange={(e) =>
                                  setFeeDrafts((prev) => ({
                                    ...prev,
                                    [doctorSchedule.id]: e.target.value,
                                  }))
                                }
                                className="w-24 rounded-xl border border-[var(--sage-200)] px-2.5 py-1.5 text-xs font-mono bg-white focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveFee(doctorSchedule.id)}
                                disabled={savingFeeScheduleId === doctorSchedule.id}
                                className="p-2 rounded-xl bg-[var(--teal-900)] text-white hover:bg-[var(--teal-800)] transition-colors text-xs disabled:opacity-50"
                                title="Save Consultation Fee"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--ink-soft)] font-mono italic">
                              {isDoctor ? "No active schedule" : "N/A"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                            {savingDepartmentId === emp.id ? "Saving..." : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(emp.id, emp.user.name)}
                            disabled={removingId === emp.id}
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                            title={`Remove ${emp.user.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {employees.map((emp) => {
                const doctorSchedule = emp.user.doctorSchedules?.[0];
                const isDoctor = emp.role === "DOCTOR";
                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl bg-[var(--paper)]/60 border border-[var(--sage-200)] hover:bg-[var(--paper)] transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--teal-900)] text-white flex items-center justify-center font-display font-semibold text-sm shrink-0">
                          {emp.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-[var(--ink)] truncate">
                            {emp.user.name}
                          </p>
                          <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5 truncate">
                            {emp.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-teal-100 text-[var(--teal-900)] border border-teal-200">
                          {emp.role}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
                          Active
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(emp.id, emp.user.name)}
                          disabled={removingId === emp.id}
                          className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                          title={`Remove ${emp.user.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="min-w-[220px] flex-1 max-w-[380px]">
                        <select
                          value={departmentDrafts[emp.id] ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDepartmentDrafts((current) => ({
                              ...current,
                              [emp.id]: value,
                            }));
                            void handleDepartmentSave(emp.id, value);
                          }}
                          className="w-full rounded-2xl border border-[var(--sage-200)] px-4 py-2 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] bg-white"
                          disabled={departments.length === 0 || savingDepartmentId === emp.id}
                        >
                          <option value="">Unassigned</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] font-body">
                        {savingDepartmentId === emp.id ? "Saving..." : "Tap save to update department"}
                      </p>
                    </div>

                    {isDoctor && doctorSchedule && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--sage-200)]/70">
                        <span className="text-xs font-mono text-[var(--ink-soft)]">Fee (BDT):</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            placeholder="BDT"
                            value={feeDrafts[doctorSchedule.id] ?? ""}
                            onChange={(e) =>
                              setFeeDrafts((prev) => ({
                                ...prev,
                                [doctorSchedule.id]: e.target.value,
                              }))
                            }
                            className="w-24 rounded-xl border border-[var(--sage-200)] px-2.5 py-1 text-xs font-mono bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveFee(doctorSchedule.id)}
                            disabled={savingFeeScheduleId === doctorSchedule.id}
                            className="p-1.5 rounded-lg bg-[var(--teal-900)] text-white text-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
