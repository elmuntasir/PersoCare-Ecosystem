# Architecture overview

## Context

This platform is designed and maintained primarily by a solo developer.
The primary architectural objective is **not maximum infrastructure
control**, but **maximum long-term maintainability**. Every technology
choice must justify its existence.

## Principles

1. **Minimize moving parts** — before introducing a new framework,
   language, database, or service, ask: does this significantly
   improve the product? If not, don't add it.
2. **Managed services first** — Postgres, auth, object storage,
   hosting, and monitoring are delegated to managed providers wherever
   practical. Infrastructure management should be invisible to both
   users and the developer.
3. **One language wherever possible** — TypeScript across frontend,
   backend, mobile, desktop, and business logic. A second language is
   only introduced when a genuine, unavoidable requirement demands it
   (see ADR-0003 for the one exception considered and rejected).
4. **Standard, mature technologies** — chosen for long-term reliability
   and AI-coding-assistant support, not novelty.

## Product shape

Not a traditional Hospital Management System. Hospitals are the first
tenant type, not the only one. The platform is multi-tenant across:
Hospitals, Clinics, Diagnostic Centers, Pharmacies, Telemedicine
Providers, Laboratories, Medical Professionals, and Patients — all
isolated from each other within one shared platform.

## Surfaces

| Surface | Tech | Why |
|---|---|---|
| Web portal | React + TypeScript + Tailwind | Primary interface for all tenant types |
| Mobile app | React Native + Expo | Patients (booking, records, reminders) and doctors (community posts, patient contact — non-clinical) |
| Desktop workstation | Electron | Front-desk hardware I/O: printers, scanners, card readers — see ADR-0003 |
| API | Express (TypeScript), serverless hosting | Shared by all three client surfaces |

See `tech-stack.md`, `monorepo-structure.md`, `multi-tenancy.md`,
`onboarding-verification.md`, `billing-philosophy.md`, and
`ai-strategy.md` for detail on each area.
