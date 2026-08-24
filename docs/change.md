# PersoCare Ecosystem — Complete Updates & Changes Log

This document captures **all changes, additions, and improvements** made to the PersoCare Ecosystem beyond the initial architecture document. It serves as the authoritative reference for the current state of the project.

---

## 1. Schema Additions & Modifications

### 1.1 New Models

| Model                                                                                         | Purpose                                                         |
| :-------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| `OrganizationApplication`                                                                     | Tracks admin applications for organization creation.            |
| `OrganizationAdmin`                                                                           | Multi‑admin governance per organization.                        |
| `OrganizationMemberHistory`                                                                   | Audit trail for employee actions (invite, remove, role change). |
| `AdminVote` / `AdminVoteResponse`                                                             | Voting mechanism for co‑admin changes.                          |
| `EmployeeInvitation`                                                                          | Employee invitations with role and department.                  |
| `AdminInvitation`                                                                             | Admin invitations for co‑admins.                                |
| `Department`                                                                                  | Organization departments with icons and head assignment.        |
| `OrganizationRole`                                                                            | Custom roles per organization.                                  |
| `InventoryCategory`, `InventoryItem`, `InventoryBatch`, `InventoryMovement`, `InventoryAlert` | Core inventory management.                                      |
| `BloodDonationUnit`                                                                           | Blood units linked to inventory batches.                        |
| `PrescriptionDispense`                                                                        | Pharmacy dispensing records.                                    |
| `Notification`                                                                                | User notifications with read/unread status.                     |
| `HealthDiaryEntry`                                                                            | User health notes with mood, symptoms, tags.                    |
| `CachedFood` / `UserCachedFood` / `UserFoodLog`                                               | Food caching and logging.                                       |
| `CachedExercise` / `UserExerciseLog`                                                          | Exercise caching and logging.                                   |
| `ChatMessage`                                                                                 | AI conversation history.                                        |
| `SystemAuditLog`                                                                              | Platform‑wide audit log (Platform Owner).                       |
| `MetabolicRiskAssessment`                                                                     | Stores metabolic risk prediction results.                       |
| `OrganizationDonorVerification`                                                               | Blood donor verification by organizations.                      |

### 1.2 Modified Models

| Model                  | Added Fields                                                                                                                                                      |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UserSettings`         | `defaultBreakfastTime`, `defaultLunchTime`, `defaultDinnerTime`                                                                                                   |
| `Prescription`         | `clinicalNotes` (JSON)                                                                                                                                            |
| `PrescriptionMedicine` | `timingInstructions`, `addedToRoutine`, `brandId`, `genericName`, `fdaInfo`, `medexBrandId`, `medexSlug`, `medexUrl`, `rxnormRxcui`, `rxnormName`, `drugMetadata` |
| `DoctorSchedule`       | `lunchBreakStart`, `lunchBreakEnd`, `status`, `requestedChanges`, `requestedAt`, `reviewedAt`, `reviewedBy`                                                       |
| `Organization`         | `logo`, `motto`, `vision`, `mission`, `establishedYear`, `patientServedCount`, `address`, `latitude`, `longitude`                                                 |
| `Department`           | `icon`                                                                                                                                                            |
| `Appointment`          | `patientName`, `patientPhone`, `patientEmail`, `patientAge`, `patientGender`, `patientAddress`                                                                    |
| `Review`               | `appointmentId`                                                                                                                                                   |
| `BloodRequestPost`     | `organizationId`, `type` (PUBLIC/DIRECT)                                                                                                                          |
| `RoutineItem`          | `isExternal` (for manually added medicines)                                                                                                                       |
| `User`                 | Added relations for blood donation, admin invitations, etc.                                                                                                       |

### 1.3 New Enums

- `MemberAction`
- `DonationUnitStatus`
- `MovementType`
- `AlertStatus`
- `VoteAction`, `VoteStatus`
- `ScheduleStatus`
- `VerificationStatus`
- `InvitationStatus`
- `RequestType` (PUBLIC/DIRECT for blood requests)

---

## 2. Core Features

### 2.1 Medicine Log

- **Meal‑based scheduling**: `PRE_MEAL`, `WITH_MEAL`, `POST_MEAL` timing instructions.
- **Prescription integration**: Add prescribed medicines to daily routine with automatic time‑slot calculation.
- **Manual entry**: Add external medicines marked "External Prescribed".
- **Drug API integration**: Search MedEx (Bangladesh), OpenFDA (global safety), RxNorm (standardisation).
- **Drug details modal**: Shows local (MedEx) + global (FDA) info.

### 2.2 Appointments

- **Doctor schedule approval workflow**: Submit changes → admin approves/rejects.
- **Lunch break**: Greyed out slots during lunch hours.
- **Reschedule**: Both patients and doctors can reschedule with validation.
- **QR code public booking**: Organisation‑level and doctor‑level QR codes.
- **Public booking form**: No login required; name, phone, age, gender, address, symptoms.
- **Booking confirmation**: Serial number, downloadable PDF.
- **Landscape booking modal**: Side‑by‑side date/time and past prescriptions.

### 2.3 Blood Donation System

- **Donor registration**: Blood type, district, eligibility (age ≥18).
- **Organization verification**: Admins verify donors via `OrganizationDonorVerification`.
- **Blood request**: PUBLIC or DIRECT (to specific organization).
- **Organization blood dashboard**: Inventory by blood type, pending requests.
- **Contact sharing**: Requester requests donor contact; donor approves/declines.
- **Blood bank inventory**: Blood units tracked with expiry, status workflow.

### 2.4 Inventory Management

- **Core inventory**: Items, categories, batches, expiry, movements (inbound/outbound).
- **Low stock alerts**: Automatic alerts when stock falls below threshold.
- **Pharmacy**: Dispense prescriptions, reduce stock.
- **Blood bank**: Blood units integrated as inventory items.

### 2.5 Employee & Member Management (Admin)

- **Invite employees**: By email with role and department.
- **Remove employees**: Deactivate with logging.
- **Audit trail**: Complete history (`OrganizationMemberHistory`).
- **Departments & Roles**: Admin can create/delete; predefined departments based on org type.
- **Department Head**: Assign a department head.

### 2.6 Organization Profile & Management

- **Rich profile**: Logo, motto, vision, mission, established year, patient count.
- **Department management**: Add/delete departments with icons.
- **Multi‑admin governance**: Co‑admins with voting (`AdminVote`).
- **Location**: Address, latitude, longitude for maps.

### 2.7 Notifications

- **Bell icon**: Unread count badge, dropdown list.
- **Mark read/unread**: Individual and mark all.
- **Triggered events**: Appointment booking, prescription, schedule approval, employee invitations, blood request updates.

### 2.8 Public Booking with QR Code

- **No login**: Patient fills name, phone, age, selects date/time.
- **QR generation**: Doctor‑specific and organisation‑level.
- **Confirmation**: Serial number, downloadable PDF.

### 2.9 Health Diary

- **Quick note modal**: Header quill icon.
- **Entries**: Note, mood, symptoms, tags.
- **Full page**: List view with delete/edit.

### 2.10 AI & Avatar

- **Modular AI configuration**: Add multiple providers (OpenAI, Google, Anthropic, Groq) with API keys.
- **Round‑robin**: Automatic failover on rate limits.
- **Avatar system**: Default (provider icons) and Fun mode (cute characters: Poro, Tomo, Bulu, Gulu).
- **Sprite animations**: idle, walk, chase, sleep, eat.
- **Chat integration**: Avatar displayed in AI chat.
- **Floating chat button**: Accessible from all pages.
- **Dashboard AI Insights**: Real‑time health insights using Gemini.

### 2.11 Nutrition & Exercise

- **Hybrid caching**: Raw foods global; processed/branded per user.
- **External APIs**: FatSecret (food), ExerciseDB (exercise), USDA (fallback).
- **Calorie calculation**: Personalized based on MET, weight, intensity, duration.
- **Exercise log**: Search, log, history.

### 2.12 Metabolic Risk Screener

- **Tiered assessment**: T0 (tape only) → T4 (full panel).
- **Client‑side inference**: ONNX Runtime in browser.
- **7 disease labels**: HighBodyFat_BMI, Low_HDL, Diabetes, NAFLD, Hypertension, InsulinResistance, MetSyn.
- **History**: Saves assessments to `MetabolicRiskAssessment`; visible in Log History.
- **Interpretation**: Layman + Clinical views.
- **Result interpretation**: Combined with AI insights.

### 2.13 Settings

- **Language**: English / Bengali.
- **Confirmation modal toggle**: Disable confirmation popups.
- **Notifications toggle**: Enable/disable push notifications.
- **Theme**: Light/dark mode (foundation).

### 2.14 Platform Owner

- **Separate admin portal**: `/platform-admin/*`.
- **Features**: Dashboard, User Management, Organizations, Applications, Audit Log, Announcements, Settings.
- **Detection**: `isPlatformOwner` helper.

### 2.15 PWA & Mobile

- **Installable**: PWA with service worker.
- **Bottom navigation**: On mobile (replaces sidebar).
- **Responsive**: All pages adapt to screen size.

### 2.16 Role Switching

- **Premium animation**: Full‑page scale + opacity transition with spring bounce.
- **Sidebar**: Updates with role‑specific navigation.
- **Platform Owner**: Not a separate role; flag on Admin role.

### 2.17 Back Button

- **Reusable component**: `BackButton` with optional fallback.
- **Header integration**: Auto‑appears on sub‑pages.

---

## 3. UI/UX Improvements

- **Mobile‑first**: Bottom navigation, responsive grids, touch‑friendly targets.
- **Role‑based sidebar**: Patient, doctor, admin, platform owner.
- **Tabbed profile**: Personal, Health, Professional.
- **Compact employee table**: Editable role/department dropdown, history button.
- **Prescription table**: Expandable timing instructions.
- **Landscape booking modal**: Side‑by‑side date/time and past prescriptions.
- **Sprite animations**: idle, walk, chase, sleep, eat.
- **Quick health note**: Quill icon in header.

---

## 4. API Integrations

| API                           | Purpose                   | Authentication          |
| :---------------------------- | :------------------------ | :---------------------- |
| **MedEx**                     | Bangladesh drug data      | API Key                 |
| **OpenFDA**                   | Global drug safety        | API Key (optional)      |
| **RxNorm**                    | Drug name standardisation | None                    |
| **FatSecret**                 | Food nutrition            | OAuth 1.0               |
| **ExerciseDB**                | Exercise metadata         | API Key                 |
| **USDA**                      | Food nutrition (fallback) | API Key                 |
| **Gemini (Google)**           | AI insights, chat         | API Key                 |
| **OpenAI / Anthropic / Groq** | AI providers              | API Key (user‑provided) |
| **Tavily**                    | Web search for AI         | API Key                 |

---

## 5. Environment Variables

```env
# Database
DATABASE_URL="..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# MedEx (Bangladesh drug data)
MEDEX_API_KEY="..."

# OpenFDA (global drug data)
OPENFDA_API_KEY="..."

# FatSecret (food & nutrition)
FATSECRET_CONSUMER_KEY="..."
FATSECRET_CONSUMER_SECRET="..."

# ExerciseDB
EXERCISEDB_API_KEY="..."

# USDA (fallback food data)
USDA_API_KEY="..."

# AI providers (optional)
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."
GROQ_API_KEY="..."
GROQ_API_KEYS="gsk_key1,gsk_key2"

# Tavily (AI web search)
TAVILY_API_KEY="..."
```

---

## 6. File Structure (New/Changed)

```
apps/web/
├── src/
│   ├── actions/
│   │   ├── admin/           # Org, employees, approvals
│   │   ├── appointments/    # Booking, reschedule, slots
│   │   ├── blood/           # Donor, request, contact, availability
│   │   ├── chat/            # AI chat
│   │   ├── doctor/          # Schedule, prescriptions
│   │   ├── drugs/           # MedEx, FDA, RxNorm
│   │   ├── exercise/        # Search, log, cache
│   │   ├── food/            # Search, log, cache
│   │   ├── healthDiary/     # Notes
│   │   ├── inventory/       # Core, blood bank, pharmacy
│   │   ├── metabolicRisk/   # Save assessment
│   │   ├── notifications/   # Bell, read/unread
│   │   ├── platform-admin/  # Applications, approvals
│   │   ├── profile/         # Personal, health, professional
│   │   ├── public/          # QR booking, confirmation
│   │   └── settings/        # Language, toggles
│   ├── app/
│   │   ├── (dashboard)/     # All protected pages
│   │   ├── (auth)/          # Login, reset password
│   │   ├── (public)/        # QR booking, confirmation
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/           # Org, employees, approvals
│   │   ├── appointment/     # Booking modal, search
│   │   ├── avatar/          # FunAvatar, SpriteSheetAnimation
│   │   ├── blood/           # Donor cards, request forms, admin
│   │   ├── chat/            # Chat UI, floating button
│   │   ├── healthDiary/     # QuickNoteModal
│   │   ├── inventory/       # Stock, movements, alerts
│   │   ├── notifications/   # Bell, dropdown
│   │   ├── prescription/    # Prescription PDF, drug search
│   │   ├── profile/         # Tabs, edit modals
│   │   ├── shared/          # BackButton, FilterBar, etc.
│   │   └── ui/              # SpriteSheetAnimation, AnimatedCharacter
│   ├── contexts/            # AvatarContext, RoleContext
│   ├── lib/                 # Avatar registry, AI providers, metabolicRisk
│   └── types/               # Avatar, API types
├── public/
│   ├── images/
│   │   ├── animations/      # Character sprite sheets (poro, tomo, gulu, etc.)
│   │   └── avatars/         # Provider icons
│   └── models/
│       └── metabolic_risk/  # ONNX models and manifest
└── prisma/
    └── schema.prisma        # Updated with all new models
```

---

## 7. Security & Performance

- **API key rotation**: Round‑robin with rate limit handling.
- **Hybrid caching**: Reduces external API calls.
- **PWA service worker**: Caches assets and API responses.
- **Database indexing**: Added indices for frequently queried fields.
- **Input validation**: Zod schemas for all server actions.
- **Environment variables**: All secrets in `.env.local`.

---

## 8. Deployment

- **AWS Amplify**: Recommended deployment platform.
- **Supabase**: Authentication and database.
- **Environment**: Node.js 20+, PostgreSQL.

---

**This document is the authoritative reference for all changes made to PersoCare.** 🚀
