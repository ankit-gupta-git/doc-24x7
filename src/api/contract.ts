/**
 * DocPulse API contract (v1): request and response shapes for every endpoint.
 *
 * This file is dependency-free on purpose. It is copied verbatim into
 * `frontend/src/api/contract.ts` and `mobile/src/api/contract.ts` so the web
 * app, the mobile app and the server agree on one set of types.
 * After changing it, copy it to both clients again.
 *
 * Conventions
 * - Base path: `/api/v1`. JSON in, JSON out.
 * - Auth: `Authorization: Bearer <accessToken>` on protected routes.
 * - Errors: non-2xx responses always have the shape `ApiErrorBody`.
 * - Dates: `YYYY-MM-DD` calendar dates and `"hh:mm AM"` slot labels are wall-clock
 *   times in the clinic's `timezone`. Timestamps are ISO-8601 strings.
 */

export type UserRole = 'patient' | 'doctor' | 'admin';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
export type PaymentStatus = 'pay_at_clinic' | 'paid';
export type ConsultationMode = 'in_person' | 'online';
export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// ---------- Errors ----------

export type ApiErrorCode =
  | 'VALIDATION_ERROR' // 400, `details` holds field errors
  | 'UNAUTHENTICATED' // 401, missing/expired/invalid token or bad credentials
  | 'FORBIDDEN' // 403, signed in but not allowed
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409, e.g. email taken, slot already booked
  | 'UNPROCESSABLE' // 422, business rule violated (e.g. non-working day)
  | 'RATE_LIMITED' // 429
  | 'SERVICE_UNAVAILABLE' // 503, e.g. video consultations not configured on the server
  | 'INTERNAL'; // 500

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Field path -> message, for VALIDATION_ERROR. */
    details?: Record<string, string>;
  };
}

// ---------- Entities ----------

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  gender: Gender | null;
  address: string | null;
  /** Doctor profile id for doctor accounts. */
  doctorId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  popular: boolean;
  /** Active, verified doctors listed under this specialty. */
  doctorCount: number;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  timezone: string;
  phone: string;
  email: string;
  openHours: string;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  services: string[];
  establishedYear: number | null;
  /** Active, verified doctors affiliated with the clinic. */
  doctorCount: number;
}

export interface Doctor {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  specialtyId: string;
  specialty: string;
  specialtySlug: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  city: string;
  timezone: string;
  qualifications: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  languages: string[];
  about: string;
  services: string[];
  availableDays: Weekday[];
  timeSlots: string[];
  profileImageUrl: string | null;
  /** Accepts online video consultations as well as clinic visits. */
  offersOnlineConsultation: boolean;
  isVerified: boolean;
  isActive: boolean;
}

export interface Review {
  id: string;
  doctorId: string;
  patientName: string;
  rating: number;
  comment: string;
  verifiedVisit: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  bookingRef: string; // BK-12345
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImageUrl: string | null;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  timezone: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // "10:30 AM"
  status: AppointmentStatus;
  consultationFee: number;
  paymentStatus: PaymentStatus;
  reason: string;
  notes: string;
  cancellationReason: string | null;
  /** 'in_person' for every appointment booked before online consultations existed. */
  consultationMode: ConsultationMode;
  /** Online visits only: when the doctor first joined / ended the video call. */
  consultationStartedAt: string | null;
  consultationEndedAt: string | null;
  createdAt: string;
}

export type SlotState = 'available' | 'booked' | 'past';

export interface AvailabilityDay {
  date: string; // YYYY-MM-DD
  weekday: Weekday;
  isWorkingDay: boolean;
  slots: { slot: string; state: SlotState }[];
}

export interface Availability {
  doctorId: string;
  timezone: string;
  days: AvailabilityDay[];
}

export interface AdminStats {
  totalDoctors: number;
  activeDoctors: number;
  pendingDoctors: number; // not yet verified
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  /** Sum of consultation fees of completed appointments. */
  completedRevenue: number;
  totalClinics: number;
  totalSpecialties: number;
}

export interface DoctorStats {
  todayVisits: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  /** Sum of fees of completed visits. */
  completedRevenue: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------- Auth ----------

export interface AuthSession {
  user: User;
  accessToken: string;
  /** Opaque, single-use: every refresh returns a new one and revokes the old. */
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
}

/** POST /auth/register (public) -> 201 AuthSession */
export interface RegisterRequest {
  name: string;
  email: string;
  /** Min 8 chars, at least one letter and one number. */
  password: string;
  phone?: string;
  role: 'patient' | 'doctor';
  /** Required when role = doctor. Doctor profiles start unverified. */
  specialtyId?: string;
  clinicId?: string;
}

/** POST /auth/login (public) -> 200 AuthSession | 401 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/refresh (public) -> 200 AuthSession | 401 */
export interface RefreshRequest {
  refreshToken: string;
}

/** POST /auth/logout (public) -> 204. Revokes the refresh token. */
export type LogoutRequest = RefreshRequest;

/** GET /auth/me -> 200 User.  PATCH /auth/me -> 200 User */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
}

/** POST /auth/change-password -> 204. Revokes all other sessions. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** POST /auth/forgot-password (public) -> 202 always (doesn't reveal whether the email exists). */
export interface ForgotPasswordRequest {
  email: string;
}

/** GET /auth/reset-password/:token (public) -> 200 { email } | 400 */
export interface ResetTokenInfo {
  email: string;
}

/** POST /auth/reset-password (public) -> 204. Revokes all sessions of that user. */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ---------- Public catalog ----------

/**
 * GET /doctors -> 200 Paginated<Doctor>
 * Only active + verified doctors. Admins use GET /admin/doctors for everyone.
 */
export interface DoctorQuery {
  search?: string;
  specialty?: string; // slug
  city?: string;
  minRating?: number;
  minExperience?: number;
  maxFee?: number;
  /** Only doctors who offer online video consultations. */
  online?: boolean;
  sortBy?: 'recommended' | 'rating' | 'experience' | 'fee_asc' | 'fee_desc';
  page?: number; // default 1
  pageSize?: number; // default 20, max 100
}

// GET /doctors/:id                 -> 200 Doctor (404 if inactive/unverified, unless admin or own profile)
// GET /doctors/:id/reviews         -> 200 Review[]
// GET /doctors/:id/availability?from=YYYY-MM-DD&days=7 -> 200 Availability (days 1..14, from defaults to today in clinic tz)
// GET /doctors/meta/cities         -> 200 string[]
// GET /specialties                 -> 200 Specialty[]
// GET /specialties/:slug           -> 200 Specialty
// GET /clinics                     -> 200 Clinic[]
// GET /clinics/:id                 -> 200 Clinic
// GET /clinics/:id/doctors         -> 200 Doctor[]
// GET /search?q=                   -> 200 SearchResults

export interface SearchResults {
  doctors: Doctor[];
  specialties: Specialty[];
  clinics: Clinic[];
}

/** POST /doctors/:id/reviews (patient) -> 201 Review | 409 if already reviewed */
export interface CreateReviewRequest {
  rating: number; // 1..5
  comment: string; // 10..1000 chars
}

// ---------- Appointments ----------

/**
 * POST /appointments (patient) -> 201 Appointment
 * 409 CONFLICT when the slot was taken; 422 for non-working day / past slot / slot not offered.
 */
export interface BookAppointmentRequest {
  doctorId: string;
  appointmentDate: string;
  timeSlot: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string; // 5..500
  notes?: string;
  /** Defaults to 'in_person'. 'online' needs a doctor with `offersOnlineConsultation`. */
  consultationMode?: ConsultationMode;
}

/**
 * GET /appointments -> 200 Paginated<Appointment>
 * Scoped by role: patients see their own, doctors see their practice's, admins see all.
 */
export interface AppointmentQuery {
  status?: AppointmentStatus;
  search?: string; // patient/doctor name, booking ref, reason
  from?: string; // YYYY-MM-DD inclusive
  to?: string;
  /** Narrow to one doctor / patient (useful for admins; never widens a user's scope). */
  doctorId?: string;
  patientId?: string;
  consultationMode?: ConsultationMode;
  page?: number;
  pageSize?: number; // default 50, max 200
}

// GET /appointments/:id -> 200 Appointment (owner patient, the doctor, or admin; else 404)

/** POST /appointments/:id/reschedule (owner patient or admin) -> 200 Appointment | 409 | 422 */
export interface RescheduleRequest {
  appointmentDate: string;
  timeSlot: string;
}

/** POST /appointments/:id/cancel (owner patient, the doctor, or admin) -> 200 Appointment */
export interface CancelRequest {
  reason?: string;
}

/**
 * POST /appointments/:id/complete (the doctor or admin) -> 200 Appointment
 *
 * PATCH /appointments/:id/status (admin only) -> 200 Appointment
 * Admin override to any status; restoring a cancelled visit is refused (409) if its slot was rebooked.
 */
export interface SetStatusRequest {
  status: AppointmentStatus;
  reason?: string;
}

// ---------- Online video consultations ----------

/**
 * Server-side lifecycle of an online visit, derived from the appointment:
 * - scheduled:   upcoming, the join window hasn't opened yet
 * - open:        inside the join window; patient and doctor can join
 * - in_progress: the doctor has joined (patients joining earlier wait in the room)
 * - ended:       the doctor ended the call, or the visit was marked completed
 * - missed:      the join window closed without the consultation starting
 * - cancelled:   the appointment was cancelled
 * Client-only call states (connecting, reconnecting, failed) are not stored.
 */
export type ConsultationStatus = 'scheduled' | 'open' | 'in_progress' | 'ended' | 'missed' | 'cancelled';

/**
 * GET /appointments/:id/consultation -> 200 Consultation
 * The booked patient, the assigned doctor, or an admin (read-only); others get 404.
 * 422 for in-person appointments.
 */
export interface Consultation {
  appointmentId: string;
  status: ConsultationStatus;
  /** Join window, computed on the server from the slot and the clinic time zone. */
  joinOpensAt: string;
  joinClosesAt: string;
  /** Server clock when this response was built, so clients can count down without trusting the device clock. */
  serverTime: string;
  startedAt: string | null;
  endedAt: string | null;
  /** True when the signed-in user may call /join right now. */
  canJoin: boolean;
  /** Why `canJoin` is false, written to be shown to users. */
  joinBlockedReason: string | null;
  /** False when the server has no video provider configured (join would answer 503). */
  videoAvailable: boolean;
}

/**
 * POST /appointments/:id/consultation/join (booked patient or assigned doctor) -> 200 ConsultationJoin
 * Issues a short-lived token for this appointment's room only. Safe to call repeatedly (always the same room).
 * The doctor's first join starts the consultation.
 * 403 admin/other roles, 404 not yours, 409 cancelled/ended, 422 outside the join window or in-person, 503 not configured.
 */
export interface ConsultationJoin {
  provider: 'livekit';
  /** WebSocket URL of the video server. */
  serverUrl: string;
  /** Room access token: room-scoped, short-lived. Never log or persist it. */
  token: string;
  /** When the token stops being accepted for (re)connecting. */
  expiresAt: string;
  /** This participant's identity in the room, and the other participant's. */
  identity: string;
  remoteIdentity: string;
  role: 'patient' | 'doctor';
  consultation: Consultation;
}

// POST /appointments/:id/consultation/end (assigned doctor) -> 200 Appointment
// Ends the call for everyone and marks the visit completed. Repeating it is a no-op.

// ---------- Prescriptions ----------

/** One medicine line. Only `name` is required; the rest are free text as the doctor writes it. */
export interface PrescriptionMedicine {
  name: string; // 1..100
  dosage: string; // e.g. "500 mg", 0..60
  frequency: string; // e.g. "1-0-1" or "Twice a day", 0..60
  duration: string; // e.g. "5 days", 0..60
  instructions: string; // e.g. "After food", 0..120
}

export interface PrescriptionInput {
  diagnosis: string; // 0..300
  medicines: PrescriptionMedicine[]; // 0..15
  advice: string; // 0..1000
  /** YYYY-MM-DD, or null for no follow-up. */
  followUpDate: string | null;
}

/**
 * A prescription written during an online consultation. The doctor writes a draft during the call
 * (shown live to the patient) and it's issued when the consultation ends. Issued prescriptions are final.
 */
export interface Prescription extends PrescriptionInput {
  id: string;
  appointmentId: string;
  bookingRef: string;
  status: 'draft' | 'issued';
  doctorName: string;
  doctorSpecialty: string;
  clinicName: string;
  clinicAddress: string;
  patientName: string;
  /** The consultation date (clinic time zone). */
  appointmentDate: string;
  issuedAt: string | null;
  updatedAt: string;
}

/**
 * GET /appointments/:id/prescription -> 200 { prescription: Prescription | null }
 * The assigned doctor sees drafts; the patient and admins see only issued prescriptions (null until then).
 *
 * PUT /appointments/:id/prescription (assigned doctor) body SavePrescriptionRequest -> 200 Prescription
 * Saves the draft; `issue: true` also issues it (needs a diagnosis or at least one medicine).
 * 409 cancelled or already issued, 422 in-person visit or the consultation hasn't started.
 */
export interface SavePrescriptionRequest extends PrescriptionInput {
  issue?: boolean;
}

// ---------- Doctor portal (role = doctor) ----------

// GET  /doctor/me          -> 200 { doctor: Doctor; stats: DoctorStats }
// PATCH /doctor/me/fee     -> 200 Doctor
export interface UpdateFeeRequest {
  consultationFee: number; // 10..1000
}
// PUT  /doctor/me/availability -> 200 Doctor
export interface UpdateAvailabilityRequest {
  availableDays: Weekday[]; // at least one
  timeSlots: string[]; // at least one, "hh:mm AM" on a 30-minute boundary
  /** Omit to leave unchanged. Existing online bookings are kept when switched off. */
  offersOnlineConsultation?: boolean;
}
// PATCH /doctor/me/profile -> 200 Doctor
export interface UpdateDoctorProfileRequest {
  about?: string;
  phone?: string;
  qualifications?: string[];
  languages?: string[];
  services?: string[];
}

// ---------- Admin (role = admin) ----------

// GET /admin/stats -> 200 AdminStats

/** GET /admin/doctors -> 200 Paginated<Doctor> (includes inactive and unverified) */
export interface AdminDoctorQuery {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'unverified';
  page?: number;
  pageSize?: number;
}

/** POST /admin/doctors -> 201 Doctor (directory profile without a login). PATCH /admin/doctors/:id -> 200 Doctor */
export interface DoctorInput {
  name: string;
  email: string;
  phone: string;
  specialtyId: string;
  clinicId: string;
  experienceYears: number;
  consultationFee: number;
  qualifications?: string[];
  languages?: string[];
  about?: string;
  services?: string[];
  profileImageUrl?: string | null;
}

/** PATCH /admin/doctors/:id/flags -> 200 Doctor */
export interface DoctorFlagsRequest {
  isVerified?: boolean;
  isActive?: boolean;
}

/** GET /admin/users -> 200 Paginated<User> */
export interface AdminUserQuery {
  search?: string;
  role?: UserRole;
  page?: number;
  pageSize?: number;
}

// GET    /admin/users/:id -> 200 User
// PATCH  /admin/users/:id -> 200 User, body { isActive: boolean }. Not allowed on your own account (403).
// DELETE /admin/users/:id -> 204. Not allowed on your own account (403).
export interface UpdateUserStatusRequest {
  isActive: boolean;
}

/** POST /specialties, PATCH /specialties/:id (admin) -> Specialty. DELETE /specialties/:id -> 204 | 409 if doctors use it */
export interface SpecialtyInput {
  name: string;
  description: string;
  iconName: string;
  popular: boolean;
}

/** POST /clinics, PATCH /clinics/:id (admin) -> Clinic. DELETE /clinics/:id -> 204 | 409 if doctors are affiliated */
export interface ClinicInput {
  name: string;
  address: string;
  city: string;
  timezone: string;
  phone: string;
  email: string;
  openHours: string;
  establishedYear?: number | null;
  services: string[];
  imageUrl?: string | null;
}
