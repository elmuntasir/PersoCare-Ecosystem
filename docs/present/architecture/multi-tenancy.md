# Multi-tenant architecture

Every healthcare organization is a tenant. Each tenant owns its own
Doctors, Patients, Staff, Reviews, Appointments, Prescriptions,
Reports, AI Configuration, and Billing Information. Data isolation
between organizations is mandatory and non-negotiable.

Supported organization types (extensible without redesigning the
schema): Hospital, Clinic, Diagnostic Center, Laboratory, Pharmacy,
Telemedicine Provider.

## Why this is a "spend disproportionate care" area

Most bugs are inconvenient. A tenant-isolation bug in a healthcare
platform is not a normal bug — a leak of one organization's patient
data to another isn't a minor incident, it's a company-ending one for
a healthcare product. Row-level security / tenant-scoping deserves more
testing investment than its apparent complexity would otherwise
justify.

> Isolation strategy (row-level security vs. schema-per-tenant) is
> tracked as an open decision — see `adr/template.md` for the format
> to use once it's settled, and add it here once decided.

## Data Ownership & Consent Boundaries

While tenant isolation remains mandatory, data ownership is **patient-centric**:

- Patients own their consolidated health records across tenants.
- Tenant isolation is the default boundary, but patients can explicitly grant cross-tenant access to specific providers.
- Human users and AI agents alike are bound by these consent rules at the query layer.

See [`patient-consent-architecture.md`](file:///Users/mun.rafin/Internship/PersoCare-Ecosystem/docs/present/architecture/patient-consent-architecture.md) and [`ADR-0005`](file:///Users/mun.rafin/Internship/PersoCare-Ecosystem/docs/present/adr/0005-patient-owned-consent-gated-data.md) for the complete specification.

## Onboarding

See `onboarding-verification.md` for how a new tenant is verified
before activation — this is intentionally **not** a fully automatic
step, unlike the rest of the onboarding flow.

