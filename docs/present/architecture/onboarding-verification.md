# Onboarding and verification

## The onboarding flow (mostly automated)

1. Organization registers
2. Organization selects organization type
3. Organization estimates expected patient volume
4. Platform recommends a subscription plan
5. Online payment completed
6. Tenant provisioned automatically
7. Organization begins using the platform

## The one deliberately manual step: verification

Full "zero-touch" onboarding is not appropriate here, even though it's
technically achievable. If anyone can register as "General Hospital"
and immediately start seeing patients or issuing prescriptions through
the platform, that's a fraud and liability vector — not just a UX
question.

### Doctor verification — mostly automatable

- OCR extracts the registration number from an uploaded credential.
- Cross-check against a registry lookup (e.g. BMDC for Bangladesh).
- Match → auto-approve. Mismatch or lookup failure → queue for manual
  review.
- **Caveat:** where only an unofficial third-party wrapper of a
  government registry exists (no published API, no SLA), treat it as a
  best-effort first-pass check, not a source of truth. Always have a
  manual-review fallback path when the check errors or times out —
  never auto-approve on a failed check.

### Organization / facility verification — not automatable yet

No public verification API exists for hospital/facility licenses in
most jurisdictions we've checked. This step is **OCR-assisted,
human-approved**: the document is extracted and pre-filled, but a
person confirms it. This is a five-minute task per tenant, not an
ongoing maintenance burden — it doesn't compromise the "low
maintenance" goal, it just isn't literally zero.

### Standing rule

Keep a human-approval gate on first activation of any tenant. A valid
doctor's license and "this person is authorized to represent this
hospital's account" are two different claims — only one of them has a
registry to check against.
