# PersoCare Ecosystem – Latest Changes & Updates

This document captures all changes, additions, and improvements made to the PersoCare Ecosystem. It serves as the comprehensive reference for the current state of the project.

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

| Model                  | Added Fields                                                                                                                                                                               |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UserSettings`         | `defaultBreakfastTime`, `defaultLunchTime`, `defaultDinnerTime`                                                                                                                            |
| `Prescription`         | `clinicalNotes` (JSON)                                                                                                                                                                     |
| `PrescriptionMedicine` | `timingInstructions`, `addedToRoutine`, `brandId`, `genericName`, `fdaInfo`, `medexBrandId`, `medexSlug`, `medexUrl`, `rxnormRxcui`, `rxnormName`, `drugMetadata`                          |
| `DoctorSchedule`       | `lunchBreakStart`, `lunchBreakEnd`, `status`, `requestedChanges`, `requestedAt`, `reviewedAt`, `reviewedBy`, `consultationFee`                                                             |
| `Organization`         | `logo`, `motto`, `vision`, `mission`, `establishedYear`, `patientServedCount`, `address`, `latitude`, `longitude`                                                                          |
| `Department`           | `icon`                                                                                                                                                                                     |
| `Appointment`          | `patientName`, `patientPhone`, `patientEmail`, `patientAge`, `patientGender`, `patientAddress`, `paymentStatus`, `paymentTransactionId`, `paymentAmount`, `consultationFee`, `platformFee` |
| `Review`               | `appointmentId`                                                                                                                                                                            |
| `BloodRequestPost`     | `organizationId`, `type` (PUBLIC/DIRECT)                                                                                                                                                   |
| `RoutineItem`          | `isExternal` (for manually added medicines)                                                                                                                                                |

### 1.3 New Enums

- `PaymentStatus` (UNPAID, PENDING, PAID, FAILED, REFUNDED)
- `RequestType` (PUBLIC, DIRECT)

---

## 2. Core Features

### 2.1 eKYC (Didit Integration) – NEW

- **Verification table** stores status, liveness score, face match score, extracted NID data.
- **Server actions**: `createDiditSession`, `isUserVerified`, `getVerificationStatus`.
- **API routes**: `/api/verify` (create session), `/api/webhooks/didit` (webhook handler).
- **Webhook** with signature verification (X-Signature-V2, HMAC-SHA256, timestamp freshness).
- **Client component**: `DiditVerifyButton` launches the Didit modal.
- **Professional role application** now requires identity verification.

### 2.2 Payment Gateway (SSLCommerz) – NEW

- **Fixed platform fee** (10 BDT) per appointment booking.
- **Consultation fee** is informational; collected offline by the doctor.
- **Server actions**: `initiateAppointmentPayment`, `verifyPayment`, `setConsultationFee`.
- **API routes**: `/api/payment/ipn` (SSLCommerz IPN webhook).
- **Payment flow**: Patient selects slot → pays platform fee → appointment is created with serial number.
- **Admin**: Can set consultation fee for each doctor.

### 2.3 Metabolic Risk Screener – Enhanced

- **Tiered assessment**: T0 (tape only) → T4 (full panel).
- **Client‑side inference**: ONNX Runtime in browser.
- **7 disease labels**: HighBodyFat_BMI, Low_HDL, Diabetes, NAFLD, Hypertension, InsulinResistance, MetSyn.
- **History**: Saves assessments to `MetabolicRiskAssessment`; visible in Log History.
- **Interpretation**: Layman + Clinical views.

### 2.4 Medicine Log

- **Meal‑based scheduling**: `PRE_MEAL`, `WITH_MEAL`, `POST_MEAL` timing instructions.
- **Prescription integration**: Add prescribed medicines to daily routine with automatic time‑slot calculation.
- **Manual entry**: Add external medicines marked "External Prescribed".
- **Drug API integration**: Search MedEx (Bangladesh), OpenFDA (global safety), RxNorm (standardisation).

### 2.5 Appointments

- **Doctor schedule approval workflow**: Submit changes → admin approves/rejects.
- **Lunch break**: Greyed out slots during lunch hours.
- **Reschedule**: Both patients and doctors can reschedule with validation.
- **QR code public booking**: Organisation‑level and doctor‑level QR codes.
- **Landscape booking modal**: Side‑by‑side date/time and past prescriptions.
- **Payment**: Platform fee (10 BDT) per booking via SSLCommerz.

### 2.6 Blood Donation System

- **Donor registration**: Blood type, district, eligibility (age ≥18).
- **Organization verification**: Admins verify donors via `OrganizationDonorVerification`.
- **Blood request**: PUBLIC or DIRECT (to specific organization).
- **Organization blood dashboard**: Inventory by blood type, pending requests.
- **Blood bank inventory**: Blood units tracked with expiry, status workflow.

### 2.7 Inventory Management

- **Core inventory**: Items, categories, batches, expiry, movements (inbound/outbound).
- **Low stock alerts**: Automatic alerts when stock falls below threshold.
- **Pharmacy**: Dispense prescriptions, reduce stock.
- **Blood bank**: Blood units integrated as inventory items.

### 2.8 AI & Avatar

- **Modular AI configuration**: Add multiple providers (OpenAI, Google, Anthropic, Groq) with API keys.
- **Round‑robin**: Automatic failover on rate limits.
- **Avatar system**: Default (provider icons) and Fun mode (cute characters: Poro, Tomo, Bulu, Gulu).
- **Sprite animations**: idle, walk, chase, sleep, eat.
- **Floating chat button**: Accessible from all pages.
- **Dashboard AI Insights**: Real‑time health insights using Gemini.

### 2.9 Nutrition & Exercise

- **Hybrid caching**: Raw foods global; processed/branded per user.
- **External APIs**: FatSecret (food), ExerciseDB (exercise), USDA (fallback).
- **Calorie calculation**: Personalized based on MET, weight, intensity, duration.

### 2.10 Platform Owner

- **Separate admin portal**: `/platform-admin/*`.
- **Features**: Dashboard, User Management, Organizations, Applications, Audit Log, Announcements, Settings.
- **Detection**: `isPlatformOwner` helper.

### 2.11 Health Diary

- **Quick note modal**: Header quill icon.
- **Entries**: Note, mood, symptoms, tags.
- **Full page**: List view with delete/edit.

### 2.12 Settings

- **Language**: English / Bengali.
- **Confirmation modal toggle**: Disable confirmation popups.
- **Notifications toggle**: Enable/disable push notifications.
- **Theme**: Light/dark mode (foundation).

### 2.13 PWA & Mobile

- **Web app**: Fully responsive PWA with service worker.
- **Mobile app**: React Native (Expo) project scaffolded in `apps/mobile/`.
- **Bottom navigation**: On mobile (replaces sidebar).
- **Offline support**: Planned with AsyncStorage/SQLite.

---

## 3. UI/UX Improvements

- **Page transitions**: Fade + slide animation for all route changes (login, logout, navigation).
- **Profile switching animation**: Full‑page scale + opacity transition with spring bounce.
- **Back button**: Reusable component in header for sub‑pages.
- **Mobile‑first**: Bottom navigation, responsive grids, touch‑friendly targets.
- **Role‑based sidebar**: Patient, doctor, admin, platform owner.
- **Tabbed profile**: Personal, Health, Professional.
- **Compact employee table**: Editable role/department dropdown, history button.
- **Prescription table**: Expandable timing instructions.
- **Landscape booking modal**: Side‑by‑side date/time and past prescriptions.

---

## 4. API Integrations

| API                           | Purpose                                            | Authentication            |
| :---------------------------- | :------------------------------------------------- | :------------------------ |
| **Didit**                     | eKYC (identity verification, liveness, face match) | API Key + Webhook         |
| **SSLCommerz**                | Payment gateway (appointment booking)              | Store ID + Store Password |
| **MedEx**                     | Bangladesh drug data                               | API Key                   |
| **OpenFDA**                   | Global drug safety                                 | API Key (optional)        |
| **RxNorm**                    | Drug name standardisation                          | None                      |
| **FatSecret**                 | Food nutrition                                     | OAuth 1.0                 |
| **ExerciseDB**                | Exercise metadata                                  | API Key                   |
| **USDA**                      | Food nutrition (fallback)                          | API Key                   |
| **Gemini (Google)**           | AI insights, chat                                  | API Key                   |
| **OpenAI / Anthropic / Groq** | AI providers                                       | API Key (user‑provided)   |
| **Tavily**                    | Web search for AI                                  | API Key                   |

---

## 5. Environment Variables

### Database & Auth

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
NEXT_PUBLIC_APP_URL="https://persocare.vercel.app"
```

### eKYC (Didit)

```env
DIDIT_API_KEY="your_didit_api_key"
DIDIT_WEBHOOK_SECRET="your_didit_webhook_secret"
```

### Payment (SSLCommerz)

```env
NEXT_PUBLIC_SSLCOMMERZ_STORE_ID="your_store_id"
SSLCOMMERZ_STORE_PASSWORD="your_store_password"
SSLCOMMERZ_SANDBOX=true
PLATFORM_FEE_AMOUNT=10
```

### APIs (Optional)

```env
MEDEX_API_KEY="..."
OPENFDA_API_KEY="..."
FATSECRET_CONSUMER_KEY="..."
FATSECRET_CONSUMER_SECRET="..."
EXERCISEDB_API_KEY="..."
USDA_API_KEY="..."
GEMINI_API_KEY="..."
GROQ_API_KEY="..."
TAVILY_API_KEY="..."
```

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

## 8. Business Model

| Revenue Stream           | Description                                                |
| :----------------------- | :--------------------------------------------------------- |
| **Platform Booking Fee** | 10 BDT per appointment (collected via SSLCommerz).         |
| **Consultation Fee**     | Collected offline by the doctor (not handled by platform). |
| **Future**               | Subscription plans, premium features, telemedicine fees.   |

---

## 9. Known Issues & Limitations

- **Didit webhook**: Currently using in‑memory idempotency store (`processedEvents`). Should be replaced with Redis/DB in production.
- **Metabolic Risk Screener**: Trained on NHANES US cohort – needs external validation on Bangladeshi/South Asian population.
- **Mobile app**: In early development – only authentication and basic screens implemented.
- **Offline support**: Not yet implemented in the web app; planned for mobile.
- **Payment**: SSLCommerz sandbox only; live keys required for production.

---

## 10. Roadmap

| Phase    | Features                                                                        |
| :------- | :------------------------------------------------------------------------------ |
| **v1.0** | ✅ Web app deployed, core features (appointments, medicine log, diet/exercise). |
| **v1.1** | ✅ eKYC, payment gateway, metabolic risk screener, blood donation, inventory.   |
| **v1.2** | 🚧 Mobile app (React Native), push notifications, offline support.              |
| **v1.3** | Telemedicine (video consultations), wearable integration.                       |
| **v2.0** | Blockchain for medical records, advanced analytics, AI enhancements.            |

---

## 11. Summary

| Category       | Key Changes                                                                                                                  |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Schema**     | Added `Verification`, `MetabolicRiskAssessment`; updated `DoctorSchedule`, `Appointment`, etc.                               |
| **Features**   | eKYC (Didit), Payment Gateway (SSLCommerz), Metabolic Risk Screener, Medicine Log enhancements, Blood Donation improvements. |
| **UI/UX**      | Page transitions, role switching animation, back button, mobile‑first design.                                                |
| **APIs**       | Added Didit and SSLCommerz integrations.                                                                                     |
| **Deployment** | Vercel + Supabase.                                                                                                           |
| **Mobile**     | React Native (Expo) app scaffolded.                                                                                          |

---

**This document is the authoritative reference for all changes made to PersoCare.** 🚀
