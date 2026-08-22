# Patient-Owned Data & Consent-Gated Cross-Tenant Access

Status: **Designed, not yet implemented.** This doc exists to bring an AI
coding agent (or any new contributor) up to speed on what this specific
piece of work is, why it matters, and what "done" looks like — before any
code is written.

Read `docs/present/architecture/multi-tenancy.md` first for the baseline
multi-tenancy model this modifies.

---

## 1. What we are trying to achieve

Today, `multi-tenancy.md` describes each tenant (hospital, clinic,
pharmacy, etc.) as owning its own Patients, Doctors, Appointments, and
Records — a standard siloed multi-tenant model, the same shape used by
most hospital/clinic SaaS platforms (Practo, athenahealth, DocPlanner,
etc.).

We are changing the ownership model:

- **The patient owns their data, not the tenant.**
- A tenant can freely access data generated *within its own
  relationship* with the patient (e.g. a hospital can see the
  appointments and records it created).
- A tenant can **only** access a patient's data from a *different*
  tenant if the patient has explicitly granted that access.
- This consent boundary applies uniformly — including to AI agents
  (BYOK or marketplace) acting on a tenant's behalf. An AI agent must
  never see cross-tenant patient data the patient hasn't consented to,
  even if the querying tenant is paying for the AI feature.

## 2. Why this matters (the reasoning, not just the rule)

- **It's the honest answer to a real problem.** Patients today have
  fragmented medical histories scattered across every hospital, clinic,
  and pharmacy they've ever visited, with no way to unify or selectively
  share that history. Provider-siloed platforms don't solve this — they
  just add another silo.
- **It's a genuine differentiator**, not a feature checkbox. Most
  multi-tenant healthcare SaaS in this market segment treats "tenant
  isolation" as the end goal (see `multi-tenancy.md`'s framing: "a leak
  of one organization's patient data to another isn't a minor incident,
  it's a company-ending one"). That's still true — this doesn't weaken
  isolation. It adds a second axis: isolation is the *default*, and the
  patient is the one entity who can authorize crossing it.
- **AI makes this urgent, not optional.** Without an explicit consent
  boundary, "AI agent pulls patient context to answer a question" is an
  easy way to accidentally leak cross-tenant PHI — an agent built for
  Tenant A could technically query data belonging to Tenant B's
  relationship with the same patient, because the patient record is the
  same person. Enforcing consent at the same layer AI agents query
  through closes that hole by design rather than by policy.
- **It's defensible, not just aspirational.** This is what separates
  "we have an AI feature" from "we thought carefully about what AI is
  and isn't allowed to see." That distinction matters for a healthcare
  product's credibility (and for anyone evaluating this project
  academically).

## 3. What "done" looks like (minimum implementation)

The bar is a working, demonstrable flow — not a complete consent
management UI. Priority order:

1. **Data model**: a `ConsentGrant` (or equivalent) entity linking
   `patientId`, `granteeTenantId`, scope (which record types are
   covered), status (active/revoked), and timestamps for grant/revoke.
2. **Grant flow**: patient (or patient-facing surface) can grant a
   specific tenant access to their history from another tenant.
3. **Revoke flow**: patient can revoke a previously granted access at
   any time. Revocation takes effect immediately for new queries.
4. **Enforcement at the query layer**: any cross-tenant read of patient
   data — human-initiated or AI-agent-initiated — checks for an active
   `ConsentGrant` before returning data. No cross-tenant read path should
   bypass this check. This is the part most likely to get accidentally
   bypassed by a new feature or a new AI agent — enforce it as close to
   the data-access layer as possible (e.g. in the ORM/query layer or a
   shared authorization middleware), not per-endpoint.
5. **Audit log**: every grant, revoke, and cross-tenant access (successful
   or denied) is logged — who accessed what, under which grant, and when.
   This is what makes the claim "AI respects the same consent boundary"
   verifiable rather than asserted.
6. **AI agent integration**: whichever context-fetching mechanism feeds
   patient data to an AI agent (BYOK or marketplace) must go through the
   same enforcement point as (4) — not a separate, more permissive path.

## 4. What this explicitly does not require (yet)

- A polished patient-facing consent UI — a minimal API/CLI-testable flow
  is enough to demonstrate the mechanism.
- Revocation clawback of already-generated AI outputs (e.g. if an AI
  already summarized data before revocation) — out of scope for now,
  worth flagging as a known limitation rather than solving.
- Cross-jurisdiction legal compliance mapping (HIPAA/GDPR-equivalent
  formalities) — this doc is about the technical mechanism, not the
  legal framework.

## 5. Open Decisions

1. **Category-level vs. Record-level Scope**: Currently `scope: String[]` grants access to an entire category (e.g. `PRESCRIPTIONS`, `HEALTH_HISTORY`). Record-level granularity (granting access to a single specific appointment or prescription) is technically possible but adds significant database and UI complexity. For initial deliverables, category-level scoping is used and record-level scoping is flagged for future iteration.
2. **Expiry Sweep Mechanism**: `ConsentGrant.expiresAt` provides time-boxed consent. Transitioning state from `ACTIVE → EXPIRED` relies on a background scheduled sweep job (identical to the end-of-day queue cleanup job that sets `DID_NOT_VISIT` on stale appointments).

## 6. Relationship to other docs

- Extends: `docs/present/architecture/multi-tenancy.md`
- Interacts with: `docs/present/architecture/ai-strategy.md`
- Governed by ADR: `docs/present/adr/0005-patient-owned-consent-gated-data.md`

