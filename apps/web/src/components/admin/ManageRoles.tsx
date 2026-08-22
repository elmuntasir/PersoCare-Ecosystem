"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrganizationRole, deleteOrganizationRole } from "@/actions/admin/roles";
import { Plus, Trash2, ShieldCheck, AlertCircle } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface ManageRolesProps {
  organizationId: string;
  roles: Role[];
}

export function ManageRoles({ organizationId, roles }: ManageRolesProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("organizationId", organizationId);
      fd.append("name", name.trim());
      if (description) fd.append("description", description.trim());
      await createOrganizationRole(fd);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom role?")) return;
    try {
      const fd = new FormData();
      fd.append("roleId", id);
      await deleteOrganizationRole(fd);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-base font-bold text-[var(--teal-900)]">
            Custom Organization Roles
          </h4>
          <p className="text-xs font-body text-[var(--ink-soft)] mt-0.5">
            Define specific clinical and administrative position titles for your staff members.
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)]">
        <input
          type="text"
          placeholder="Role title (e.g. Senior Consultant, Lead Nurse)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-[var(--sage-200)] bg-white px-3.5 py-2 font-body text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
          required
        />
        <input
          type="text"
          placeholder="Role description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-[var(--sage-200)] bg-white px-3.5 py-2 font-body text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 font-body font-semibold text-xs transition-opacity disabled:opacity-60 shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{loading ? "Adding..." : "Add Role"}</span>
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {roles.length === 0 ? (
        <div className="p-8 text-center bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)]">
          <ShieldCheck className="w-8 h-8 text-[var(--ink-soft)] mx-auto opacity-40 mb-2" />
          <p className="text-xs font-body text-[var(--ink-soft)]">
            No custom organization roles added yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] hover:border-[var(--teal-900)]/40 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <p className="font-body font-bold text-sm text-[var(--ink)] truncate">{role.name}</p>
                {role.description && (
                  <p className="text-xs text-[var(--ink-soft)] font-body line-clamp-1 mt-0.5">
                    {role.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(role.id)}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors shrink-0"
                title="Delete Role"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
