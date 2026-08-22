# Blood Donation System – Comprehensive Documentation

Based on the design doc you provided earlier, the **Blood Donation System** is fully defined in the architecture document. Here's the **complete documentation** of how it works, including all edge cases and scenarios.

---

## 1. Core Models (from `schema.prisma`)

```prisma
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

model ContactShareRequest {
  id                       String        @id @default(cuid())
  requesterId              String
  donorProfileId           String
  fieldsRequested          String[]      // ["phone", "email", "district"]
  fieldsShared             String[]      // what was actually shared
  status                   RequestStatus @default(PENDING)
  disclaimerAcknowledgedAt DateTime?
  createdAt                DateTime      @default(now())
  respondedAt              DateTime?
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

enum ApplicationStatus {
  PENDING
  ACCEPTED_BY_REQUESTER
  DECLINED
  WITHDRAWN
}

enum RequestStatus {
  PENDING
  APPROVED
  DECLINED
}
```

---

## 2. Intended Workflow

### A. User as a Blood Donor

| Step | Action                                                                | System Behavior                                                 |
| :--- | :-------------------------------------------------------------------- | :-------------------------------------------------------------- |
| 1    | User visits **Health Profile → Blood Donor Status**                   | Sees option to **"Register as a Blood Donor"**                  |
| 2    | User fills in: blood type, district, availability, last donation date | Creates `BloodDonorProfile` with `isAvailable: true`            |
| 3    | User's status is **"Pending Verification"**                           | Waiting for an **Organization (Hospital/Blood Bank)** to verify |
| 4    | Organization Admin verifies the donor                                 | Sets `isVerified: true` on donor profile (we'll add this field) |
| 5    | Donor can now appear in search results                                | Users searching for blood can find this donor                   |

**Edge Cases:**

- Donor is under 18 → system should block registration (age check from `User.dob`)
- Donor hasn't donated in the last 90 days → show warning but allow registration
- Donor is temporarily unavailable → can toggle `isAvailable: false`
- Donor's blood type is rare → show special badge in search results
- Donor has been inactive for > 1 year → auto-set `isAvailable: false` (cron job)

---

### B. User as a Blood Requester (Recipient)

| Step | Action                                                             | System Behavior                                           |
| :--- | :----------------------------------------------------------------- | :-------------------------------------------------------- |
| 1    | User visits **Blood Bank** page                                    | Sees search filters: Blood Group, District, Urgency       |
| 2    | User searches for blood                                            | Shows list of matching donors + open requests from others |
| 3    | User creates a **Blood Request Post**                              | `BloodRequestPost` created with `status: OPEN`            |
| 4    | The request appears in the **Blood Request Feed**                  | Other users can see it and apply to donate                |
| 5    | Potential donors click **"Apply to Donate"**                       | Creates `DonationApplication` with `status: PENDING`      |
| 6    | Requester reviews applications                                     | Can **ACCEPT** or **DECLINE** each application            |
| 7    | If accepted → `DonationApplication.status = ACCEPTED_BY_REQUESTER` | System notifies donor                                     |
| 8    | **Contact Sharing Flow** (Next Section)                            | Donor and requester can share contact info                |

**Edge Cases:**

- Request expires → if `expiresAt` passes, `status: EXPIRED`
- Requester cancels request → `status: CANCELLED`
- Multiple applications → requester can accept only one (others auto-declined once fulfilled)
- CRITICAL urgency → donors are notified via push notification/in-app alert
- Requester has no donor registration → can still request blood (as a patient)

---

### C. Contact Sharing Between Requester & Donor

| Step | Action                                                           | System Behavior                                             |
| :--- | :--------------------------------------------------------------- | :---------------------------------------------------------- |
| 1    | Requester accepts an application                                 | System creates a `ContactShareRequest`                      |
| 2    | Requester selects which fields to share (phone, email, district) | Fields stored in `fieldsRequested`                          |
| 3    | Donor receives notification → **"Accepts"** or **"Declines"**    | If accepted → `fieldsShared` populated with what was shared |
| 4    | Both parties can now see each other's contact info               | Via the request detail page                                 |
| 5    | After donation, both can mark the request as **FULFILLED**       | `BloodRequestPost.status = FULFILLED`                       |

**Edge Cases:**

- Donor declines contact sharing → request remains pending, requester can try another donor
- Donor shares contact but requester doesn't follow up → system sends reminder after 24h
- Donor reports harassment → admin can revoke contact sharing and ban the requester
- Multiple contacts shared → all sharing is logged for audit

---

### D. Organization (Hospital/Blood Bank) Role

| Step | Action                                                 | System Behavior                                       |
| :--- | :----------------------------------------------------- | :---------------------------------------------------- |
| 1    | Organization Admin creates a **Blood Bank Department** | `Department` with type `BLOOD_BANK` added to the org  |
| 2    | Admin can **Verify Donors**                            | Approve/Reject donor profiles for their organization  |
| 3    | Admin can **Manage Blood Requests**                    | View all requests, help connect donors and recipients |
| 4    | Admin can **Mark Donation Events**                     | Record donation events (blood units collected)        |
| 5    | Admin can **Generate Reports**                         | Donor stats, blood type inventory, etc.               |

**Edge Cases:**

- Organization doesn't have a Blood Bank → can still facilitate via a partnership with a nearby blood bank
- Multiple organizations can verify the same donor → `isVerified` is per-org, or we add a `OrganizationDonorVerification` table
- Admin can override contact sharing in emergency cases (with proper audit trail)

---

## 3. What We Need to Add

### A. Schema Additions

```prisma
model BloodDonorProfile {
  // ... existing fields
  isVerified      Boolean  @default(false)  // Verified by an organization
  verifiedBy      String?                   // Organization ID
  verifiedAt      DateTime?
  medicalConditions String?                 // e.g., "Hepatitis B" (not shown publicly)
}

model OrganizationDonorVerification {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  donorUserId    String
  donor          User     @relation(fields: [donorUserId], references: [id])
  status         VerificationStatus @default(PENDING)
  verifiedAt     DateTime?
  notes          String?
  createdAt      DateTime @default(now())

  @@unique([organizationId, donorUserId])
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

// Add Location model for vague location-based search
model District {
  id   String @id @default(cuid())
  name String @unique
  // Could be used for blood request filtering
}
```

### B. Additional Blood Request Fields

```prisma
model BloodRequestPost {
  // ... existing fields
  district      String?   // Vague location (not precise)
  patientName   String?   // If not the requester themselves
  patientAge    Int?
  patientGender String?
  contactPhone  String?   // Emergency contact (if different from requester)
}
```

---

## 4. Search & Filtering Logic

| Filter                 | How It Works                               |
| :--------------------- | :----------------------------------------- |
| **Blood Group**        | Exact match on `bloodType`                 |
| **District**           | Match on `district` field (vague, not GPS) |
| **Urgency**            | Filter by `CRITICAL`, `URGENT`, `ROUTINE`  |
| **Open Requests Only** | `status: OPEN`                             |
| **Donor Availability** | `isAvailable: true` AND `isVerified: true` |
| **Eligible Donors**    | `eligibleFromDate <= NOW()`                |

**Recommended UI:**

- Show **Open Requests** first (with urgency badges)
- Then show **Available Donors** (filterable by blood type)
- Highlight **Critical** requests with red badge
- Show **Urgent** with orange badge

---

## 5. Notification Triggers

| Event                          | Who Gets Notified                        | How          |
| :----------------------------- | :--------------------------------------- | :----------- |
| New Critical Blood Request     | All donors in that district + blood type | Push + Email |
| New Urgent Blood Request       | Donors in that district + blood type     | Push + Email |
| Donor Applied                  | Requester                                | Push + Email |
| Requester Accepted Application | Donor                                    | Push + Email |
| Contact Sharing Request        | Donor                                    | Push + Email |
| Contact Sharing Accepted       | Requester                                | Push + Email |
| Request Fulfilled              | All applicants                           | Push + Email |
| Request Expired                | Requester                                | Email (once) |

---

## 6. Security & Privacy

| Concern                        | Solution                                                                         |
| :----------------------------- | :------------------------------------------------------------------------------- |
| **Donor phone number privacy** | Only shared after explicit consent via `ContactShareRequest`                     |
| **Fake requests**              | Requester must be a verified user (patient or caregiver)                         |
| **Fake donors**                | Must be verified by an organization (Hospital/Blood Bank)                        |
| **Harassment**                 | Reporting system with admin review, ability to block users                       |
| **Emergency override**         | Admin can share contact info in life-threatening situations (audit log required) |

---

## 7. Edge Case Summary

| Scenario                                | System Response                                             |
| :-------------------------------------- | :---------------------------------------------------------- |
| Donor is not verified                   | Shown in search as "Pending Verification"                   |
| Donor hasn't donated in 90 days         | Shown with warning badge, but still eligible                |
| Donor is under 18                       | Cannot register as donor                                    |
| Requester has no blood bank in district | Can still create request, but search may show fewer results |
| Multiple donors apply                   | Requester can accept only one; others auto-declined         |
| Request expires                         | `status: EXPIRED`, no further applications allowed          |
| Requester cancels request               | All applications auto-declined                              |
| Contact sharing declined                | Requester can try another donor                             |
| Donor reports harassment                | Admin can revoke contact sharing, ban requester             |
| Organization verifies donor             | `isVerified: true`; donor appears in search                 |

---

## 8. Implementation Priority

| Phase       | Features                                                   |
| :---------- | :--------------------------------------------------------- |
| **Phase 1** | Donor registration, verification, search, request creation |
| **Phase 2** | Donation application flow, contact sharing                 |
| **Phase 3** | Organization verification, reporting, notifications        |
| **Phase 4** | Admin dashboards, analytics, donor management              |

---

**This is the complete documentation of the blood donation system based on our discussions.** 🩸
