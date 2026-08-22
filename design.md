# PersoCare Ecosystem — Design & Architecture System

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
:root {
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
}
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
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
    outline: 2px solid var(--coral);
    outline-offset: 2px;
    border-radius: 4px;
  }
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
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─────────────────────────────────────────────────────────────
// 2. Identity & Authority Model
// ─────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  authId        String?   @unique // Supabase Auth user id
  username      String?   @unique
  requestedRole String?
  name          String
  email         String    @unique
  phone         String?
  dob           DateTime?
  gender        String?
  createdAt     DateTime  @default(now())

  professions        UserProfession[]
  memberships        OrganizationMembership[]
  ownedOrgs          Organization[]           @relation("OrgOwner")
  bloodDonorProfile  BloodDonorProfile?
  externalIdentities ExternalIdentity[]
  patientProfile     PatientProfile?

  // Retained from old schema
  reviewsWritten      Review[]             @relation("ReviewAuthor")
  reviewsReceived     Review[]             @relation("ReviewSubject")
  healthDiaryEntries  HealthDiaryEntry[]
  platformOwner       PlatformOwner?
  healthHistoryEvents HealthHistoryEvent[]
  consentGrants       ConsentGrant[]       @relation("ConsentGrantsAsPatient")
  settings            UserSettings?
}

model PlatformOwner {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  grantedAt DateTime @default(now())
}

model ProfessionType {
  id                String   @id @default(cuid())
  code              String   @unique // "DOCTOR", "PHYSIOTHERAPIST", etc.
  name              String
  requiredDocuments String[]
  verifyingBody     String?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())

  userProfessions UserProfession[]
}

model UserProfession {
  id               String         @id @default(cuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  professionTypeId String
  professionType   ProfessionType @relation(fields: [professionTypeId], references: [id])

  status            ProfessionStatus @default(PENDING)
  submittedAt       DateTime         @default(now())
  verifiedAt        DateTime?
  rejectedAt        DateTime?
  rejectedReason    String?
  resubmissionCount Int              @default(0)

  documents     ProfessionDocument[]
  reviewHistory ProfessionReviewEvent[]

  doctorCredential          DoctorCredential?
  physiotherapistCredential PhysiotherapistCredential?
  radiologistCredential     RadiologistCredential?

  @@unique([userId, professionTypeId])
}

enum ProfessionStatus {
  PENDING
  VERIFIED
  REJECTED
}

model ProfessionDocument {
  id               String               @id @default(cuid())
  userProfessionId String
  userProfession   UserProfession       @relation(fields: [userProfessionId], references: [id], onDelete: Cascade)
  documentType     String
  fileUrl          String
  uploadedAt       DateTime             @default(now())
  reviewedBy       String?
  reviewedAt       DateTime?
  reviewStatus     DocumentReviewStatus @default(PENDING)
}

enum DocumentReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

model ProfessionReviewEvent {
  id               String         @id @default(cuid())
  userProfessionId String
  userProfession   UserProfession @relation(fields: [userProfessionId], references: [id], onDelete: Cascade)
  action           ReviewAction
  actorId          String?
  note             String?
  createdAt        DateTime       @default(now())
}

enum ReviewAction {
  SUBMITTED
  APPROVED
  REJECTED
  RESUBMITTED
}

model DoctorCredential {
  id                     String         @id @default(cuid())
  userProfessionId       String         @unique
  userProfession         UserProfession @relation(fields: [userProfessionId], references: [id], onDelete: Cascade)
  bmdcRegistrationNumber String         @unique
  degreeInstitution      String
  graduationYear         Int
  specialization         String?
  bio                    String? // Carried over from old schema DoctorProfile
  registryVerifiedAt     DateTime?

  @@index([bmdcRegistrationNumber])
}

model PhysiotherapistCredential {
  id                 String         @id @default(cuid())
  userProfessionId   String         @unique
  userProfession     UserProfession @relation(fields: [userProfessionId], references: [id], onDelete: Cascade)
  licenseNumber      String
  licenseIssuingBody String
  licenseExpiryDate  DateTime?
}

model RadiologistCredential {
  id                      String         @id @default(cuid())
  userProfessionId        String         @unique
  userProfession          UserProfession @relation(fields: [userProfessionId], references: [id], onDelete: Cascade)
  bmdcRegistrationNumber  String
  certificationBody       String
  certificationExpiryDate DateTime?
}

// ─────────────────────────────────────────────────────────────
// 3. Organizations & RBAC
// ─────────────────────────────────────────────────────────────

model OrganizationType {
  id                String   @id @default(cuid())
  code              String   @unique
  name              String
  requiredDocuments String[]
  verifyingBody     String?
  isActive          Boolean  @default(true)

  organizations Organization[]
}

model Organization {
  id                 String           @id @default(cuid())
  organizationTypeId String
  organizationType   OrganizationType @relation(fields: [organizationTypeId], references: [id])
  name               String
  slug               String           @unique // Carried from old schema
  specialties        String[]
  ownerId            String           @unique
  owner              User             @relation("OrgOwner", fields: [ownerId], references: [id])
  status             OrgStatus        @default(ACTIVE)
  verificationStatus String           @default("pending") // Carried from old schema
  verifiedAt         DateTime?
  createdAt          DateTime         @default(now())
  deletedAt          DateTime?

  roles                 Role[]
  memberships           OrganizationMembership[]
  appointments          Appointment[]
  prescriptions         Prescription[]
  reviews               Review[]
  aiConfiguration       AIConfiguration?
  subscription          Subscription?
  consentGrantsReceived ConsentGrant[]           @relation("ConsentGrantsReceived")
  consentGrantsSourced  ConsentGrant[]           @relation("ConsentGrantsSourced")
}

enum OrgStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}

model Permission {
  id          String @id @default(cuid())
  code        String @unique
  category    String
  description String

  rolePermissions RolePermission[]
}

model Role {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  name           String
  isSystemRole   Boolean      @default(false)
  createdAt      DateTime     @default(now())

  rolePermissions RolePermission[]
  memberships     OrganizationMembership[]

  @@unique([organizationId, name])
}

model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

model OrganizationMembership {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId         String
  role           Role         @relation(fields: [roleId], references: [id])

  status      MembershipStatus
  invitedBy   String
  invitedAt   DateTime         @default(now())
  respondedAt DateTime?
  startedAt   DateTime?
  endedAt     DateTime?
  endReason   String?

  frozenAt     DateTime?
  frozenBy     String?
  frozenReason String?
  unfrozenAt   DateTime?
  unfrozenBy   String?

  statusEvents MembershipStatusEvent[]
  // We omit partial unique index logic here, it must be run as raw SQL if supported

  @@index([userId])
  @@index([organizationId, status])
}

enum MembershipStatus {
  INVITED
  ACTIVE
  DECLINED
  REMOVED
  LEFT
  FROZEN
}

model MembershipStatusEvent {
  id           String                 @id @default(cuid())
  membershipId String
  membership   OrganizationMembership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  fromStatus   MembershipStatus
  toStatus     MembershipStatus
  actorId      String
  reason       String?
  createdAt    DateTime               @default(now())
}

model OwnershipTransfer {
  id             String         @id @default(cuid())
  organizationId String
  fromUserId     String
  toUserId       String
  status         TransferStatus @default(PENDING)
  initiatedAt    DateTime       @default(now())
  respondedAt    DateTime?
}

enum TransferStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model DeletionRequest {
  id                  String         @id @default(cuid())
  entityType          EntityType
  entityId            String
  requestedBy         String
  requestedAt         DateTime       @default(now())
  scheduledDeletionAt DateTime
  status              DeletionStatus @default(PENDING)
  completedBy         String?
  completedAt         DateTime?
}

enum EntityType {
  USER
  ORGANIZATION
}

enum DeletionStatus {
  PENDING
  CANCELLED
  COMPLETED
}

// ─────────────────────────────────────────────────────────────
// 5. Patient Health Data
// ─────────────────────────────────────────────────────────────

model ClinicalMeasurement {
  id             String            @id @default(cuid())
  organizationId String?
  patientId      String
  measuredAt     DateTime
  source         MeasurementSource

  heightCm      Float?
  weightKg      Float?
  waistCm       Float?
  systolicBp    Int?
  diastolicBp   Int?
  triglycerides Float?
  hdl           Float?
  glucose       Float?
  insulin       Float?
  hba1c         Float?

  @@index([patientId, measuredAt])
}

enum MeasurementSource {
  SELF_REPORTED
  CLINICAL_VISIT
  LAB_RESULT
}

model PatientProfile {
  userId                  String   @id
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bloodType               String?
  allergies               String[]
  emergencyContactName    String?
  emergencyContactPhone   String?
  insuranceProvider       String?
  insurancePolicyNumber   String?
  smokingStatus           String?
  alcoholConsumption      String?
  dietaryRestrictions     String[]
  languagePreference      String?
  requiresGuardianConsent Boolean  @default(false)
  extended                Json?
}

model FamilyHistory {
  id        String  @id @default(cuid())
  patientId String
  condition String
  relation  String
  notes     String?
}

model Vaccination {
  id             String    @id @default(cuid())
  patientId      String
  vaccineName    String
  doseNumber     Int?
  administeredAt DateTime?
}

model HealthHistoryEvent {
  id                   String          @id @default(cuid())
  userId               String
  user                 User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType            HealthEventType
  title                String
  description          String?
  occurredAt           DateTime?
  approximateAge       Int?
  approximateTimeframe String?
  location             String?

  source                     HealthEventSource @default(SELF_REPORTED)
  appointmentId              String?
  prescriptionId             String?
  organizationId             String?
  upgradedFromSelfReportedAt DateTime?

  relatedConditionId String?
  status             HealthEventStatus @default(RESOLVED)
  createdAt          DateTime          @default(now())

  documents HealthHistoryDocument[]
}

enum HealthEventType {
  ILLNESS
  SURGERY
  HOSPITALIZATION
  INJURY
  DIAGNOSIS
  OTHER
}

enum HealthEventStatus {
  RESOLVED
  ONGOING
  CHRONIC
}

enum HealthEventSource {
  SELF_REPORTED
  SYSTEM_VERIFIED
}

model HealthHistoryDocument {
  id                   String             @id @default(cuid())
  healthHistoryEventId String
  event                HealthHistoryEvent @relation(fields: [healthHistoryEventId], references: [id], onDelete: Cascade)
  fileUrl              String
  documentType         String
  uploadedAt           DateTime           @default(now())
}

model MonitoringType {
  id            String  @id @default(cuid())
  code          String  @unique
  name          String
  unit          String?
  payloadSchema Json

  monitoringPlans MonitoringPlan[]
  monitoringLogs  MonitoringLog[]
}

model MonitoringPlan {
  id                 String         @id @default(cuid())
  patientId          String
  relatedConditionId String?
  monitoringTypeId   String
  monitoringType     MonitoringType @relation(fields: [monitoringTypeId], references: [id])
  prescribedBy       String?
  frequency          String
  targetMin          Float?
  targetMax          Float?
  isActive           Boolean        @default(true)
  createdAt          DateTime       @default(now())
}

model MonitoringLog {
  id               String         @id @default(cuid())
  patientId        String
  monitoringPlanId String?
  monitoringTypeId String
  monitoringType   MonitoringType @relation(fields: [monitoringTypeId], references: [id])
  loggedAt         DateTime
  payload          Json
  isAbnormal       Boolean?
  createdAt        DateTime       @default(now())

  @@index([patientId, monitoringTypeId, loggedAt])
}

model Routine {
  id             String       @id @default(cuid())
  organizationId String?
  userId         String
  type           ActivityType
  name           String
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())

  items RoutineItem[]
}

model RoutineItem {
  id        String  @id @default(cuid())
  routineId String
  routine   Routine @relation(fields: [routineId], references: [id], onDelete: Cascade)
  order     Int
  label     String
  startTime String? // e.g. "07:00"
  endTime   String? // e.g. "09:00"
  payload   Json

  completions RoutineCompletion[]
  mealFoods   MealItemFood[]
}

model ActivityLog {
  id             String       @id @default(cuid())
  organizationId String?
  userId         String
  type           ActivityType
  loggedAt       DateTime
  payload        Json
  routineItemId  String?
  wasModified    Boolean      @default(false)
  createdAt      DateTime     @default(now())

  @@index([userId, type, loggedAt])
}

enum ActivityType {
  EXERCISE
  MEDICINE
  STEP
  FOOD
}

model RoutineCompletion {
  id            String           @id @default(cuid())
  routineItemId String
  routineItem   RoutineItem      @relation(fields: [routineItemId], references: [id], onDelete: Cascade)
  date          DateTime
  completedAt   DateTime?
  status        CompletionStatus

  @@unique([routineItemId, date])
}

enum CompletionStatus {
  DONE
  SKIPPED
  NOT_YET
}

// ─────────────────────────────────────────────────────────────
// 6. Blood Donation System
// ─────────────────────────────────────────────────────────────

model BloodDonorProfile {
  id               String    @id @default(cuid())
  userId           String    @unique
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bloodType        BloodType
  isAvailable      Boolean   @default(true)
  lastDonationDate DateTime?
  eligibleFromDate DateTime?
  district         String?

  @@index([bloodType, isAvailable, district])
}

enum BloodType {
  A_POS
  A_NEG
  B_POS
  B_NEG
  AB_POS
  AB_NEG
  O_POS
  O_NEG
}

model ContactShareRequest {
  id                       String        @id @default(cuid())
  requesterId              String
  donorProfileId           String
  fieldsRequested          String[]
  fieldsShared             String[]
  status                   RequestStatus @default(PENDING)
  disclaimerAcknowledgedAt DateTime?
  createdAt                DateTime      @default(now())
  respondedAt              DateTime?
}

enum RequestStatus {
  PENDING
  APPROVED
  DECLINED
}

model BloodRequestPost {
  id              String         @id @default(cuid())
  requesterId     String
  bloodTypeNeeded BloodType
  unitsNeeded     Int            @default(1)
  urgency         RequestUrgency
  hospitalContext String?
  notes           String?
  status          PostStatus     @default(OPEN)
  expiresAt       DateTime?
  createdAt       DateTime       @default(now())

  applications DonationApplication[]
}

enum RequestUrgency {
  CRITICAL
  URGENT
  ROUTINE
}

enum PostStatus {
  OPEN
  FULFILLED
  EXPIRED
  CANCELLED
}

model DonationApplication {
  id                       String            @id @default(cuid())
  bloodRequestPostId       String
  bloodRequestPost         BloodRequestPost  @relation(fields: [bloodRequestPostId], references: [id], onDelete: Cascade)
  donorUserId              String
  message                  String?
  status                   ApplicationStatus @default(PENDING)
  disclaimerAcknowledgedAt DateTime?
  appliedAt                DateTime          @default(now())
  respondedAt              DateTime?

  @@unique([bloodRequestPostId, donorUserId])
}

enum ApplicationStatus {
  PENDING
  ACCEPTED_BY_REQUESTER
  DECLINED
  WITHDRAWN
}

// ─────────────────────────────────────────────────────────────
// 7. Appointment & Queue System
// ─────────────────────────────────────────────────────────────

model DoctorSchedule {
  id                          String       @id @default(cuid())
  doctorUserId                String
  organizationId              String
  assumedVisitDurationMinutes Int
  approvalMode                ApprovalMode @default(AUTO)
  workingDays                 String[]
  startTime                   String
  endTime                     String
  isActive                    Boolean      @default(true)

  @@unique([doctorUserId, organizationId])
}

enum ApprovalMode {
  AUTO
  MANUAL
}

model AppointmentQueue {
  id                   String   @id @default(cuid())
  doctorUserId         String
  organizationId       String
  queueDate            DateTime
  nextSerialNumber     Int      @default(1)
  currentQueuePosition Int      @default(0)

  appointments Appointment[]

  @@unique([doctorUserId, organizationId, queueDate])
}

model Appointment {
  id             String           @id @default(cuid())
  organizationId String
  organization   Organization     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  patientId      String
  queueId        String
  queue          AppointmentQueue @relation(fields: [queueId], references: [id])

  status          AppointmentStatus @default(PENDING)
  requestedAt     DateTime          @default(now())
  bookingChannel  BookingChannel    @default(SELF_BOOKED)
  bookedByStaffId String?

  serialNumber      Int?
  queuePosition     Int?
  bookedSlotTime    DateTime?
  estimatedSlotTime DateTime?

  isLate          Boolean   @default(false)
  skipCount       Int       @default(0)
  confirmedBy     String?
  confirmedAt     DateTime?
  prescriptionId  String?
  cancelledAt     DateTime?
  cancelledReason String?

  doctors    AppointmentDoctor[]
  skipEvents AppointmentSkipEvent[]

  // Prescription relation from old schema
  prescriptions Prescription[]

  @@unique([queueId, serialNumber])
}

enum AppointmentStatus {
  PENDING
  BOOKED
  PRESCRIBED
  CANCELLED
  DID_NOT_VISIT
}

enum BookingChannel {
  SELF_BOOKED
  WALK_IN
}

model AppointmentDoctor {
  id            String                 @id @default(cuid())
  appointmentId String
  appointment   Appointment            @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  doctorUserId  String
  role          DoctorRole
  status        DoctorAssignmentStatus @default(CONFIRMED)
  assignedBy    String?
  respondedAt   DateTime?

  @@unique([appointmentId, doctorUserId])
}

enum DoctorRole {
  PRIMARY
  CONSULTING
  SUBSTITUTE
}

enum DoctorAssignmentStatus {
  PENDING_PATIENT_APPROVAL
  CONFIRMED
  REJECTED
}

model AppointmentSkipEvent {
  id                    String      @id @default(cuid())
  appointmentId         String
  appointment           Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  skippedAt             DateTime    @default(now())
  previousQueuePosition Int
  newQueuePosition      Int
}

model QueueDisruption {
  id          String           @id @default(cuid())
  queueId     String
  reason      String?
  action      DisruptionAction
  initiatedBy String
  createdAt   DateTime         @default(now())
}

enum DisruptionAction {
  CANCEL_ALL
  MANUAL_RESCHEDULE
  BULK_TRANSFER
}

model RescheduleOffer {
  id                    String      @id @default(cuid())
  originalAppointmentId String
  proposedDate          DateTime
  proposedTime          DateTime?
  status                OfferStatus @default(PENDING)
  respondedAt           DateTime?
}

enum OfferStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model EmergencyCase {
  id               String            @id @default(cuid())
  organizationId   String
  patientId        String?
  reportedByUserId String?
  assignedDoctorId String?
  assignedStaffId  String?
  severity         EmergencySeverity
  status           EmergencyStatus   @default(REPORTED)
  description      String?
  reportedAt       DateTime          @default(now())
  respondedAt      DateTime?
  resolvedAt       DateTime?
}

enum EmergencySeverity {
  CRITICAL
  SEVERE
  MODERATE
}

enum EmergencyStatus {
  REPORTED
  DISPATCHED
  IN_PROGRESS
  RESOLVED
  CANCELLED
}

model AppointmentNotification {
  id            String             @id @default(cuid())
  appointmentId String
  notifiedAt    DateTime           @default(now())
  reason        NotificationReason
  wasSent       Boolean            @default(false)
}

enum NotificationReason {
  ESTIMATION_UPDATED
  QUEUE_DISRUPTED
  RESCHEDULE_OFFERED
  SUBSTITUTE_OFFERED
}

// ─────────────────────────────────────────────────────────────
// 8. Prescriptions
// ─────────────────────────────────────────────────────────────

model Prescription {
  id            String      @id @default(cuid())
  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  patientId String
  doctorId  String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  medicines         PrescriptionMedicine[]
  items             PrescriptionItem[]
}

model PrescriptionMedicine {
  id             String       @id @default(cuid())
  prescriptionId String
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medicineName   String
  dosage         String
  frequency      String
  duration       String
}

model PrescriptionItem {
  id             String       @id @default(cuid())
  prescriptionId String
  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  category       String // "diet" | "habit" | "medicalTest" | "supplement"
  value          String
}

model MedicalCondition {
  id            String    @id @default(cuid())
  userId        String
  conditionName String
  diagnosisDate DateTime?
}

model Medicine {
  id             String @id @default(cuid())
  medicineName   String
  producerName   String
  coreIngredient String
}

model Food {
  id            String       @id @default(cuid())
  foodName      String       @unique
  category      FoodCategory @default(OTHER)
  imageUrl      String?
  caloriePerG   Float
  proteinMgPerG Float        @default(0)
  fatMgPerG     Float        @default(0)
  carbMgPerG    Float        @default(0)
  vitaminMgPerG Float        @default(0)
  mineralMgPerG Float        @default(0)
  waterMgPerG   Float        @default(0)
  source        FoodSource   @default(LOCAL_SEED)
  externalId    String?      // USDA FDC ID or external catalog ID
  isVerified    Boolean      @default(true)
  createdAt     DateTime     @default(now())

  mealFoods  MealItemFood[]
  logEntries FoodLogEntry[]

  @@index([foodName])
  @@index([category])
  @@unique([source, externalId])
}

enum FoodCategory {
  MEAT
  POULTRY
  FISH
  EGG
  DAIRY
  FRUIT
  VEGETABLE
  LEGUME
  GRAIN
  NUT_SEED
  OTHER
}

enum FoodSource {
  USDA
  LOCAL_SEED
  USER_SUBMITTED
}

model MealItemFood {
  id            String      @id @default(cuid())
  routineItemId String
  routineItem   RoutineItem @relation(fields: [routineItemId], references: [id], onDelete: Cascade)
  foodId        String
  food          Food        @relation(fields: [foodId], references: [id], onDelete: Cascade)
  amountGrams   Float
}

model FoodLogEntry {
  id          String   @id @default(cuid())
  userId      String
  foodId      String
  food        Food     @relation(fields: [foodId], references: [id], onDelete: Cascade)
  amountGrams Float
  loggedAt    DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([userId, loggedAt])
}

model UserSettings {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  showConfirmModal    Boolean  @default(true)
  enableNotifications Boolean  @default(true)
  preferredLanguage   String   @default("en")
  theme               String   @default("light")
  updatedAt           DateTime @updatedAt
}

// ─────────────────────────────────────────────────────────────
// 9. External Identity Linking (OneID / NID)
// ─────────────────────────────────────────────────────────────

model ExternalIdentity {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider   String
  externalId String
  verifiedAt DateTime?
  linkedAt   DateTime  @default(now())
  rawPayload Json?

  @@unique([provider, externalId])
  @@index([userId])
}

// ─────────────────────────────────────────────────────────────
// Old Schema Models (Retained for AI and Subscription features)
// ─────────────────────────────────────────────────────────────

model Review {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  authorId String
  author   User   @relation("ReviewAuthor", fields: [authorId], references: [id], onDelete: Cascade)

  subjectId String
  subject   User   @relation("ReviewSubject", fields: [subjectId], references: [id], onDelete: Cascade)

  rating   Int
  comment  String?
  verified Boolean @default(false)

  createdAt DateTime @default(now())

  @@index([organizationId])
  @@index([subjectId])
}

model HealthDiaryEntry {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  bloodPressure String?
  heartRate     Int?
  painLevel     Int?
  mood          String?
  sleepHours    Float?
  appetite      String?
  notes         String?

  loggedAt  DateTime @default(now())
  createdAt DateTime @default(now())

  @@index([userId])
}

model AIConfiguration {
  id             String       @id @default(cuid())
  organizationId String       @unique
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  mode              String   @default("marketplace")
  byokProvider      String?
  byokKeyCiphertext String?
  installedAgents   String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Subscription {
  id             String       @id @default(cuid())
  organizationId String       @unique
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  plan   String
  status String @default("active")

  currentPeriodEnd DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─────────────────────────────────────────────────────────────
// 10. Cross-Tenant Consent (Patient-Owned Data Access)
// ─────────────────────────────────────────────────────────────

model ConsentGrant {
  id String @id @default(cuid())

  patientId String
  patient   User   @relation("ConsentGrantsAsPatient", fields: [patientId], references: [id], onDelete: Cascade)

  granteeOrganizationId String
  granteeOrganization   Organization @relation("ConsentGrantsReceived", fields: [granteeOrganizationId], references: [id], onDelete: Cascade)

  // null = grant covers the patient's full cross-tenant history;
  // set  = grant scoped to data originating from one specific organization
  sourceOrganizationId String?
  sourceOrganization   Organization? @relation("ConsentGrantsSourced", fields: [sourceOrganizationId], references: [id], onDelete: Cascade)

  // Data categories covered — e.g. ["HEALTH_HISTORY","PRESCRIPTIONS","CLINICAL_MEASUREMENTS","MONITORING_LOGS"]
  scope String[]

  status ConsentStatus @default(ACTIVE)

  grantedAt DateTime  @default(now())
  revokedAt DateTime?
  revokedBy String? // normally patientId; platform owner only on a compliance action

  expiresAt DateTime? // optional time-boxed consent; null = until explicitly revoked

  events     ConsentGrantEvent[]
  accessLogs ConsentAccessLog[]

  @@index([patientId, status])
  @@index([granteeOrganizationId, status])
}

enum ConsentStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

model ConsentGrantEvent {
  id             String       @id @default(cuid())
  consentGrantId String
  consentGrant   ConsentGrant @relation(fields: [consentGrantId], references: [id], onDelete: Cascade)

  action    ConsentAction // GRANTED | REVOKED | EXPIRED | SCOPE_MODIFIED
  actorId   String // who performed the action — normally the patient
  reason    String?
  createdAt DateTime @default(now())
}

enum ConsentAction {
  GRANTED
  REVOKED
  EXPIRED
  SCOPE_MODIFIED
}

model ConsentAccessLog {
  id String @id @default(cuid())

  consentGrantId String? // null if denied — no matching active grant existed
  consentGrant   ConsentGrant? @relation(fields: [consentGrantId], references: [id], onDelete: SetNull)

  patientId                String
  requestingOrganizationId String
  requestingActorId        String // staff userId, or the AI agent's identifier
  actorType                AccessActorType // HUMAN | AI_AGENT

  dataCategory String
  wasPermitted Boolean
  denialReason String?
  accessedAt   DateTime @default(now())

  @@index([patientId, accessedAt])
  @@index([requestingOrganizationId, accessedAt])
}

enum AccessActorType {
  HUMAN
  AI_AGENT
}


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
