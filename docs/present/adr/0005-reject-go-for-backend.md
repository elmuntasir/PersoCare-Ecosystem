# ADR-0005: TypeScript remains the backend language; Go rejected for now

Date: 2026-07-23
Status: Accepted

## Context

A senior developer recommended adopting Go for backend work,
citing futureproofing. Worth evaluating seriously since Go is a
legitimately strong choice for many backends — the question is
whether it fits this project's actual constraints.

## Decision

Keep the backend in TypeScript (Express, per `tech-stack.md`). Do not
introduce Go as a general-purpose backend language.

## Alternatives considered

**Adopt Go for the primary API** — rejected. Two compounding costs:

1. Breaks the mechanism `packages/core` depends on — Zod schemas and
   types shared across web/mobile/workstation/API only work because
   everything is TypeScript. A Go API means duplicating validation
   logic across languages, or adding a schema-sharing/codegen tool
   between Go and TS — itself a new moving part, against Principle 1.
2. A second language for a team of one, which Principle 3 exists
   specifically to avoid, for a performance problem the platform does
   not currently have. The actual workload (CRUD, AI-provider
   orchestration, Postgres queries) is I/O-bound, not CPU-bound — the
   class of problem where Go's concurrency model provides a real
   advantage over Node.

## Consequences

This is not a permanent rejection of Go, only of Go as the *default*
backend language absent a specific need. Revisit only when a **named,
concrete workload** is identified as genuinely CPU-bound and
measurably beyond what Node/TypeScript can handle — e.g. a specific
heavy image-processing pipeline, not a general performance worry. If
that happens, extract that one workload as a standalone Go service
behind the API, rather than rewriting the primary backend. This
mirrors the existing exception already carved out for Python/ML
workloads in `tech-stack.md`.
