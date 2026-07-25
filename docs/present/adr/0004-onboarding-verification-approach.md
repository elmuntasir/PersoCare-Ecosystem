# ADR-0004: Onboarding verification is OCR-assisted, not fully automatic

Date: 2026-07-23
Status: Accepted

## Context

The product vision calls for near-zero-touch tenant onboarding
(register → subscribe → provision → start operating). That's the
right default for a SaaS product generally. But this platform lets
verified organizations onboard doctors who can prescribe and see real
patients — if anyone can register as a hospital and start operating
immediately, the platform has created a fraud and liability vector,
not just a UX gap.

Investigated whether doctor and facility license verification could be
fully automated via OCR + government registry APIs/lookups.

## Decision

- **Doctor verification**: OCR extracts a registration number from an
  uploaded credential; cross-checked against a registry lookup (e.g.
  BMDC for Bangladesh). Automatic approval on a clean match, automatic
  routing to manual review on any mismatch or lookup failure.
- **Organization/facility verification**: OCR-assisted document
  extraction, but a human approves before the tenant activates. No
  reliable public verification API exists for facility licenses in the
  jurisdictions checked so far.

## Alternatives considered

**Fully automatic onboarding for all tenant types** — rejected.
Fraud/liability risk is asymmetric with the cost of a five-minute
manual check per new organization; automating this away trades a small
amount of founder time for an unbounded downside.

**Fully manual verification for everything, including doctors** —
rejected as unnecessarily slow where a workable (if unofficial)
registry check exists for doctor registration numbers specifically.

## Consequences

Where the only available registry check is an unofficial third-party
wrapper around a government website (no published API, no SLA), treat
it as a best-effort first-pass filter, not a source of truth — never
auto-approve solely because a check errored out or timed out; always
fail toward manual review, not toward approval.

This manual step is a five-minute task per new tenant, not a recurring
maintenance burden, so it doesn't meaningfully compromise the
low-maintenance goal — it's simply not literally zero, and shouldn't
be described as such externally.
