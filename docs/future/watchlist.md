# Watchlist

Things being tracked but not decided. No architecture, no due dates —
just a reason to revisit written down so it isn't relitigated from
scratch each time it comes up.

- **Tauri vs. Electron** — revisit if Electron's bundle size or RAM
  footprint becomes a real, reported complaint from front-desk
  hardware, not a theoretical concern. See ADR-0003.

- **PWA as a lighter public-facing surface** — considered and set
  aside in ADR-0002 in favor of React Native as the primary mobile
  app. Could be worth a lightweight PWA later for a narrow use case
  (e.g. a pure booking link with no app-store friction) — not a
  replacement for the main app.

- **Medical-guidance AI agents (Prescription Explainer, Medical
  Assistant) — liability surface.** Flagged in
  `present/architecture/ai-strategy.md` as needing disclaimers, scope
  limits, and human-in-the-loop review before launch. Track any
  incidents or near-misses here once these agents exist, so the
  guardrails can be tightened based on real cases rather than
  hypotheticals.

- **Multi-tenant isolation strategy (row-level security vs.
  schema-per-tenant)** — open decision, not yet made. Once decided,
  write it up as an ADR and move the summary into
  `present/architecture/multi-tenancy.md`.

- **`packages/core` growth** — watch for the specific split condition
  named in ADR-0001 (AI-related code growing large enough to want its
  own release cadence). Don't split preemptively; do split once that
  condition is actually met.
