import os

schema_path = os.path.abspath("packages/database/prisma/schema.prisma")
design_path = os.path.abspath("design.md")

with open(schema_path, "r", encoding="utf-8") as f:
    schema = f.read()

content = f"""# PersoCare Ecosystem — Design & Architecture System

This document serves as the **authoritative architectural, design system, and database reference** for the PersoCare Ecosystem. Any AI agent, developer, or automated process building new apps, sub-features, or services within this repository MUST follow these specifications to maintain 100% uniformity in design, technology, security, and data modeling.

---

## 1. Core Technology Stack

The repository is structured as a **Monorepo** managed with **pnpm workspaces** and **Turborepo**.

- **Package Manager & Monorepo**: `pnpm` (v10+), `Turborepo` (v2.5+)
- **Frontend Framework**: Next.js 16 (React 19, App Router, TypeScript 5)
- **Database & ORM**: PostgreSQL with Prisma ORM (`@prisma/client` & `@prisma/adapter-pg` v7.9+) housed in `packages/database`
- **Authentication & Backend Services**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Styling Engine**: Tailwind CSS v4 + Native CSS Custom Properties (`globals.css`)
- **Fonts**: Google Fonts (`Fraunces`, `Inter`, `IBM Plex Mono`)

---

## 2. UI & Design System Guidelines

PersoCare utilizes a warm, clinical, yet highly empathetic aesthetic. Avoid generic component libraries or cold, plain dark modes. Use clean paper canvases, rich deep teals, organic sage accents, and energetic coral calls-to-action.

### 2.1 Color Tokens & Palette

Define and use the exact CSS variables specified in `apps/web/src/app/globals.css`:

```css
:root {{
  --teal-900: #0f3b34;   /* Primary Brand Dark / Deep Header Teal */
  --teal-700: #1b5a4f;   /* Hover state for primary buttons */
  --sage-200: #d9e5de;   /* Card Borders, Subtle Dividers, Soft Accents */
  --paper:    #f7f8f6;   /* Main Page Canvas Background (Warm off-white) */
  --coral:    #e8604a;   /* Primary Accent / Action CTAs / Highlights */
  --ink:      #17211e;   /* Primary Text Color */
  --ink-soft: #4a5852;   /* Secondary / Muted Text Color */

  --font-display: 'Fraunces', serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;
}}
```

### 2.2 Typography Rules

1. **Display / Headings (`h1`, `h2`, `h3`, `.font-display`)**:
   - Font Family: `Fraunces` (serif)
   - Color: `var(--teal-900)`
   - Letter Spacing: `-0.01em`
2. **Body Text**:
   - Font Family: `Inter` (sans-serif)
   - Color: `var(--ink)` for high readability or `var(--ink-soft)` for explanatory captions.
3. **Badges / Section Tags / Metadata (`.font-mono`)**:
   - Font Family: `IBM Plex Mono`
   - Use uppercase/lowercase labels with `var(--coral)` or muted ink tones for technical metadata, queue numbers, or status indicators.

### 2.3 Component & Styling Patterns

- **Page Background**: `bg-[var(--paper)]` on `<main>` or root containers.
- **Buttons**:
  - *Primary Action*: `bg-[var(--coral)] text-white hover:opacity-90 rounded-full font-medium transition-opacity`
  - *Secondary / Dark*: `bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] rounded-full font-medium transition-colors`
  - *Outline*: `border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] rounded-full font-medium transition-colors`
- **Cards & Containers**:
  - Background: `bg-white`
  - Border: `border border-[var(--sage-200)]`
  - Radius: `rounded-2xl` or `rounded-xl`
  - Shadow: `shadow-sm` or `shadow-xl` for elevated cards.
- **Focus Rings**: Accessible focus outlines must always be preserved:
  ```css
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {{
    outline: 2px solid var(--coral);
    outline-offset: 2px;
    border-radius: 4px;
  }}
  ```
- **Signature Animations**:
  - `.pulse-line`: An animated SVG line representing health pulses (`stroke: var(--coral)`, animated with `@keyframes draw-pulse`).
- **Icons**:
  - Use custom inline SVG icons styled with `stroke="currentColor"`, `strokeWidth="1.6"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

---

## 3. Database Schema & Data Architecture

The database model is centered in `packages/database/prisma/schema.prisma` using PostgreSQL.

### 3.1 Key Domain Modules Summary

1. **Identity & Authority**:
   - `User`: Primary user model linked with Supabase Auth (`authId`).
   - `PlatformOwner`: Super-admin role designation.
   - `ProfessionType`, `UserProfession`, `ProfessionDocument`, `DoctorCredential`, `PhysiotherapistCredential`, `RadiologistCredential`: Modular, verified medical practitioner credentials.
   - `UserSettings`: User preferences (confirmation modals, notifications, language, theme).

2. **Organizations & RBAC**:
   - `Organization`, `OrganizationType`: Hospitals, clinics, pharmacies.
   - `Role`, `Permission`, `RolePermission`, `OrganizationMembership`: Fine-grained role-based access control per organization.

3. **Patient Health & Lifestyle Tracking**:
   - `PatientProfile`: Blood type, emergency contacts, insurance.
   - `ClinicalMeasurement`: Vitals, HbA1c, BP, Lipid panel.
   - `HealthHistoryEvent`, `HealthHistoryDocument`: Medical history, surgeries, illnesses.
   - `MonitoringPlan`, `MonitoringLog`, `MonitoringType`: Remote patient monitoring and threshold tracking.
   - `Routine`, `RoutineItem`, `ActivityLog`, `RoutineCompletion`: Daily lifestyle tracking (Medicine, Food, Steps, Exercise).
     - **Time Windows**: `RoutineItem` includes `startTime` and `endTime` (e.g. `"07:00"`–`"09:00"`).
     - **Completion Timestamp**: `RoutineCompletion` stores `completedAt` to derive runtime statuses:
       - **Done**: `completedAt` <= `endTime` (Green)
       - **Late**: `completedAt` > `endTime` (Yellow)
       - **Missed**: No completion record + current time > `endTime` (Red)
       - **Pending**: Within or before time window + no completion record.

4. **Food Catalog & Nutrition Architecture**:
   - `Food`: Whole/core food items catalog with nutrient breakdowns (`caloriePerG`, `proteinMgPerG`, `fatMgPerG`, `carbMgPerG`, `vitaminMgPerG`, `mineralMgPerG`, `waterMgPerG`).
   - `FoodCategory`: `MEAT`, `POULTRY`, `FISH`, `EGG`, `DAIRY`, `FRUIT`, `VEGETABLE`, `LEGUME`, `GRAIN`, `NUT_SEED`, `OTHER`.
   - `FoodSource`: Primary USDA FoodData Central foundation items (`USDA`), Bengali local seed list (`LOCAL_SEED`), or fallback user additions (`USER_SUBMITTED`).
   - `MealItemFood`: Connects meal slots (`RoutineItem`) to catalog items with portion weights in grams.
   - `FoodLogEntry`: Daily logged consumption entries for nutrition analytics.

5. **Blood Donation System**:
   - `BloodDonorProfile`, `ContactShareRequest`, `BloodRequestPost`, `DonationApplication`: Urgent donor matching and requests.

6. **Appointments & Live Queue System**:
   - `DoctorSchedule`: Chamber & schedule settings.
   - `AppointmentQueue`, `Appointment`, `AppointmentDoctor`: Real-time serial queue management with position calculation.
   - `EmergencyCase`, `QueueDisruption`, `RescheduleOffer`: Handling disruptions and emergency patient overrides.

7. **Cross-Tenant Consent & Governance**:
   - `ConsentGrant`, `ConsentGrantEvent`, `ConsentAccessLog`: Patient-owned cross-organization access delegation and audit trails.

### 3.2 Complete Prisma Database Schema

AI Agents and developers generating frontend or backend code MUST use the following exact Prisma schema definitions from `packages/database/prisma/schema.prisma`:

```prisma
{schema}
```

---

## 4. Application Architecture & Code Structure

```
PersoCare-Ecosystem/
├── apps/
│   ├── web/                 # Next.js 16 Web Application (Patient/Doctor Portal)
│   │   ├── src/
│   │   │   ├── app/         # App Router pages (login, register, dashboard, etc.)
│   │   │   ├── components/  # Shared UI & Layout components
│   │   │   └── lib/         # Server utilities, Supabase client, auth helpers
│   ├── api/                 # (Extensible API services)
│   ├── mobile/              # (Extensible Mobile App codebase)
│   └── workstation/         # (Extensible Clinic/Doctor Workstation app)
├── packages/
│   ├── database/            # Shared Prisma Client & Database Migrations
│   └── shared/              # Shared TS utilities, types, and logic
```

### Development & Routing Conventions

1. **Server vs. Client Components**:
   - Fetch data on the server using Server Components and shared DB/Supabase utilities.
   - Protect dashboard routes using `requireDashboardUser()` inside server layouts (`layout.tsx`).
2. **Form & Data Mutations**:
   - Use Server Actions or API handlers with strict Zod validation.
   - Show clear, accessible inline validation feedback styled with `var(--coral)`.

---

## 5. Guidelines for AI Agents

When generating new pages, features, or microservices for PersoCare:

1. **Strictly adhere to the design system**: Always apply `var(--paper)` for canvas background, `Fraunces` for headings, `Inter` for body, and `var(--coral)` for primary CTAs.
2. **Reuse Prisma schema models**: Reference existing schema models from Section 3.2. Do not invent duplicate entity types or alter field names without migrating `packages/database/prisma/schema.prisma`.
3. **Preserve Monorepo structure**: Export shared data access or types through `packages/database` or `packages/shared`.
4. **Enforce Accessibility**: Maintain `focus-visible` rings and respect `prefers-reduced-motion`.
"""

with open(design_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated design.md with complete schema and domain summaries successfully!")
