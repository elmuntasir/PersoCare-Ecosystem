# ADR-0002: React Native + Expo for mobile

Date: 2026-07-23
Status: Accepted

## Context

Mobile app is primarily patient-facing (booking, records, reminders)
plus lightweight doctor features (community posts, patient contact) —
not formal clinical data-entry workflows. Needs to ship on both iOS
and Android, maintained solo, in TypeScript per the one-language
principle.

## Decision

React Native, using Expo's managed workflow and EAS Build.

## Alternatives considered

**Flutter** — comparable UX quality, but introduces Dart, a second
language. Violates the one-language principle for no offsetting
benefit given the app's actual requirements (mostly CRUD, social feed,
booking, notifications — not performance-critical native rendering).

**Native (Swift + Kotlin separately)** — most engineering effort of
any option, two additional languages, and no code sharing with the
web/backend TypeScript codebase. Rejected outright for a solo
developer.

**Progressive Web App only** — considered and rejected as the sole
mobile solution because push notifications, deep linking, and
background behavior are meaningfully worse/less reliable than a real
app, especially on iOS. (A PWA may still be worth revisiting for a
lighter public-facing surface — see `future/watchlist.md`.)

## Consequences

Expo removes Gradle, CocoaPods, Xcode/Android Studio, and manual
certificate/signing management from day-to-day work — EAS Build
handles cloud builds without a local Mac. This is a large maintenance
reduction for a solo developer specifically. Trade-off: some native
modules outside Expo's managed workflow require ejecting or a config
plugin; acceptable given the app's current scope doesn't need deep
native hardware access (that requirement lives in the desktop
workstation instead — see ADR-0003).
