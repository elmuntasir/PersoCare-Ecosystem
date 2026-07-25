# Documentation

This folder is split into two parts, deliberately.

## `present/`

What governs actual decisions today: the vision, the architecture as it
currently exists, the ADRs explaining why it's built this way, and
operational references (API, deployment).

If it's in `present/`, it should be something you'd actually point to
while writing code this month.

## `future/`

Ideas, ambitions, and things being watched — not commitments, not specs.

**The rule:** something moves from `future/` to `present/` only when
you are about to build it, not when it becomes exciting to think about.
The moment an idea gets a real design doc or an ADR, it graduates.
Until then, it stays here so it doesn't quietly expand today's scope.

---

### Folder map

```
docs/
├── present/
│   ├── vision.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── tech-stack.md
│   │   ├── multi-tenancy.md
│   │   ├── monorepo-structure.md
│   │   ├── onboarding-verification.md
│   │   ├── billing-philosophy.md
│   │   └── ai-strategy.md
│   ├── adr/
│   │   ├── template.md
│   │   ├── 0001-monorepo-package-structure.md
│   │   ├── 0002-mobile-react-native-expo.md
│   │   ├── 0003-desktop-electron-over-tauri.md
│   │   └── 0004-onboarding-verification-approach.md
│   ├── api/
│   │   └── README.md
│   └── deployment/
│       └── README.md
└── future/
    ├── roadmap.md
    └── watchlist.md
```

### Working habit

Any time a new architectural decision is made, add an ADR to
`present/adr/` using `template.md`. Don't rely on memory for "why did we
choose X over Y" — three years from now, memory is gone; the ADR isn't.
