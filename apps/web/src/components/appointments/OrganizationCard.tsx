"use client";

import Link from "next/link";
import { Building2, MapPin, Star, Users, ArrowRight, ShieldCheck } from "lucide-react";
import type { SearchOrganizationResult } from "@/actions/appointments/search";

interface OrganizationCardProps {
  organization: SearchOrganizationResult;
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <div className="group bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
      <div>
        {/* Header: Icon, Name, Verified Badge, Type */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[var(--teal-900)]/10 text-[var(--teal-900)] flex items-center justify-center shrink-0 group-hover:bg-[var(--teal-900)] group-hover:text-white transition-colors">
            <Building2 className="w-6 h-6" strokeWidth={1.7} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/dashboard/appointments/organization/${organization.slug}`}
                className="font-display text-lg font-bold text-[var(--teal-900)] hover:text-[var(--coral)] transition-colors truncate block"
              >
                {organization.name}
              </Link>
              <span className="inline-flex items-center text-emerald-600" title="Verified Healthcare Provider">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs font-body">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] font-mono">
                {organization.type}
              </span>
              <span className="text-[var(--ink-soft)]">·</span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                <span className="font-semibold text-[var(--ink)]">
                  {organization.rating > 0 ? organization.rating.toFixed(1) : "New"}
                </span>
                <span className="text-[var(--ink-soft)]">({organization.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        {organization.address && (
          <div className="mt-3 flex items-start gap-2 text-xs text-[var(--ink-soft)] font-body">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--coral)]" strokeWidth={1.8} />
            <span className="line-clamp-2">{organization.address}</span>
          </div>
        )}

        {/* Specialties Tags */}
        {organization.specialties && organization.specialties.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {organization.specialties.slice(0, 4).map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--sage-200)] text-[11px] font-body text-[var(--ink-soft)]"
              >
                {spec}
              </span>
            ))}
            {organization.specialties.length > 4 && (
              <span className="px-1.5 py-0.5 text-[11px] font-mono text-[var(--ink-soft)]">
                +{organization.specialties.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Doctors Available & View Action */}
      <div className="mt-5 pt-3 border-t border-[var(--sage-200)]/70 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--ink-soft)]">
          <Users className="w-3.5 h-3.5 text-[var(--teal-900)]" strokeWidth={1.8} />
          <span>
            <strong className="text-[var(--ink)] font-semibold">{organization.doctorsCount}</strong> practicing doctor
            {organization.doctorsCount !== 1 ? "s" : ""}
          </span>
        </div>

        <Link
          href={`/dashboard/appointments/organization/${organization.slug}`}
          className="inline-flex items-center gap-1 text-xs font-body font-semibold text-[var(--coral)] group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Showcase</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
