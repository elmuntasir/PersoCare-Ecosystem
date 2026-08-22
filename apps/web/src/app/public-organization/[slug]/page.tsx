import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Building2, QrCode, CalendarDays, IdCard } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function PublicOrganizationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};

  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      logo: true,
      specialties: true,
      motto: true,
      vision: true,
      mission: true,
      verificationStatus: true,
      organizationType: { select: { name: true, code: true } },
      aiConfiguration: {
        select: {
          qrLevels: true,
          qrUseCases: true,
        },
      },
      departments: {
        select: { id: true },
      },
      employees: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!organization) {
    notFound();
  }

  const queryLevels = parseCsv(readParam(query.levels));
  const queryUseCases = parseCsv(readParam(query.useCases));
  const qrLevels = queryLevels.length
    ? queryLevels
    : Array.isArray(organization.aiConfiguration?.qrLevels)
      ? (organization.aiConfiguration.qrLevels as string[])
      : ["organization"];
  const qrUseCases = queryUseCases.length
    ? queryUseCases
    : Array.isArray(organization.aiConfiguration?.qrUseCases)
      ? (organization.aiConfiguration.qrUseCases as string[])
      : ["booking"];

  const bookingUrl = `/public-book?orgId=${organization.id}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(17,94,89,0.08),_transparent_34%),linear-gradient(180deg,var(--paper),#fbfdfc)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--sage-200)] bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {organization.logo ? (
                <div
                  role="img"
                  aria-label={`${organization.name} logo`}
                  className="h-18 w-18 rounded-2xl border border-[var(--sage-200)] bg-center bg-cover bg-no-repeat"
                  style={{ backgroundImage: `url(${organization.logo})` }}
                />
              ) : (
                <div className="flex h-18 w-18 items-center justify-center rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] text-[var(--teal-900)]">
                  <Building2 className="h-9 w-9" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--teal-900)]">
                    Public organization
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-700">
                    {organization.verificationStatus}
                  </span>
                </div>
                <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--teal-900)] md:text-4xl">
                  {organization.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
                  {organization.motto || "Public access point for booking and organization details."}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--teal-900)] shadow-sm">
                  <QrCode className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">Scan target</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">Booking + profile landing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--sage-200)] p-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Address</p>
              <p className="mt-2 text-sm text-[var(--ink)]">{organization.address || "Address not provided"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Type</p>
              <p className="mt-2 text-sm text-[var(--ink)]">{organization.organizationType.name}</p>
            </div>
            <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Counts</p>
              <p className="mt-2 text-sm text-[var(--ink)]">
                {organization.departments.length} departments · {organization.employees.length} active staff
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[var(--coral)]" />
                <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">What this QR opens</h2>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">Booking</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Opens the public appointment booking flow without requiring a login.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">Profile</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Shows the organization profile, specialties, and public-facing context.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {qrUseCases.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--sage-200)] bg-[var(--paper)] px-3 py-1 text-xs font-mono text-[var(--teal-900)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-[var(--coral)]" />
                <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">Organization story</h2>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {organization.vision && (
                  <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 md:col-span-2">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Vision</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">{organization.vision}</p>
                  </div>
                )}
                {organization.mission && (
                  <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 md:col-span-2">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Mission</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">{organization.mission}</p>
                  </div>
                )}
                <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4 md:col-span-2">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">Specialties</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {organization.specialties.length > 0 ? (
                      organization.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink)] border border-[var(--sage-200)]"
                        >
                          {specialty}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--ink-soft)]">No specialties listed yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">Quick actions</h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                This is the public entry point for the QR code. Visitors can book immediately or review the profile.
              </p>

              <div className="mt-5 space-y-3">
                {qrUseCases.includes("booking") && (
                  <Link
                    href={bookingUrl}
                    className="inline-flex w-full items-center justify-between rounded-2xl bg-[var(--teal-900)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Book an appointment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {qrUseCases.includes("profile") && (
                  <a
                    href="#profile"
                    className="inline-flex w-full items-center justify-between rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--teal-900)] transition-colors hover:bg-white"
                  >
                    View public profile
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </section>

            <section
              id="profile"
              className="rounded-[1.75rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm"
            >
              <h2 className="font-display text-2xl font-bold text-[var(--teal-900)]">Public profile</h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                The QR can also expose the profile-first experience, which is useful for referrals and front desk sharing.
              </p>

              <div className="mt-4 rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">QR levels</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {qrLevels.map((level) => (
                    <span
                      key={level}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink)] border border-[var(--sage-200)]"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
