"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Search,
  Loader2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { createOrganization } from "@/actions/admin/createOrganization";
import { getOrganizationTypes } from "@/actions/admin/organizationTypes";

interface OrgType {
  id: string;
  name: string;
  code: string;
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [types, setTypes] = useState<OrgType[]>([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [logo, setLogo] = useState("");
  const [motto, setMotto] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");

  useEffect(() => {
    async function loadTypes() {
      try {
        const result = await getOrganizationTypes();
        setTypes(result);
        if (result.length > 0) setTypeId(result[0].id);
      } catch {
        setError("Failed to load organization types.");
      }
    }
    loadTypes();
  }, []);

  // Geocode address via OpenStreetMap Nominatim
  const geocodeAddress = async () => {
    if (!address.trim()) {
      setError("Please enter a street or city address first.");
      return;
    }

    setGeocoding(true);
    setError(null);

    try {
      const encoded = encodeURIComponent(address.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const resData = await response.json();

      if (resData && resData.length > 0) {
        const { lat, lon } = resData[0];
        setLatitude(lat);
        setLongitude(lon);
      } else {
        setError("Coordinates could not be found for this address. Please refine or enter manually.");
      }
    } catch {
      setError("Geocoding lookup failed. Please check network connection.");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("organizationTypeId", typeId);
      formData.append("specialties", specialties);
      formData.append("address", address);
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);
      if (logo) formData.append("logo", logo);
      if (motto) formData.append("motto", motto);
      if (vision) formData.append("vision", vision);
      if (mission) formData.append("mission", mission);
      if (establishedYear) formData.append("establishedYear", establishedYear);

      await createOrganization(formData);
      router.push("/dashboard/organization");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/dashboard/organization"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organization
        </Link>

        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-[var(--teal-900)] flex items-center justify-center">
              <Building2 className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <h1 className="font-display text-3xl text-[var(--teal-900)] font-bold tracking-tight">
              Create Organization
            </h1>
          </div>
          <p className="font-body text-sm text-[var(--ink-soft)] ml-13">
            Register your institution to start coordinating clinical operations, appointments, and doctors.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-sm space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-body">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Organization Name */}
          <div>
            <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dhaka Medical College Hospital"
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
              required
            />
          </div>

          {/* Organization Type */}
          <div>
            <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
              Organization Type *
            </label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
              required
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Specialties */}
          <div>
            <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
              Medical Specialties
            </label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="e.g. Cardiology, Orthopedics, Pediatrics (comma separated)"
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
            />
            <p className="text-[11px] text-[var(--ink-soft)] font-mono mt-1">
              Separate multiple specialties with commas
            </p>
          </div>

          {/* Profile */}
          <div className="pt-4 border-t border-[var(--sage-200)]/80 space-y-4">
            <div className="flex items-center gap-2 text-[var(--teal-900)]">
              <Sparkles className="w-4 h-4 text-[var(--coral)]" />
              <h3 className="font-display text-lg font-semibold">Organization Profile</h3>
            </div>

            <div>
              <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
                Logo URL
              </label>
              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
                  Motto
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Compassion with excellence"
                  className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
                  Established Year
                </label>
                <input
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="1965"
                  className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
                Vision
              </label>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Describe the long-term vision for the institution."
                rows={3}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
                Mission
              </label>
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Summarize how the organization delivers care."
                rows={3}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="pt-4 border-t border-[var(--sage-200)]/80 space-y-4">
            <div className="flex items-center gap-2 text-[var(--teal-900)]">
              <MapPin className="w-4 h-4 text-[var(--coral)]" />
              <h3 className="font-display text-lg font-semibold">Location &amp; Geocoding</h3>
            </div>

            <div>
              <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1.5 uppercase tracking-wide font-mono">
                Full Physical Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 81, Block E, Bashundhara R/A, Dhaka"
                  className="flex-1 rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={geocodeAddress}
                  disabled={geocoding}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--teal-900)] text-white text-xs font-semibold hover:bg-[var(--teal-700)] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {geocoding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Geocode
                </button>
              </div>
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1 uppercase tracking-wide font-mono">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 23.8103"
                  className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-[var(--ink)] block mb-1 uppercase tracking-wide font-mono">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 90.4125"
                  className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2 font-body text-sm text-[var(--ink)] focus:outline-hidden focus:border-[var(--coral)] focus:bg-white transition-all"
                />
              </div>
            </div>
            <p className="text-[11px] font-mono text-[var(--ink-soft)]">
              Geocoding auto-fills coordinates so patients can navigate directly using Google Maps.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--sage-200)]/80">
            <Link
              href="/dashboard/organization"
              className="px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--coral)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Organization...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
