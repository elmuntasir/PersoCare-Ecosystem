# PersoCare Ecosystem

A multi-tenant healthcare platform monorepo powered by Turborepo, Next.js, and PostgreSQL (Supabase).

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js (App Router) — `apps/web`
- **Database**: PostgreSQL via [Supabase](https://supabase.com), managed by Prisma 7
- **Package Manager**: pnpm v10+

---

## Prerequisites

- Node.js v18+
- pnpm v10+ (`npm install -g pnpm`)
- A running Supabase project (free tier works — ensure it is **not paused**)

---

## Getting Started

### 1. Install Dependencies

From the root of the repository:

```bash
pnpm install
```

### 2. Configure Environment Variables

The database package already has a `.env` file at `packages/database/.env`. Verify it contains:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

> **Important:** Passwords with special characters (spaces, `!`, `@`, etc.) must be URL-encoded.
> For example: `0 is Silence!` → `0%20is%20Silence%21`

> **Supabase Free Tier Note:** Free projects auto-pause after 7 days of inactivity.
> If you see a connection error, go to [supabase.com/dashboard](https://supabase.com/dashboard),
> find your project, and click **Restore project** before continuing.

### 3. Push the Schema to the Database

Run from the root:

```bash
cd packages/database && npx prisma db push --config prisma.config.ts --schema prisma/schema.prisma
```

This will create all the tables in your Supabase database.

### 4. Generate the Prisma Client

```bash
cd packages/database && npx prisma generate --config prisma.config.ts --schema prisma/schema.prisma
```

### 5. Run the Development Server

From the root of the repository:

```bash
pnpm run dev
```

This starts all apps concurrently:
- **Web** (Next.js): `http://localhost:3000`

---

## Common Commands

| Command | Description |
|---|---|
| `pnpm run dev` | Start all development servers |
| `pnpm run build` | Build all apps and packages |
| `pnpm run lint` | Lint all packages |
| `pnpm run typecheck` | TypeScript checks across the workspace |
| `pnpm run format` | Format all files with Prettier |

---

## Project Structure

```
PersoCare-Ecosystem/
├── apps/
│   └── web/                   # Next.js frontend
│       └── src/
│           ├── app/           # App Router pages
│           ├── components/    # Shared UI components
│           └── utils/         # Auth and helpers
├── packages/
│   └── database/              # Prisma schema + client
│       ├── prisma/
│       │   └── schema.prisma  # Full data model
│       ├── prisma.config.ts   # Prisma 7 config (datasource URL)
│       └── .env               # Database connection strings
└── ZExternal/                 # Architecture docs & design material
    └── PersoCare_Schema_and_Design.md
```