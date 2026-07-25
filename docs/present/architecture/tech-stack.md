# Technology stack

## Frontend (web)
- React
- TypeScript
- Tailwind CSS

## Mobile
- React Native
- Expo (managed workflow, EAS Build for cloud-based iOS/Android builds
  without a local Mac or manual signing pipeline)

## Desktop (workstation)
- Electron
- Chosen specifically for hardware peripheral support (see ADR-0003)

## Backend
- TypeScript
- Express.js (or equivalent lightweight framework)
- Managed serverless hosting

## ORM / Database
- Prisma
- PostgreSQL, managed through a cloud database provider

## Validation
- Zod — schemas shared across web, mobile, desktop, and API via
  `packages/core`

## Authentication
- Managed authentication service. Not implemented manually unless a
  compelling business requirement emerges.

## File storage
- Managed object storage, for reports, prescriptions, medical images,
  and documents

## Hosting
- Managed serverless deployment platform. Infrastructure management
  stays invisible to users and developer alike.

## What we deliberately avoid (for now)
- Kubernetes, self-managed Docker clusters
- RabbitMQ, Elasticsearch (until a specific, justified need arises)
- Multiple backend languages
- Self-hosted infrastructure

## Understanding "serverless" here

Serverless does not eliminate the backend. The application still
provides authentication, scheduling, review submission, prescription
management, report delivery, multi-tenant authorization, payment
processing, and AI features. The difference is that the hosting
provider manages the infrastructure — patching, OS updates, scaling —
rather than the developer.
