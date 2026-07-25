# Monorepo structure

pnpm workspaces + Turborepo. One repo, one `npm run build` builds all
surfaces. A schema change in Prisma flows through Zod validation into
every client without hand-editing four codebases.

```
apps/
├── api/            — Express backend, serverless
├── web/            — React web portal
├── mobile/         — React Native + Expo
└── workstation/    — Electron desktop app (see architecture/overview.md)

packages/
├── core/
│   ├── types/
│   ├── zod/
│   ├── api-client/
│   ├── design-tokens/
│   ├── permissions/
│   └── utils/
├── database/
│   ├── prisma/
│   ├── migrations/
│   └── seed/
└── config/
    ├── env/
    ├── constants/
    └── feature-flags/
```

See ADR-0001 for why this is three packages, not six or seven, and the
specific condition under which `core` gets split.

## What can and can't be shared

- **`packages/core`** is shared by all four apps — types, Zod schemas,
  API client, and business logic are plain TypeScript with no
  rendering concerns, so they work everywhere.
- **UI components** are shared between `web` and `workstation` only.
  Electron runs the React web app inside Chromium, so these two
  genuinely share one component tree.
- **Mobile does not share UI components** with web/workstation. React
  Native has no DOM — `<View>`/`<Text>`/`StyleSheet` instead of
  `<div>`/`className`. What mobile *does* share is
  `packages/core/design-tokens` (colors, spacing, typography, radius)
  so the look stays consistent even though the implementation doesn't.
