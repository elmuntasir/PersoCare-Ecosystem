"use client";

import { Search, X, Building2, Stethoscope, Layers, CalendarCheck } from "lucide-react";

export type ViewTab = "all" | "organizations" | "doctors" | "my_appointments";

interface AppointmentSearchFilterBarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedOrgType: string;
  onOrgTypeChange: (type: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  availableOrgTypes: { code: string; name: string }[];
  availableDepartments: string[];
  totalResults?: number;
  myAppointmentsCount?: number;
}

export function AppointmentSearchFilterBar({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  selectedOrgType,
  onOrgTypeChange,
  selectedDepartment,
  onDepartmentChange,
  availableOrgTypes,
  availableDepartments,
  totalResults = 0,
  myAppointmentsCount = 0,
}: AppointmentSearchFilterBarProps) {
  // Common popular medical specialties for quick pill toggles
  const popularDepartments = [
    "General Medicine",
    "Cardiology",
    "Neurology",
    "Pathology",
    "Ophthalmology",
    "Pediatrics",
    "Dermatology",
    "Orthopedics",
    "Gynecology",
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 md:p-5 shadow-sm space-y-4">
      {/* ── Top Row: Category Tabs & Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Category Tabs */}
        <div className="flex rounded-full overflow-hidden border border-[var(--sage-200)] bg-[var(--paper)] p-1">
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-body font-medium rounded-full transition-all ${
              activeTab === "all"
                ? "bg-[var(--teal-900)] text-white shadow-xs"
                : "text-[var(--ink-soft)] hover:text-[var(--teal-900)] hover:bg-[var(--sage-200)]/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>All Results</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("organizations")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-body font-medium rounded-full transition-all ${
              activeTab === "organizations"
                ? "bg-[var(--teal-900)] text-white shadow-xs"
                : "text-[var(--ink-soft)] hover:text-[var(--teal-900)] hover:bg-[var(--sage-200)]/50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Organizations</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("doctors")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-body font-medium rounded-full transition-all ${
              activeTab === "doctors"
                ? "bg-[var(--teal-900)] text-white shadow-xs"
                : "text-[var(--ink-soft)] hover:text-[var(--teal-900)] hover:bg-[var(--sage-200)]/50"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>Doctors</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("my_appointments")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs md:text-sm font-body font-medium rounded-full transition-all ${
              activeTab === "my_appointments"
                ? "bg-[var(--coral)] text-white shadow-xs"
                : "text-[var(--ink-soft)] hover:text-[var(--coral)] hover:bg-[var(--sage-200)]/50"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span>My Bookings</span>
            {myAppointmentsCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                  activeTab === "my_appointments"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--coral)]/15 text-[var(--coral)]"
                }`}
              >
                {myAppointmentsCount}
              </span>
            )}
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]"
            strokeWidth={1.6}
          />
          <input
            type="text"
            placeholder="Search organization, doctor name, specialization, or area..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9.5 pr-8 py-2 rounded-full border border-[var(--sage-200)] bg-[var(--paper)] font-body text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/70 focus-visible:outline-2 focus-visible:outline-[var(--coral)] transition-colors shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Middle Row: Dropdowns & Filters ── */}
      {activeTab !== "my_appointments" && (
        <div className="pt-2 border-t border-[var(--sage-200)]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Organization Type Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                Type:
              </span>
              <select
                value={selectedOrgType}
                onChange={(e) => onOrgTypeChange(e.target.value)}
                className="rounded-full border border-[var(--sage-200)] px-3.5 py-1.5 font-body text-xs md:text-sm text-[var(--ink)] bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] cursor-pointer"
              >
                <option value="">All Facility Types</option>
                {availableOrgTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department / Specialty Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium">
                Dept:
              </span>
              <select
                value={selectedDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="rounded-full border border-[var(--sage-200)] px-3.5 py-1.5 font-body text-xs md:text-sm text-[var(--ink)] bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] cursor-pointer"
              >
                <option value="">All Departments &amp; Specialties</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear all active filters */}
            {(selectedOrgType || selectedDepartment || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  onOrgTypeChange("");
                  onDepartmentChange("");
                  onSearchChange("");
                }}
                className="text-xs font-mono text-[var(--coral)] hover:underline flex items-center gap-1"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-[var(--ink-soft)]">
            {totalResults > 0 ? (
              <span>
                Found <span className="font-semibold text-[var(--teal-900)]">{totalResults}</span> matches
              </span>
            ) : (
              <span>Type to search...</span>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Specialty Pills ── */}
      {activeTab !== "my_appointments" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-[11px] font-mono text-[var(--ink-soft)]/80 uppercase shrink-0 mr-1">
            Quick Depts:
          </span>
          {popularDepartments.map((dept) => {
            const isSelected = selectedDepartment.toLowerCase() === dept.toLowerCase();
            return (
              <button
                key={dept}
                type="button"
                onClick={() => onDepartmentChange(isSelected ? "" : dept)}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-body transition-colors shrink-0 ${
                  isSelected
                    ? "bg-[var(--teal-900)] text-white font-medium"
                    : "bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/60 hover:text-[var(--ink)]"
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
