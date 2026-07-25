# AI strategy

AI is treated as a core capability, not an add-on feature — and as
infrastructure the platform depends on, not a single vendor
integration. The platform should never depend on one AI provider;
models evolve, the ecosystem remains.

## Three deployment models

### 1. Bring Your Own Key (BYOK)
Organizations connect their own AI provider (OpenAI, Anthropic,
Google, Grok, OpenRouter, future providers) and pay that provider
directly. The platform only orchestrates requests.

### 2. Marketplace AI agents
Ready-made agents (Medical Assistant, Hospital Receptionist,
Prescription Explainer, Appointment Assistant, Research Assistant,
Pharmacy Assistant) installable in a few clicks. Pricing may be
included with subscription, a separate monthly fee, or usage-based.
Organizations buy capabilities, not models — the underlying
implementation can change without affecting customers.

### 3. Organization AI
Private assistants built on an organization's own internal knowledge
(SOPs, internal policies, drug formularies, clinical guidelines,
training manuals). These remain private to the organization.

## Liability note

Medical-guidance AI agents (Medical Assistant, Prescription Explainer)
are a support and liability surface, not a ship-and-forget feature.
Every model update and every hallucinated detail becomes a support
ticket, or worse. Guardrails required from day one: clear disclaimers,
explicit scope limits, and a human-in-the-loop requirement for
anything prescriptive. This is a launch-blocking concern, not a
polish item — see `future/watchlist.md`.

## Future direction (not committed)

Community-created agents, revenue sharing between creators and
platform, premium AI tools — tracked in `future/roadmap.md`, not
specced here.
