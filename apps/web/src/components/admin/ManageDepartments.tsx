"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDepartment, deleteDepartment } from "@/actions/admin/departments";
import { Plus, Trash2, FolderTree, AlertCircle, Sparkles } from "lucide-react";
import { getDepartmentPresets, type DepartmentPreset } from "@/lib/department-presets";

interface Department {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  head?: { id: string; name: string } | null;
}

interface ManageDepartmentsProps {
  organizationId: string;
  departments: Department[];
}

export function ManageDepartments({ organizationId, departments }: ManageDepartmentsProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏥");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presetOptions = getDepartmentPresets();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const preset = presetOptions.find((dept) => dept.name === selectedPreset);
      const fd = new FormData();
      fd.append("organizationId", organizationId);
      fd.append("name", (preset?.name ?? name).trim());
      fd.append("icon", preset?.icon ?? icon);
      fd.append("description", (preset?.description ?? description).trim());
      await createDepartment(fd);
      setName("");
      setDescription("");
      setIcon("🏥");
      setSelectedPreset("");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const fd = new FormData();
      fd.append("departmentId", id);
      await deleteDepartment(fd);
      router.refresh();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to delete department");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-base font-bold text-[var(--teal-900)]">
            Clinical &amp; Hospital Departments
          </h4>
          <p className="text-xs font-body text-[var(--ink-soft)] mt-0.5">
            Organize doctors and healthcare staff by specialization or medical units.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)]">
        <select
          value={selectedPreset}
          onChange={(e) => {
            const preset = presetOptions.find((item) => item.name === e.target.value);
            setSelectedPreset(e.target.value);
            if (preset) {
              setName(preset.name);
              setDescription(preset.description);
              setIcon(preset.icon);
            }
          }}
          className="flex-1 min-w-[220px] rounded-xl border border-[var(--sage-200)] bg-white px-3.5 py-2 font-body text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
        >
          <option value="">Choose a preset department...</option>
          {presetOptions.map((preset: DepartmentPreset) => (
            <option key={preset.name} value={preset.name}>
              {preset.icon} {preset.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setSelectedPreset("");
            setName("");
            setDescription("");
            setIcon("🏥");
          }}
          className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-white text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Custom
        </button>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-[var(--paper)] border border-[var(--sage-200)]">
        <input
          type="text"
          placeholder="Department name (e.g. Cardiology, Pediatrics)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border border-[var(--sage-200)] bg-white px-3.5 py-2 font-body text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
          required
        />
        <input
          type="text"
          placeholder="Icon (emoji or short text)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-[160px] rounded-xl border border-[var(--sage-200)] bg-white px-3.5 py-2 font-body text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
        />
        <input
          type="text"
          placeholder="Description / Medical focus (optional)"
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
          <span>{loading ? "Adding..." : "Add Department"}</span>
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {departments.length === 0 ? (
        <div className="p-8 text-center bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)]">
          <FolderTree className="w-8 h-8 text-[var(--ink-soft)] mx-auto opacity-40 mb-2" />
          <p className="text-xs font-body text-[var(--ink-soft)]">
            No departments configured yet. Add your first clinical department above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] hover:border-[var(--teal-900)]/40 transition-colors"
            >
              <div className="min-w-0 pr-2 flex items-start gap-2.5">
                <span className="text-lg leading-none">{dept.icon || "🏥"}</span>
                <div>
                  <p className="font-body font-bold text-sm text-[var(--ink)] truncate">{dept.name}</p>
                  {dept.description && (
                    <p className="text-xs text-[var(--ink-soft)] font-body line-clamp-1 mt-0.5">
                      {dept.description}
                    </p>
                  )}
                  {dept.head && (
                    <p className="text-[11px] font-mono text-[var(--teal-700)] mt-1">
                      Head: {dept.head.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(dept.id)}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors shrink-0"
                title="Delete Department"
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
