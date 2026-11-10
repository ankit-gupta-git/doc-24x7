# DocPulse Web

The browser client for DocPulse, a doctor discovery and appointment-booking platform. It's a React + TypeScript single-page app that talks to the **DocPulse API** in [`../backend`](../backend). That's the same API and PostgreSQL database the mobile app uses, so accounts and bookings are shared between the two.

---

## Quick start

**Requirements:** Node.js 20.19+ and a running DocPulse API. See [backend/README.md](../backend/README.md); in short, `npm run dev` in `backend/` serves `http://localhost:4000/api/v1`.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The app calls `http://localhost:4000/api/v1` by default. To use a different API, copy `.env.example` to `.env` and set `VITE_API_URL`. The API's `CORS_ORIGINS` must include the web app's origin; `http://localhost:5173` is allowed by default.

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Lint with oxlint |

---

## Accounts

- **Patients** and **doctors** sign up at `/register`. A doctor chooses a specialty and a clinic, and their profile stays hidden from patients until an administrator verifies it.
- **Administrators** are created on the server with `npm run create-admin` in `backend/`.
- **Password reset:** "Forgot password" emails a single-use link to `/reset-password/:token`. In local development without SMTP, the backend prints the link to its log.
- **Changing your password** (Account Settings) signs you out on your other devices.

---

## Features

### Discovery (public)
- **Doctor search** (`/doctors`): search by name, specialty, clinic or city, with filters for specialty, city, minimum rating, minimum experience and maximum fee. Sorting and pagination happen on the server.
- **Doctor profiles:** qualifications, services, clinic, live 7-day availability, patient reviews, and review submission for signed-in patients (one per doctor, marked "verified visit" after a completed appointment).
- **Specialties and clinics** with detail pages, plus **universal search** (`/search`) across doctors, specialties and clinics.

### Booking (`BookingModal`)
1. Pick a date in the next 7 days and an open 30-minute slot. The grid comes from the server: booked, already-passed and non-working days are disabled, and times are local to the clinic.
2. Confirm your contact details and reason for visit.
3. Review. Payment is made at the clinic; there's no online payment.
4. Get a confirmation with a `BK-XXXXX` reference.

If someone else takes the slot first, the server answers `409` and the modal asks you to pick another time.

When the doctor offers it, step 1 also asks **Clinic visit** or **Video consultation**.

### Online video consultations (`/consultation/:id`)
- **Where to join:** video visits show Video visit" badge and a **Join Consultation** control on the patient dashboard (an "Upcoming Video Consultations" section), the appointments list, the doctor dashboard and the doctor's appointments page. Before the room opens, the control counts down using the server's clock, not the device's. The doctor's button reads **Start Consultation**.
- **Waiting room:** camera and microphone preview, mute and camera-off before joining, camera and microphone selection, and clear messages when permission is blocked, no device is found, or the device is in use. If the camera fails, you can join with audio only. There's also a privacy notice.
- **Call:** remote video with your own camera picture-in-picture, mute, camera on/off, device switching, and End. States shown: connecting, waiting for the other person (also when they drop out), reconnecting, camera off, and failed or ended with a Rejoin option. Patients **leave**; the doctor **ends** the consultation for both, which marks the visit completed.
- **Doctors** switch video visits on in **Schedule** (`/doctor/availability`) and can filter their appointments by Video or Clinic. Patients can filter search by "Video consult available".
- The page only works when the API has LiveKit configured (see [backend/README.md](../backend/README.md#online-video-consultations)); otherwise it says video isn't available. Browsers allow camera access only on `https://` pages or `http://localhost`.
- The video SDK (`livekit-client`) is used only in `src/video/callSession.ts` and is lazy-loaded with the consultation page.

**Testing locally:** run `livekit-server --dev`, set the three `LIVEKIT_*` values in `backend/.env`, and restart the API. Book a video visit as a patient for the next slot (the room opens 10 minutes before), then open it as that patient and as the doctor in two different browsers, or one normal and one private window.

### Patient
Dashboard, appointments by status, reschedule (with conflict checks), cancel with an optional reason, and account settings: profile and password.

### Doctor (`/doctor/*`)
Dashboard with stats and the patient queue, consultation fee editor, working days and 30-minute slots, and appointment search with complete/cancel. Unverified doctors see a "pending verification" notice.

### Admin (`/admin/*`)
Platform stats, doctor management (create, edit, verify, activate), user management (activate/deactivate, delete; never your own account), all bookings with status override, and create/edit/delete for specialties and clinics (blocked while doctors still use them).

---

## Routes

| Path | Page |
| :--- | :--- |
| `/` · `/doctors` · `/doctors/:id` | Home, search, doctor profile |
| `/specialties` · `/specialties/:slug` · `/clinics` · `/clinics/:id` · `/search` | Catalog and search |
| `/login` · `/register` · `/forgot-password` · `/reset-password/:token` | Auth |
| `/patient/dashboard` · `/patient/appointments` | Patient (patients only) |
| `/patient/profile` | Account settings (any signed-in user) |
| `/doctor/dashboard` · `/doctor/appointments` · `/doctor/availability` | Doctor portal |
| `/consultation/:id` | Video consultation room (the booked patient or assigned doctor) |
| `/admin/dashboard` · `/admin/doctors` · `/admin/users` · `/admin/appointments` · `/admin/specialties` · `/admin/clinics` | Admin |

Protected routes wait for the saved session to be restored before deciding, send signed-out users to `/login` (and back again afterwards), and send users with the wrong role to their own dashboard. The server enforces the same rules on every request.

---

## Structure

```
src/
├── api/
│   ├── contract.ts      # Shared request/response types (copied from backend/src/contract.ts)
│   ├── client.ts        # fetch wrapper: auth header, token refresh, ApiError
│   ├── endpoints.ts     # One function per API endpoint
│   ├── hooks.ts         # React Query hooks (queries + mutations with cache invalidation)
│   └── queryClient.ts
├── context/AuthContext.tsx   # Session restore, login/register/logout, profile
├── video/callSession.ts      # The only file that uses the video SDK (LiveKit)
├── components/          # Navbar, booking modals, SlotPicker, cards, portal UI, query states
│   └── consultation/    # ConsultationCard, JoinConsultationButton, WaitingRoom, VideoConsultationRoom, ConsultationControls, ConsultationStatus
├── pages/               # One component per route
└── types/index.ts       # Re-exports the contract types
```

**Sessions:** the API returns a 15-minute access token and a rotating refresh token, both kept in `localStorage`. The client refreshes automatically, retries a request once after a `401`, and signs you out if the refresh is rejected (expired, revoked or deactivated account).

**Stack:** React 19, TypeScript, Vite 8, React Router 7, TanStack Query 5, Tailwind CSS 4, lucide-react, GSAP, canvas-confetti and livekit-client.
