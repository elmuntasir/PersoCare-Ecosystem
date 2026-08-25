"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Stethoscope,
  Activity,
  Layers,
  Sparkles,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  searchAppointments,
  type SearchAppointmentsResult,
  type SearchDoctorResult,
  type DoctorAffiliatedOrg,
} from "@/actions/appointments/search";
import { getMyAppointments, type PatientAppointmentItem } from "@/actions/appointments/getMyAppointments";
import {
  AppointmentSearchFilterBar,
  type ViewTab,
} from "@/components/appointments/AppointmentSearchFilterBar";
import { OrganizationCard } from "@/components/appointments/OrganizationCard";
import { DoctorCard } from "@/components/appointments/DoctorCard";
import { MyAppointmentsSection } from "@/components/appointments/MyAppointmentsSection";
import { BookAppointmentModal } from "@/components/appointments/BookAppointmentModal";

export function PatientAppointmentsView() {
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedOrgType, setSelectedOrgType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [page, setPage] = useState(1);

  const [searchResults, setSearchResults] = useState<SearchAppointmentsResult | null>(null);
  const [myAppointments, setMyAppointments] = useState<PatientAppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [bookingTarget, setBookingTarget] = useState<{
    doctor: SearchDoctorResult;
    org: DoctorAffiliatedOrg;
  } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch search results & my appointments
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("query", debouncedSearch);
      formData.append("organizationType", selectedOrgType);
      formData.append("department", selectedDepartment);
      formData.append("page", String(page));
      formData.append("limit", "20");

      const [searchData, apptsData] = await Promise.all([
        searchAppointments(formData),
        getMyAppointments().catch(() => []),
      ]);

      setSearchResults(searchData);
      setMyAppointments(apptsData);
    } catch (err: any) {
      setError(err.message || "Failed to load appointment search results");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedOrgType, selectedDepartment, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookAtOrg = (doctor: SearchDoctorResult, org: DoctorAffiliatedOrg) => {
    setBookingTarget({ doctor, org });
  };

  const totalResults =
    (searchResults?.pagination.totalOrgs || 0) + (searchResults?.pagination.totalDoctors || 0);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-6">
        {/* ── Search & Filter Controls ── */}
        <AppointmentSearchFilterBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedOrgType={selectedOrgType}
          onOrgTypeChange={(type) => {
            setSelectedOrgType(type);
            setPage(1);
          }}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={(dept) => {
            setSelectedDepartment(dept);
            setPage(1);
          }}
          availableOrgTypes={searchResults?.availableOrgTypes || []}
          availableDepartments={searchResults?.availableDepartments || []}
          totalResults={totalResults}
          myAppointmentsCount={myAppointments.length}
        />

        {/* ── Summary Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[var(--sage-200)] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                Organizations
              </p>
              <p className="text-xl font-display font-bold text-[var(--teal-900)]">
                {searchResults?.pagination.totalOrgs ?? 0}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[var(--sage-200)] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                Doctors
              </p>
              <p className="text-xl font-display font-bold text-emerald-800">
                {searchResults?.pagination.totalDoctors ?? 0}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[var(--sage-200)] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                Specialties
              </p>
              <p className="text-xl font-display font-bold text-amber-800">
                {searchResults?.availableDepartments.length ?? 0}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[var(--sage-200)] shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--coral)]/10 text-[var(--coral)] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                My Bookings
              </p>
              <p className="text-xl font-display font-bold text-[var(--coral)]">
                {myAppointments.length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-body">
            ⚠️ {error}
          </div>
        )}

        {/* ── Main Content Area ── */}
        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-40 bg-white rounded-2xl border border-[var(--sage-200)] animate-pulse" />
            <div className="h-40 bg-white rounded-2xl border border-[var(--sage-200)] animate-pulse" />
          </div>
        ) : activeTab === "my_appointments" ? (
          <MyAppointmentsSection appointments={myAppointments} onRefresh={loadData} />
        ) : (
          <div className="space-y-8">
            {/* 1. Organizations Section */}
            {(activeTab === "all" || activeTab === "organizations") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-[var(--teal-900)] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--teal-900)]" />
                    <span>Healthcare Facilities &amp; Organizations</span>
                  </h2>
                  <span className="text-xs font-mono text-[var(--ink-soft)]">
                    {searchResults?.organizations.length || 0} shown
                  </span>
                </div>

                {searchResults?.organizations.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-8 text-center text-xs text-[var(--ink-soft)] font-body">
                    No healthcare facilities matched your query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {searchResults?.organizations.map((org) => (
                      <OrganizationCard key={org.id} organization={org} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Doctors Section (With BD Multi-Org Support) */}
            {(activeTab === "all" || activeTab === "doctors") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-[var(--teal-900)] flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[var(--teal-900)]" />
                    <span>Specialist Doctors &amp; Chambers</span>
                  </h2>
                  <span className="text-xs font-mono text-[var(--ink-soft)]">
                    {searchResults?.doctors.length || 0} shown
                  </span>
                </div>

                {searchResults?.doctors.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-8 text-center text-xs text-[var(--ink-soft)] font-body">
                    No doctors found matching your criteria. Try adjusting the search or department filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {searchResults?.doctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.id}
                        doctor={doctor}
                        onBookAtOrganization={handleBookAtOrg}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Results at All */}
            {searchResults?.organizations.length === 0 && searchResults?.doctors.length === 0 && (
              <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center shadow-xs">
                <p className="text-base font-display font-bold text-[var(--teal-900)] mb-1">
                  No matching facilities or doctors found
                </p>
                <p className="text-xs font-body text-[var(--ink-soft)] mb-4">
                  Try clearing the search text or switching to another department filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedOrgType("");
                    setSelectedDepartment("");
                  }}
                  className="px-5 py-2 rounded-full bg-[var(--teal-900)] text-white text-xs font-body font-semibold hover:bg-[var(--teal-700)] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {searchResults && searchResults.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-full border border-[var(--sage-200)] bg-white text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-[var(--ink-soft)] px-3">
                  Page {page} of {searchResults.pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(searchResults.pagination.totalPages, p + 1))}
                  disabled={page >= searchResults.pagination.totalPages}
                  className="p-2 rounded-full border border-[var(--sage-200)] bg-white text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {bookingTarget && (
        <BookAppointmentModal
          doctor={{
            id: bookingTarget.doctor.id,
            name: bookingTarget.doctor.name,
            specialization: bookingTarget.doctor.specialization,
          }}
          organization={{
            id: bookingTarget.org.id,
            name: bookingTarget.org.name,
          }}
          schedule={{
            scheduleId: bookingTarget.org.scheduleId,
            workingDays: bookingTarget.org.workingDays,
            startTime: bookingTarget.org.startTime,
            endTime: bookingTarget.org.endTime,
            approvalMode: bookingTarget.org.approvalMode,
            consultationFee: bookingTarget.org.consultationFee,
          }}
          onClose={() => setBookingTarget(null)}
          onSuccess={() => {
            setBookingTarget(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
