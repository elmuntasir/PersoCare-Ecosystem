# Mobile App for PersoCare – Plan & Agenda

We'll add a **mobile app** to the roadmap. Given that we already have a fully functional web app built with Next.js, the mobile app will be a **React Native** application that reuses the existing backend API (Next.js API routes + Supabase). This approach gives us a native feel on both iOS and Android with a single codebase.

---

## 1. Technology Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Framework** | React Native (Expo) | Cross‑platform (iOS + Android), fast development, large ecosystem. |
| **Navigation** | React Navigation | Standard for React Native, supports tab/stack/drawer. |
| **State Management** | React Context + Zustand | Lightweight, similar to web context. |
| **API Client** | Fetch / Axios | Consume existing Next.js API routes. |
| **Authentication** | Supabase Auth (with React Native SDK) | Same as web – seamless session sharing. |
| **Push Notifications** | Expo Notifications / Firebase Cloud Messaging | For appointment reminders, medicine alerts, etc. |
| **Offline Storage** | AsyncStorage / SQLite | Cache essential data (e.g., recent appointments). |
| **UI Library** | NativeBase / React Native Paper | Pre‑built components matching our design tokens. |

---

## 2. Core Features (Mirroring Web)

| Feature | Mobile Implementation |
| :--- | :--- |
| **Authentication** | Login, signup, password reset (same Supabase Auth). |
| **Dashboard** | Upcoming appointments, medicine adherence, AI insights. |
| **Appointments** | Search, book, view, reschedule (consume `/api/appointments`). |
| **Medicine Log** | Daily adherence, meal‑based scheduling, prescription integration. |
| **Diet & Exercise** | Food/exercise search via APIs, logging, calorie calculation. |
| **Blood Donation** | Search available blood, request, view donor contacts. |
| **Health Diary** | Quick note, mood/symptom tracking. |
| **Medical Records** | View prescriptions, lab reports, vaccination history. |
| **eKYC** | Selfie + NID capture using device camera (Didit SDK has React Native support). |
| **Profile & Settings** | User profile, role switching, language/theme preferences. |
| **AI Chatbot** | Floating chat with avatar animations (can be simplified). |

---

## 3. Integration with Existing Backend

- **All API endpoints** already exist as Next.js API routes (e.g., `/api/appointments`, `/api/medicine`, etc.). The mobile app will consume them via HTTP.
- **Authentication** uses Supabase JWT – the mobile app will store the session token and include it in `Authorization` headers.
- **Webhooks** (e.g., Didit) are already handled server‑side; no change needed for mobile.
- **Real‑time updates** (optional) – can be added via Supabase Realtime subscriptions.

---

## 4. Design & UX

- Follow the same **design tokens** (`--teal-900`, `--coral`, `--paper`, etc.) – we can define a similar theme in React Native.
- Use **bottom tab navigation** for main sections (Home, Appointments, Medicine, Profile).
- Adapt web components to mobile – e.g., cards become touchable, modals become full‑screen.
- Ensure **accessibility** and **touch‑friendly** targets.

---

## 5. Development Phases

| Phase | Duration | Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Setup & Auth** | 2 weeks | Project setup, navigation, login/signup, session persistence. |
| **Phase 2: Core Patient Features** | 4 weeks | Dashboard, appointments, medicine log, diet/exercise. |
| **Phase 3: Advanced Features** | 3 weeks | Blood donation, health diary, medical records, eKYC. |
| **Phase 4: AI & Chatbot** | 2 weeks | Floating chat, avatar integration (simplified). |
| **Phase 5: Polish & Testing** | 2 weeks | Offline support, push notifications, performance, beta testing. |

**Total estimated time:** ~13 weeks (3 months).

---

## 6. Resources Needed

| Resource | Requirement |
| :--- | :--- |
| **Developer** | 1 full‑time React Native developer (or me – I can handle it). |
| **Design** | UI/UX assets (can reuse web design, adapt to mobile). |
| **Testing** | Test on both iOS and Android simulators, plus real devices. |
| **App Store Accounts** | Apple Developer ($99/year) and Google Play ($25 one‑time). |

---

## 7. Key Considerations

### A. Offline Support
- Cache essential data (e.g., today’s appointments, medicine schedule) so users can view them offline.
- Use AsyncStorage or SQLite with SyncEngine.

### B. Push Notifications
- Reminders for upcoming appointments, medicine doses, blood donation requests.
- Use Expo Notifications (or Firebase) – we’ll need to implement a server endpoint to send notifications.

### C. eKYC on Mobile
- Didit provides a React Native SDK – we’ll integrate it for camera capture (selfie + NID) directly in the app.

### D. Performance
- Optimize images, lazy‑load heavy screens.
- Use Hermes engine for faster startup on Android.

### E. Security
- Store tokens securely (expo‑secure‑store).
- HTTPS only for API calls.

---

## 8. Agenda / Roadmap

We'll add the mobile app as a **Phase 2** milestone after the web app is fully stable and deployed.

**Updated Roadmap:**

| Milestone | Target Date | Status |
| :--- | :--- | :--- |
| Web App – v1.0 (MVP) | September 2026 | ✅ Completed (deployed) |
| Web App – v1.1 (eKYC) | October 2026 | In progress |
| Mobile App – Development | November 2026 – January 2027 | Planned |
| Mobile App – Beta & Store Submission | February 2027 | Planned |
| Mobile App – Launch | March 2027 | Planned |

---

## 9. Next Actions

- [ ] Create a new React Native (Expo) project.
- [ ] Set up Supabase Auth for React Native.
- [ ] Replicate the web navigation structure.
- [ ] Implement the first feature (Appointments) end‑to‑end.
- [ ] Design a shared UI kit matching PersoCare style.

---

## 10. Summary

| Feature | Mobile Implementation |
| :--- | :--- |
| **Tech Stack** | React Native (Expo) + Supabase + Next.js API |
| **Development Time** | ~3 months for a full‑featured app. |
| **Key Differentiators** | Native camera for eKYC, push notifications, offline support. |
| **Integration** | Reuse existing APIs; no backend changes needed. |

**We'll start planning the mobile app once the web eKYC is live.** 🚀