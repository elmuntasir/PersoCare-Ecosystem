# ADR-0003: Electron for the desktop workstation, not Tauri

Date: 2026-07-23
Status: Accepted

## Context

The desktop app's actual requirement — the thing a web portal or PWA
cannot do — is local hardware access: receipt/label printers, barcode
and document scanners, and smart-card readers at hospital front desks.
A pure web/PWA approach was rejected early because browsers have no
reliable, cross-platform way to talk to this class of hardware.

## Decision

Electron, branded internally as the "Healthcare Workstation" rather
than a generic desktop app, to reflect that it has capabilities the
browser-based surfaces don't (receipt printing, label printing,
barcode/QR scanning, smart-card reading, TWAIN scanning, webcam,
local printer discovery).

## Alternatives considered

**Tauri** — smaller binaries, lower resource use, and would otherwise
be the natural pick given its lighter footprint. Rejected specifically
because of the hardware requirement: most POS/receipt-printer and
card-reader vendors ship Node.js/Electron sample SDKs (Electron is the
de facto standard in retail/clinic front-desk software), while Tauri's
ecosystem for this is thinner and would often require writing Rust
glue code — a second language, against the one-language principle,
for a case where Electron already avoids that cost entirely.

## Consequences

Electron is heavier (larger installer, more RAM) than Tauri would have
been — accepted trade-off, since the workstation isn't
performance-critical and runs on a fixed front-desk machine, not a
battery-constrained device.

Because Electron runs the React web app inside Chromium, `apps/web`
and `apps/workstation` can share actual UI components — unlike mobile,
which can only share design tokens (see `monorepo-structure.md`).

**Open caveat, not fully resolved by this decision:** printing is
straightforward regardless of framework (Electron's print API,
ESC/POS libraries for receipt printers). Scanners and card readers are
often vendor- and model-specific rather than universally supported —
budget for per-hardware-model testing and set expectations with
hospital clients around certified/supported hardware rather than
promising universal compatibility.

Per the phased rollout, this app is built only once a real hospital
customer needs hardware integration — not built speculatively ahead of
demand.
