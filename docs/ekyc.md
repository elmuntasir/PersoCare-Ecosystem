# PersoCare Ecosystem – Changes & Updates Log

This document captures all changes, additions, and improvements made to the PersoCare Ecosystem since the last major update. It serves as a comprehensive reference for the current state of the project.

---

## 1. Schema Additions & Modifications

### 1.1 New Models

| Model                                           | Purpose                                                                           |
| :---------------------------------------------- | :-------------------------------------------------------------------------------- |
| `Verification`                                  | Stores eKYC verification results from Didit (status, scores, extracted NID data). |
| `MetabolicRiskAssessment`                       | Stores metabolic risk prediction results (added previously, now integrated).      |
| `CachedFood` / `UserCachedFood` / `UserFoodLog` | Food caching and logging (hybrid cache – global + user-specific).                 |
| `CachedExercise` / `UserExerciseLog`            | Exercise caching and logging.                                                     |
| `ChatMessage`                                   | AI conversation history.                                                          |

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

---

## 2. Core Features

### 2.1 eKYC (Didit Integration) – NEW

- **Verification table** stores status, liveness score, face match score, extracted NID data.
- **Server actions**: `createDiditSession`, `isUserVerified`, `getVerificationStatus`.
- **API routes**: `/api/verify` (create session), `/api/webhooks/didit` (webhook handler).
- **Webhook** with signature verification (X-Signature-V2, HMAC-SHA256, timestamp freshness).
- **Client component**: `DiditVerifyButton` launches the Didit modal.
- **Professional role application** now requires identity verification.

### 2.2 Metabolic Risk Screener – Enhanced

- **Tiered assessment**: T0 (tape only) → T4 (full panel).
- **Client‑side inference**: ONNX Runtime in browser.
- **7 disease labels**: HighBodyFat_BMI, Low_HDL, Diabetes, NAFLD, Hypertension, InsulinResistance, MetSyn.
- **History**: Saves assessments to `MetabolicRiskAssessment`; visible in Log History.
- **Interpretation**: Layman + Clinical views.

### 2.3 Medicine Log

- **Meal‑based scheduling**: `PRE_MEAL`, `WITH_MEAL`, `POST_MEAL` timing instructions.
- **Prescription integration**: Add prescribed medicines to daily routine with automatic time‑slot calculation.
- **Manual entry**: Add external medicines marked "External Prescribed".
- **Drug API integration**: Search MedEx (Bangladesh), OpenFDA (global safety), RxNorm (standardisation).

### 2.4 Appointments

- **Doctor schedule approval workflow**: Submit changes → admin approves/rejects.
- **Lunch break**: Greyed out slots during lunch hours.
- **Reschedule**: Both patients and doctors can reschedule with validation.
- **QR code public booking**: Organisation‑level and doctor‑level QR codes.
- **Landscape booking modal**: Side‑by‑side date/time and past prescriptions.

### 2.5 Blood Donation System

- **Donor registration**: Blood type, district, eligibility (age ≥18).
- **Organization verification**: Admins verify donors via `OrganizationDonorVerification`.
- **Blood request**: PUBLIC or DIRECT (to specific organization).
- **Organization blood dashboard**: Inventory by blood type, pending requests.
- **Blood bank inventory**: Blood units tracked with expiry, status workflow.

### 2.6 Inventory Management

- **Core inventory**: Items, categories, batches, expiry, movements (inbound/outbound).
- **Low stock alerts**: Automatic alerts when stock falls below threshold.
- **Pharmacy**: Dispense prescriptions, reduce stock.
- **Blood bank**: Blood units integrated as inventory items.

### 2.7 AI & Avatar

- **Modular AI configuration**: Add multiple providers (OpenAI, Google, Anthropic, Groq) with API keys.
- **Round‑robin**: Automatic failover on rate limits.
- **Avatar system**: Default (provider icons) and Fun mode (cute characters: Poro, Tomo, Bulu, Gulu).
- **Sprite animations**: idle, walk, chase, sleep, eat.
- **Floating chat button**: Accessible from all pages.
- **Dashboard AI Insights**: Real‑time health insights using Gemini.

### 2.8 Nutrition & Exercise

- **Hybrid caching**: Raw foods global; processed/branded per user.
- **External APIs**: FatSecret (food), ExerciseDB (exercise), USDA (fallback).
- **Calorie calculation**: Personalized based on MET, weight, intensity, duration.

### 2.9 Platform Owner

- **Separate admin portal**: `/platform-admin/*`.
- **Features**: Dashboard, User Management, Organizations, Applications, Audit Log, Announcements, Settings.
- **Detection**: `isPlatformOwner` helper.

### 2.10 Health Diary

- **Quick note modal**: Header quill icon.
- **Entries**: Note, mood, symptoms, tags.
- **Full page**: List view with delete/edit.

### 2.11 Settings

- **Language**: English / Bengali.
- **Confirmation modal toggle**: Disable confirmation popups.
- **Notifications toggle**: Enable/disable push notifications.
- **Theme**: Light/dark mode (foundation).

### 2.12 PWA & Mobile

- **Web app**: Fully responsive PWA with service worker.
- **Mobile app**: React Native (Expo) project scaffolded in `apps/mobile/`.
- **Bottom navigation**: On mobile (replaces sidebar).
- **Offline support**: Planned with AsyncStorage/SQLite.

---

## 3. UI/UX Improvements

- **Role switching animation**: Full‑page scale + opacity transition with spring bounce.
- **Back button**: Reusable component in header for sub‑pages.
- **Mobile‑first**: Bottom navigation, responsive grids, touch‑friendly targets.
- **Role‑based sidebar**: Patient, doctor, admin, platform owner.
- **Tabbed profile**: Personal, Health, Professional.
- **Compact employee table**: Editable role/department dropdown, history button.
- **Prescription table**: Expandable timing instructions.
- **Landscape booking modal**: Side‑by‑side date/time and past prescriptions.

---

## 4. API Integrations

| API                           | Purpose                                            | Authentication          |
| :---------------------------- | :------------------------------------------------- | :---------------------- |
| **Didit**                     | eKYC (identity verification, liveness, face match) | API Key + Webhook       |
| **MedEx**                     | Bangladesh drug data                               | API Key                 |
| **OpenFDA**                   | Global drug safety                                 | API Key (optional)      |
| **RxNorm**                    | Drug name standardisation                          | None                    |
| **FatSecret**                 | Food nutrition                                     | OAuth 1.0               |
| **ExerciseDB**                | Exercise metadata                                  | API Key                 |
| **USDA**                      | Food nutrition (fallback)                          | API Key                 |
| **Gemini (Google)**           | AI insights, chat                                  | API Key                 |
| **OpenAI / Anthropic / Groq** | AI providers                                       | API Key (user‑provided) |
| **Tavily**                    | Web search for AI                                  | API Key                 |

---

## 5. Environment Variables (New)

| Variable               | Purpose                      |
| :--------------------- | :--------------------------- |
| `DIDIT_API_KEY`        | Didit API key for eKYC       |
| `DIDIT_WEBHOOK_SECRET` | Didit webhook signing secret |

---

## 6. Deployment

- **Frontend/API Hosting**: **Vercel** (recommended) – native Next.js support.
- **Database & Authentication**: Supabase – managed PostgreSQL + auth.
- **Environment**: Node.js 20+, PostgreSQL 14+.
- **Domain**: Custom domain managed via Vercel’s built‑in domain management.

---

## 7. Mobile App (React Native – Planned)

| Aspect                 | Details                                       |
| :--------------------- | :-------------------------------------------- |
| **Framework**          | React Native (Expo)                           |
| **Navigation**         | React Navigation (bottom tabs)                |
| **State**              | React Context + Zustand                       |
| **API Client**         | Axios (consumes existing Next.js API routes)  |
| **Authentication**     | Supabase Auth (with React Native SDK)         |
| **eKYC**               | Didit React Native SDK                        |
| **Offline**            | AsyncStorage / SQLite                         |
| **Push Notifications** | Expo Notifications / Firebase Cloud Messaging |
| **UI Library**         | NativeBase / React Native Paper               |

**Mobile app development is planned for Q4 2026 – Q1 2027.**

---

## 8. Known Issues & Limitations

- **Didit webhook**: Currently using in‑memory idempotency store (`processedEvents`). Should be replaced with Redis/DB in production.
- **Metabolic Risk Screener**: Trained on NHANES US cohort – needs external validation on Bangladeshi/South Asian population.
- **Mobile app**: In early development – only authentication and basic screens implemented.
- **Offline support**: Not yet implemented in the web app; planned for mobile.

---

## 9. Future Roadmap

| Phase    | Features                                                                                  |
| :------- | :---------------------------------------------------------------------------------------- |
| **v1.1** | eKYC finalisation, mobile app beta, push notifications.                                   |
| **v1.2** | Offline support, advanced analytics, AI insights enhancement.                             |
| **v2.0** | Telemedicine (video consultations), wearable integration, blockchain for medical records. |

---

## 10. Summary

| Category       | Key Changes                                                                                    |
| :------------- | :--------------------------------------------------------------------------------------------- |
| **Schema**     | Added `Verification`, `MetabolicRiskAssessment`; updated multiple models.                      |
| **Features**   | eKYC (Didit), Metabolic Risk Screener, Medicine Log enhancements, Blood Donation improvements. |
| **UI/UX**      | Role switching animation, back button, mobile‑first design.                                    |
| **APIs**       | Added Didit integration.                                                                       |
| **Deployment** | Moved to Vercel + Supabase.                                                                    |
| **Mobile**     | React Native (Expo) app scaffolded.                                                            |

---

**This document is the authoritative reference for all changes made to PersoCare.** 🚀
