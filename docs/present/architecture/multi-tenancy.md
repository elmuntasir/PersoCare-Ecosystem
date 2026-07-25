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

## Onboarding

See `onboarding-verification.md` for how a new tenant is verified
before activation — this is intentionally **not** a fully automatic
step, unlike the rest of the onboarding flow.
