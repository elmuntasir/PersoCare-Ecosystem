# ADR-0001: Monorepo package structure — three packages, not six

Date: 2026-07-23
Status: Accepted

## Context

The platform spans four apps (api, web, mobile, workstation) that need
to share types, validation, and business logic without duplicating
them four times. The natural instinct — one package per concern
(core, database, api-client, ui, auth, ai, config) — mirrors how a
larger engineering team would structure this.

But the project's own first principle is: every technology (and, by
extension, every package) must justify its existence. A package is
another thing to version, configure, test, and maintain. For a solo
developer, premature package separation is a form of over-engineering:
more `package.json` files, more path-mapping config, more places a
circular dependency can form, before a single feature has proven the
boundary is actually needed.

## Decision

Start with three packages:

```
packages/
├── core/       (types, Zod schemas, API client, design tokens, permissions, utils)
├── database/   (Prisma schema, generated client, migrations, seed)
└── config/     (env vars, constants, feature flags)
```

`core` intentionally holds several concerns together rather than being
pre-split into `types`, `zod`, `api-client`, `ui`, `auth`, and `ai` as
separate packages.

## Alternatives considered

**Six-to-seven package split (core / database / api-client / ui / auth
/ ai / config)** — rejected. This is the correct structure *eventually*,
for a larger team, but drawing those boundaries today is a guess based
on anticipated usage, not observed usage. If the guess is wrong, the
cost is a mid-project package-boundary refactor at the same time as
feature work — worse than starting with fewer packages and splitting
when a real pain point names itself.

**Single package doing everything (including database and config)** —
rejected. Database (Prisma codegen, migrations) and config (env/flags)
are genuinely different concerns from hand-written types and business
logic, and mixing them creates unnecessary coupling and noisy diffs.

## Consequences

`core` will grow. That's expected and acceptable up to a point. Split
`core` only when there's a concrete, observed reason — e.g., "the
mobile app is pulling in AI-provider code it doesn't use" — not on a
schedule and not because it "feels big." The first candidate for
extraction, if it happens, is `packages/ai`, if AI-related code grows
large enough to warrant its own release cadence.
