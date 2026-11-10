/**
 * In-browser stand-in for the DocPulse API, used only when VITE_DEMO_MODE=true.
 *
 * It answers the same paths with the same shapes and rules as the real server (see src/api/contract.ts),
 * so every page works unchanged. Data lives in this browser's localStorage, so each visitor has their own
 * copy, except for one shared video consultation ("demo-video") that both demo accounts see on any device.
 * Video calls are real: room tokens come from LiveKit Cloud's development token server.
 */
import { ApiError } from '../api/client';
import type * as C from '../api/contract';
import { DEMO_PASSWORD, DEMO_ROOM_PREFIX, DEMO_TOKEN_SERVER_ID } from './config';
import { SEED_CLINICS, SEED_DOCTORS, SEED_SPECIALTIES } from './seedData';
import { WEEKDAYS, addDays, daysFromToday, formatSlot, minutesNowIn, parseSlot, slotStartMs, sortSlots, todayIn, weekdayOf } from './time';

// ---------- Types & state ----------

type SpecialtyRow = Omit<C.Specialty, 'doctorCount'>;
type ClinicRow = Omit<C.Clinic, 'doctorCount'>;
type DoctorRow = Omit<C.Doctor, 'specialty' | 'specialtySlug' | 'clinicName' | 'clinicAddress' | 'city' | 'timezone'>;
type UserRow = Omit<C.User, 'doctorId'> & { doctorId: string | null; password: string };
type AppointmentRow = Omit<C.Appointment, 'doctorName' | 'doctorSpecialty' | 'doctorImageUrl' | 'clinicName' | 'clinicAddress' | 'timezone'>;
type ReviewRow = C.Review & { patientId: string };
type PrescriptionRow = C.PrescriptionInput & { id: string; appointmentId: string; issuedAt: string | null; updatedAt: string };

interface State {
  version: number;
  createdOn: string;
  specialties: SpecialtyRow[];
  clinics: ClinicRow[];
  doctors: DoctorRow[];
  users: UserRow[];
  appointments: AppointmentRow[];
  reviews: ReviewRow[];
  prescriptions: PrescriptionRow[];
  /** The shared demo consultation, ended locally by the doctor (it reopens after a short pause). */
  videoEnded: { at: number; date: string; slot: string } | null;
  videoStartedAt: string | null;
}

const STORAGE_KEY = 'docpulse_demo_v1';
const VERSION = 3;
const SHARED_VIDEO_ID = 'demo-video';
const DEMO_DOCTOR_ID = 'dr-1';
const JOIN_EARLY_MIN = 10;
const JOIN_LATE_MIN = 60;
const VIDEO_REOPEN_MS = 10 * 60_000;
const ALL_DAY_SLOTS = Array.from({ length: 48 }, (_, i) => formatSlot(i * 30));
const WEEKDAY_SLOTS = Array.from({ length: 16 }, (_, i) => formatSlot(9 * 60 + i * 30));

const err = (status: number, code: C.ApiErrorCode, message: string) => new ApiError(status, code, message);
const notFound = (what: string) => err(404, 'NOT_FOUND', `${what} not found.`);
const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const REVIEW_POOL = [
  'Very clear explanations and never felt rushed. The booking was confirmed instantly.',
  'Listened carefully and explained every option. Follow-up advice was practical and easy to follow.',
  'Started right on time and the clinic staff were friendly. Highly recommended.',
  'Thorough, patient and kind. I finally understood what was going on.',
  'The video visit felt just like being in the clinic, and saved me a long trip.',
  'Professional and reassuring. Got a clear plan and the prescription on the same day.',
];
const REVIEWERS = [
  { id: 'u-sophia', name: 'Neha Agarwal', email: 'sophia@docpulse.demo' },
  { id: 'u-daniel', name: 'Vivek Malhotra', email: 'daniel@docpulse.demo' },
  { id: 'u-priya', name: 'Priya Sharma', email: 'priya@docpulse.demo' },
  { id: 'u-james', name: 'Sanjay Pillai', email: 'james@docpulse.demo' },
];

function createState(): State {
  const created = nowIso();
  const specialties: SpecialtyRow[] = SEED_SPECIALTIES.map((s) => ({ ...s, id: `sp-${s.slug}` }));
  const clinics: ClinicRow[] = SEED_CLINICS.map((c, i) => ({ ...c, id: `cl-${i + 1}` }));
  const doctors: DoctorRow[] = SEED_DOCTORS.map((d, i) => {
    const { specialtySlug, clinicName, ...rest } = d;
    const id = `dr-${i + 1}`;
    const demo = id === DEMO_DOCTOR_ID;
    return {
      ...rest,
      id,
      userId: demo ? 'u-doctor' : null,
      specialtyId: `sp-${specialtySlug}`,
      clinicId: clinics.find((c) => c.name === clinicName)!.id,
      // The demo doctor works every day, all day, so a video slot is always open during a demo.
      availableDays: demo ? [...WEEKDAYS] : d.availableDays,
      timeSlots: demo ? ALL_DAY_SLOTS : sortSlots(d.timeSlots),
      offersOnlineConsultation: i % 2 === 0,
      isVerified: true,
      isActive: true,
    };
  });
  const demoDoctor = doctors[0]!;
  const zone = clinics.find((c) => c.id === demoDoctor.clinicId)!.timezone;
  const today = todayIn(zone);

  const user = (id: string, name: string, email: string, role: C.UserRole, extra: Partial<UserRow> = {}): UserRow => ({
    id,
    name,
    email,
    role,
    phone: '+91 98765 43210',
    avatarUrl: null,
    dateOfBirth: null,
    gender: null,
    address: null,
    doctorId: null,
    isActive: true,
    createdAt: created,
    password: DEMO_PASSWORD,
    ...extra,
  });
  const users: UserRow[] = [
    user('u-patient', 'Rahul Verma', 'patient@docpulse.demo', 'patient', { dateOfBirth: '1990-04-12', gender: 'male', address: 'Flat 304, Sai Krupa Apartments, Andheri West, Mumbai 400053' }),
    user('u-doctor', demoDoctor.name, 'doctor@docpulse.demo', 'doctor', { doctorId: DEMO_DOCTOR_ID }),
    user('u-admin', 'Demo Admin', 'admin@docpulse.demo', 'admin'),
    ...REVIEWERS.map((r) => user(r.id, r.name, r.email, 'patient')),
  ];

  let ref = 48210;
  const appt = (
    patient: { id: string; name: string; email: string },
    doctor: DoctorRow,
    date: string,
    slot: string,
    status: C.AppointmentStatus,
    mode: C.ConsultationMode,
    reason: string,
  ): AppointmentRow => ({
    id: `a-${ref}`,
    bookingRef: `BK-${ref++}`,
    patientId: patient.id,
    patientName: patient.name,
    patientEmail: patient.email,
    patientPhone: '+91 98765 43210',
    doctorId: doctor.id,
    clinicId: doctor.clinicId,
    appointmentDate: date,
    timeSlot: slot,
    status,
    consultationFee: doctor.consultationFee,
    paymentStatus: status === 'completed' ? 'paid' : 'pay_at_clinic',
    reason,
    notes: '',
    cancellationReason: status === 'cancelled' ? 'Schedule conflict' : null,
    consultationMode: mode,
    consultationStartedAt: status === 'completed' && mode === 'online' ? created : null,
    consultationEndedAt: status === 'completed' && mode === 'online' ? created : null,
    createdAt: created,
  });
  const alex = users[0]!;
  const [sophia, daniel, priya, james] = REVIEWERS as [(typeof REVIEWERS)[number], (typeof REVIEWERS)[number], (typeof REVIEWERS)[number], (typeof REVIEWERS)[number]];
  const other = doctors[2]!;
  const otherDay = (() => {
    for (let i = 1; i <= 7; i++) if (other.availableDays.includes(weekdayOf(addDays(today, i)))) return addDays(today, i);
    return addDays(today, 1);
  })();
  const appointments: AppointmentRow[] = [
    appt(alex, demoDoctor, addDays(today, -1), '10:00 AM', 'completed', 'in_person', 'Annual check-up and blood pressure review'),
    appt(alex, demoDoctor, addDays(today, -6), '06:00 PM', 'completed', 'online', 'Headaches and high blood pressure readings (video)'),
    appt(alex, demoDoctor, addDays(today, 1), '10:30 AM', 'upcoming', 'in_person', 'In-person ECG and consultation'),
    appt(alex, other, otherDay, other.timeSlots[1] ?? other.timeSlots[0]!, 'upcoming', 'in_person', 'Follow-up consultation'),
    appt(sophia, demoDoctor, addDays(today, 1), '09:00 AM', 'upcoming', 'online', 'Medication review (video)'),
    appt(daniel, demoDoctor, addDays(today, 2), '02:00 PM', 'upcoming', 'in_person', 'Shortness of breath when exercising'),
    appt(priya, demoDoctor, addDays(today, -2), '03:00 PM', 'completed', 'online', 'Palpitations follow-up (video)'),
    appt(james, demoDoctor, addDays(today, -3), '11:30 AM', 'cancelled', 'in_person', 'Routine consultation'),
  ];

  const reviews: ReviewRow[] = doctors.flatMap((d, di) =>
    REVIEWERS.slice(0, 3).map((r, ri) => ({
      id: `rv-${d.id}-${ri}`,
      doctorId: d.id,
      patientId: r.id,
      patientName: r.name,
      rating: (di + ri) % 4 === 3 ? 4 : 5,
      comment: REVIEW_POOL[(di + ri) % REVIEW_POOL.length]!,
      verifiedVisit: ri !== 1,
      createdAt: new Date(Date.now() - (ri * 9 + di + 2) * 86_400_000).toISOString(),
    })),
  );

  // A sample issued prescription from Rahul's past video visit.
  const pastVideo = appointments[1]!;
  const prescriptions: PrescriptionRow[] = [
    {
      id: 'rx-sample',
      appointmentId: pastVideo.id,
      diagnosis: 'Stage 1 hypertension; tension-type headache',
      medicines: [
        { name: 'Amlodipine', dosage: '5 mg', frequency: '1-0-0', duration: '30 days', instructions: 'After breakfast' },
        { name: 'Paracetamol', dosage: '500 mg', frequency: 'As needed', duration: '5 days', instructions: 'Max 3 tablets a day' },
      ],
      advice: 'Cut down on salt and caffeine. Walk for 30 minutes a day. Check your blood pressure every morning and note the readings.',
      followUpDate: addDays(today, 24),
      issuedAt: pastVideo.createdAt,
      updatedAt: pastVideo.createdAt,
    },
  ];

  return { version: VERSION, createdOn: today, specialties, clinics, doctors, users, appointments, reviews, prescriptions, videoEnded: null, videoStartedAt: null };
}

let state: State = load();

function load(): State {
  try {
    if (new URLSearchParams(window.location.search).has('resetDemo')) localStorage.removeItem(STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      // Rebuild daily so the sample visits stay around "today".
      if (parsed.version === VERSION && parsed.createdOn === todayIn(SEED_CLINICS[0]!.timezone)) return parsed;
    }
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return createState();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode): changes last for this tab only.
  }
}

// ---------- Views ----------

const clinicOf = (id: string) => state.clinics.find((c) => c.id === id);
const specialtyOf = (id: string) => state.specialties.find((s) => s.id === id);
const doctorRow = (id: string) => state.doctors.find((d) => d.id === id);
const visible = (d: DoctorRow) => d.isActive && d.isVerified;
const zoneOf = (d: DoctorRow) => clinicOf(d.clinicId)?.timezone ?? 'UTC';

function toDoctor(d: DoctorRow): C.Doctor {
  const s = specialtyOf(d.specialtyId);
  const c = clinicOf(d.clinicId);
  return {
    ...d,
    specialty: s?.name ?? '',
    specialtySlug: s?.slug ?? '',
    clinicName: c?.name ?? '',
    clinicAddress: c?.address ?? '',
    city: c?.city ?? '',
    timezone: c?.timezone ?? 'UTC',
  };
}

const toSpecialty = (s: SpecialtyRow): C.Specialty => ({ ...s, doctorCount: state.doctors.filter((d) => d.specialtyId === s.id && visible(d)).length });
const toClinic = (c: ClinicRow): C.Clinic => ({ ...c, doctorCount: state.doctors.filter((d) => d.clinicId === c.id && visible(d)).length });
const toUser = ({ password: _password, ...u }: UserRow): C.User => u;
const toReview = ({ patientId: _patientId, ...r }: ReviewRow): C.Review => r;

function toAppointment(a: AppointmentRow): C.Appointment {
  const d = doctorRow(a.doctorId);
  const c = clinicOf(a.clinicId);
  return {
    ...a,
    doctorName: d?.name ?? 'Doctor',
    doctorSpecialty: d ? (specialtyOf(d.specialtyId)?.name ?? '') : '',
    doctorImageUrl: d?.profileImageUrl ?? null,
    clinicName: c?.name ?? '',
    clinicAddress: c?.address ?? '',
    timezone: c?.timezone ?? 'UTC',
  };
}

/**
 * The shared video consultation between the two demo accounts. Its slot is always "now" (the current
 * half hour in the clinic's zone), so the room is open whenever a demo starts, on any device.
 */
function sharedVideo(): AppointmentRow {
  const doctor = doctorRow(DEMO_DOCTOR_ID)!;
  const zone = zoneOf(doctor);
  if (state.videoEnded && Date.now() - state.videoEnded.at > VIDEO_REOPEN_MS) {
    state.videoEnded = null;
    state.videoStartedAt = null;
    // The reopened demo consultation starts with a blank prescription.
    state.prescriptions = state.prescriptions.filter((r) => r.appointmentId !== SHARED_VIDEO_ID);
    save();
  }
  const ended = state.videoEnded;
  const date = ended?.date ?? todayIn(zone);
  const slot = ended?.slot ?? formatSlot(Math.floor(minutesNowIn(zone) / 30) * 30);
  return {
    id: SHARED_VIDEO_ID,
    bookingRef: 'BK-LIVE01',
    patientId: 'u-patient',
    patientName: 'Rahul Verma',
    patientEmail: 'patient@docpulse.demo',
    patientPhone: '+91 98765 43210',
    doctorId: doctor.id,
    clinicId: doctor.clinicId,
    appointmentDate: date,
    timeSlot: slot,
    status: ended ? 'completed' : 'upcoming',
    consultationFee: doctor.consultationFee,
    paymentStatus: 'pay_at_clinic',
    reason: 'Follow-up on blood pressure readings (video)',
    notes: 'Live demo consultation',
    cancellationReason: null,
    consultationMode: 'online',
    consultationStartedAt: state.videoStartedAt,
    consultationEndedAt: ended ? new Date(ended.at).toISOString() : null,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  };
}

const allAppointments = () => [sharedVideo(), ...state.appointments];

// ---------- Auth ----------

interface Viewer {
  id: string;
  name: string;
  email: string;
  role: C.UserRole;
  doctorId: string | null;
}

function viewerFrom(token: string | undefined): Viewer | null {
  const id = token?.startsWith('demo:') ? token.slice(5) : null;
  const u = id ? state.users.find((x) => x.id === id && x.isActive) : undefined;
  return u ? { id: u.id, name: u.name, email: u.email, role: u.role, doctorId: u.doctorId } : null;
}

function requireViewer(v: Viewer | null, ...roles: C.UserRole[]): Viewer {
  if (!v) throw err(401, 'UNAUTHENTICATED', 'Please sign in again.');
  if (roles.length && !roles.includes(v.role)) throw err(403, 'FORBIDDEN', 'You don’t have access to this.');
  return v;
}

const session = (u: UserRow): C.AuthSession => ({
  user: toUser(u),
  accessToken: `demo:${u.id}`,
  refreshToken: `demo-refresh:${u.id}`,
  expiresIn: 30 * 86_400,
});

function checkPassword(password: string) {
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw err(400, 'VALIDATION_ERROR', 'Password must be at least 8 characters with a letter and a number.');
  }
}

// ---------- Rules (mirroring the server) ----------

function slotTaken(doctorId: string, date: string, slot: string, exceptId?: string) {
  return allAppointments().some((a) => a.doctorId === doctorId && a.appointmentDate === date && a.timeSlot === slot && a.status !== 'cancelled' && a.id !== exceptId);
}

function assertBookable(d: DoctorRow, date: string, slot: string, exceptId?: string) {
  const zone = zoneOf(d);
  if (!visible(d)) throw err(422, 'UNPROCESSABLE', 'This doctor is not currently taking appointments.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw err(422, 'UNPROCESSABLE', 'Choose a valid date.');
  const ahead = daysFromToday(date, zone);
  if (ahead < 0) throw err(422, 'UNPROCESSABLE', 'You can’t book a date in the past.');
  if (ahead > 60) throw err(422, 'UNPROCESSABLE', 'Appointments can be booked up to 60 days ahead.');
  const weekday = weekdayOf(date);
  if (!d.availableDays.includes(weekday)) throw err(422, 'UNPROCESSABLE', `${d.name} doesn’t consult on ${weekday}s. Please pick another day.`);
  if (!d.timeSlots.includes(slot)) throw err(422, 'UNPROCESSABLE', 'That time isn’t offered. Please pick another slot.');
  if (slotStartMs(date, slot, zone) <= Date.now()) throw err(422, 'UNPROCESSABLE', 'That time has already passed. Please pick a later slot.');
  if (slotTaken(d.id, date, slot, exceptId)) throw err(409, 'CONFLICT', 'That slot was just booked. Please choose another time.');
}

function canSee(v: Viewer, a: AppointmentRow) {
  return v.role === 'admin' || (v.role === 'patient' && a.patientId === v.id) || (v.role === 'doctor' && a.doctorId === v.doctorId);
}

function findAppointment(v: Viewer, id: string): AppointmentRow {
  const a = allAppointments().find((x) => x.id === id);
  if (!a || !canSee(v, a)) throw notFound('Appointment');
  return a;
}

function updateAppointment(id: string, patch: Partial<AppointmentRow>): C.Appointment {
  if (id === SHARED_VIDEO_ID) {
    const current = sharedVideo();
    if (patch.status === 'completed' || patch.consultationEndedAt) {
      state.videoEnded = { at: Date.now(), date: current.appointmentDate, slot: current.timeSlot };
    }
    if (patch.consultationStartedAt !== undefined) state.videoStartedAt = patch.consultationStartedAt;
    save();
    return toAppointment(sharedVideo());
  }
  const row = state.appointments.find((a) => a.id === id)!;
  Object.assign(row, patch);
  save();
  return toAppointment(row);
}

function consultationOf(v: Viewer, a: AppointmentRow): C.Consultation {
  const zone = clinicOf(a.clinicId)?.timezone ?? 'UTC';
  const start = slotStartMs(a.appointmentDate, a.timeSlot, zone);
  const opens = start - JOIN_EARLY_MIN * 60_000;
  const closes = start + JOIN_LATE_MIN * 60_000;
  const now = Date.now();
  const status: C.ConsultationStatus =
    a.status === 'cancelled'
      ? 'cancelled'
      : a.status === 'completed' || a.consultationEndedAt
        ? 'ended'
        : a.consultationStartedAt
          ? 'in_progress'
          : now < opens
            ? 'scheduled'
            : now > closes
              ? 'missed'
              : 'open';
  const participant = (v.role === 'patient' && a.patientId === v.id) || (v.role === 'doctor' && a.doctorId === v.doctorId);
  const videoAvailable = !!DEMO_TOKEN_SERVER_ID;
  const reason =
    status === 'cancelled'
      ? 'This appointment was cancelled.'
      : status === 'ended'
        ? 'This consultation has ended.'
        : status === 'missed'
          ? 'The consultation window has closed.'
          : status === 'scheduled'
            ? 'The consultation room isn’t open yet.'
            : !participant
              ? 'Only the patient and the doctor can join this consultation.'
              : !videoAvailable
                ? 'Video consultations are not available in this demo yet (no LiveKit token server is configured).'
                : null;
  return {
    appointmentId: a.id,
    status,
    joinOpensAt: new Date(opens).toISOString(),
    joinClosesAt: new Date(closes).toISOString(),
    serverTime: new Date(now).toISOString(),
    startedAt: a.consultationStartedAt,
    endedAt: a.consultationEndedAt,
    canJoin: reason === null,
    joinBlockedReason: reason,
    videoAvailable,
  };
}

/** Reads a JWT's payload without verifying it (only to check what the token server granted). */
function jwtPayload(token: string): { sub?: string; exp?: number; video?: { room?: string } } {
  try {
    const part = token.split('.')[1] ?? '';
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string; exp?: number; video?: { room?: string } };
  } catch {
    return {};
  }
}

async function joinConsultation(v: Viewer, a: AppointmentRow): Promise<C.ConsultationJoin> {
  if (v.role === 'admin') throw err(403, 'FORBIDDEN', 'Admins can’t join consultations.');
  const consultation = consultationOf(v, a);
  if (consultation.status === 'cancelled' || consultation.status === 'ended') throw err(409, 'CONFLICT', consultation.joinBlockedReason ?? 'This consultation has ended.');
  if (consultation.status === 'scheduled' || consultation.status === 'missed') throw err(422, 'UNPROCESSABLE', consultation.joinBlockedReason ?? 'Not open.');
  if (!consultation.videoAvailable) throw err(503, 'SERVICE_UNAVAILABLE', consultation.joinBlockedReason ?? 'Video is not available.');

  const role = v.role === 'doctor' ? 'doctor' : 'patient';
  const roomName = `${DEMO_ROOM_PREFIX}-${a.id}`;
  const identity = `${role}-${v.id}`;
  const { TokenSource } = await import('livekit-client');
  let details: { serverUrl: string; participantToken: string };
  try {
    details = await TokenSource.developmentTokenServer(DEMO_TOKEN_SERVER_ID).fetch({ roomName, participantIdentity: identity, participantName: v.name });
  } catch {
    throw err(503, 'SERVICE_UNAVAILABLE', 'Couldn’t get a video token from LiveKit. Check VITE_LIVEKIT_TOKEN_SERVER_ID and that the development token server is switched on.');
  }
  const payload = jwtPayload(details.participantToken);
  if (payload.video?.room && payload.video.room !== roomName) {
    throw err(503, 'SERVICE_UNAVAILABLE', 'The LiveKit token server didn’t honour the room name, so both sides wouldn’t meet in the same room.');
  }
  if (role === 'doctor' && !a.consultationStartedAt) updateAppointment(a.id, { consultationStartedAt: nowIso() });
  const fresh = allAppointments().find((x) => x.id === a.id) ?? a;
  return {
    provider: 'livekit',
    serverUrl: details.serverUrl,
    token: details.participantToken,
    expiresAt: new Date((payload.exp ?? Date.now() / 1000 + 600) * 1000).toISOString(),
    identity: payload.sub ?? identity,
    // The token server may rename participants, so the demo treats whoever else is in the room as the counterpart.
    remoteIdentity: '*',
    role,
    consultation: consultationOf(v, fresh),
  };
}

// ---------- Queries ----------

type Q = Record<string, string | number | boolean | undefined | null>;
const str = (q: Q, k: string) => (q[k] === undefined || q[k] === null || q[k] === '' ? undefined : String(q[k]));
const num = (q: Q, k: string) => (str(q, k) === undefined ? undefined : Number(q[k]));
const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

function paginate<T>(items: T[], q: Q, defaultSize: number, max: number): C.Paginated<T> {
  const page = Math.max(1, num(q, 'page') ?? 1);
  const pageSize = Math.min(max, Math.max(1, num(q, 'pageSize') ?? defaultSize));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}

function matchesDoctor(d: C.Doctor, text: string) {
  return has(d.name, text) || has(d.specialty, text) || has(d.clinicName, text) || has(d.city, text) || d.services.some((s) => has(s, text));
}

function sortDoctors(list: C.Doctor[], sortBy = 'recommended') {
  const by: Record<string, (a: C.Doctor, b: C.Doctor) => number> = {
    recommended: (a, b) => b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10),
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    experience: (a, b) => b.experienceYears - a.experienceYears,
    fee_asc: (a, b) => a.consultationFee - b.consultationFee,
    fee_desc: (a, b) => b.consultationFee - a.consultationFee,
  };
  return [...list].sort(by[sortBy] ?? by.recommended);
}

function listDoctors(q: Q): C.Paginated<C.Doctor> {
  let list = state.doctors.filter(visible).map(toDoctor);
  const search = str(q, 'search');
  if (search) list = list.filter((d) => matchesDoctor(d, search));
  const specialty = str(q, 'specialty');
  if (specialty) list = list.filter((d) => d.specialtySlug === specialty);
  const city = str(q, 'city');
  if (city) list = list.filter((d) => d.city === city);
  const minRating = num(q, 'minRating');
  if (minRating) list = list.filter((d) => d.rating >= minRating);
  const minExp = num(q, 'minExperience');
  if (minExp) list = list.filter((d) => d.experienceYears >= minExp);
  const maxFee = num(q, 'maxFee');
  if (maxFee) list = list.filter((d) => d.consultationFee <= maxFee);
  const online = str(q, 'online');
  if (online === 'true' || online === '1') list = list.filter((d) => d.offersOnlineConsultation);
  return paginate(sortDoctors(list, str(q, 'sortBy')), q, 20, 100);
}

function availability(d: DoctorRow, q: Q): C.Availability {
  const zone = zoneOf(d);
  const from = str(q, 'from') ?? todayIn(zone);
  const days = Math.min(14, Math.max(1, num(q, 'days') ?? 7));
  return {
    doctorId: d.id,
    timezone: zone,
    days: Array.from({ length: days }, (_, i) => {
      const date = addDays(from, i);
      const weekday = weekdayOf(date);
      const isWorkingDay = d.availableDays.includes(weekday);
      return {
        date,
        weekday,
        isWorkingDay,
        slots: isWorkingDay
          ? d.timeSlots.map((slot) => ({
              slot,
              state: slotStartMs(date, slot, zone) <= Date.now() ? 'past' : slotTaken(d.id, date, slot) ? 'booked' : 'available',
            }))
          : [],
      };
    }),
  };
}

function listAppointments(v: Viewer, q: Q): C.Paginated<C.Appointment> {
  let list = allAppointments().filter((a) => canSee(v, a));
  const status = str(q, 'status');
  if (status) list = list.filter((a) => a.status === status);
  const mode = str(q, 'consultationMode');
  if (mode) list = list.filter((a) => a.consultationMode === mode);
  const from = str(q, 'from');
  if (from) list = list.filter((a) => a.appointmentDate >= from);
  const to = str(q, 'to');
  if (to) list = list.filter((a) => a.appointmentDate <= to);
  const doctorId = str(q, 'doctorId');
  if (doctorId) list = list.filter((a) => a.doctorId === doctorId);
  const patientId = str(q, 'patientId');
  if (patientId) list = list.filter((a) => a.patientId === patientId);
  let views = list.map(toAppointment);
  const search = str(q, 'search');
  if (search) views = views.filter((a) => has(a.patientName, search) || has(a.doctorName, search) || has(a.bookingRef, search) || has(a.reason, search));
  views.sort((a, b) => {
    const ua = a.status === 'upcoming' ? 0 : 1;
    const ub = b.status === 'upcoming' ? 0 : 1;
    if (ua !== ub) return ua - ub;
    const dateCmp = a.appointmentDate.localeCompare(b.appointmentDate) * (ua === 0 ? 1 : -1);
    return dateCmp || (parseSlot(a.timeSlot) ?? 0) - (parseSlot(b.timeSlot) ?? 0);
  });
  return paginate(views, q, 50, 200);
}

function doctorStats(doctorId: string): C.DoctorStats {
  const list = allAppointments().filter((a) => a.doctorId === doctorId);
  const d = doctorRow(doctorId)!;
  const today = todayIn(zoneOf(d));
  const completed = list.filter((a) => a.status === 'completed');
  return {
    todayVisits: list.filter((a) => a.appointmentDate === today && a.status !== 'cancelled').length,
    upcoming: list.filter((a) => a.status === 'upcoming').length,
    completed: completed.length,
    cancelled: list.filter((a) => a.status === 'cancelled').length,
    completedRevenue: completed.reduce((sum, a) => sum + a.consultationFee, 0),
  };
}

// ---------- Prescriptions ----------

function toPrescription(row: PrescriptionRow, a: AppointmentRow): C.Prescription {
  const view = toAppointment(a);
  return {
    ...row,
    medicines: row.medicines.map((m) => ({ ...m })),
    bookingRef: view.bookingRef,
    status: row.issuedAt ? 'issued' : 'draft',
    doctorName: view.doctorName,
    doctorSpecialty: view.doctorSpecialty,
    clinicName: view.clinicName,
    clinicAddress: view.clinicAddress,
    patientName: view.patientName,
    appointmentDate: view.appointmentDate,
  };
}

const isAssignedDoctor = (v: Viewer, a: AppointmentRow) => v.role === 'doctor' && a.doctorId === v.doctorId;

function prescriptionFor(v: Viewer, a: AppointmentRow): C.Prescription | null {
  const row = state.prescriptions.find((r) => r.appointmentId === a.id);
  if (!row || (!row.issuedAt && !isAssignedDoctor(v, a))) return null;
  return toPrescription(row, a);
}

const text = (value: unknown, max: number, label: string) => {
  const t = typeof value === 'string' ? value.trim() : '';
  if (t.length > max) throw err(400, 'VALIDATION_ERROR', `${label} must be at most ${max} characters.`);
  return t;
};

/** Mirrors the API's validation for PUT /appointments/:id/prescription. */
function parsePrescription(body: Record<string, unknown>): C.PrescriptionInput {
  const medicines = Array.isArray(body.medicines) ? (body.medicines as Record<string, unknown>[]) : [];
  if (medicines.length > 15) throw err(400, 'VALIDATION_ERROR', 'Add at most 15 medicines.');
  const followUpDate = body.followUpDate ? String(body.followUpDate) : null;
  if (followUpDate && !/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) throw err(400, 'VALIDATION_ERROR', 'Use the YYYY-MM-DD format.');
  return {
    diagnosis: text(body.diagnosis, 300, 'Diagnosis'),
    medicines: medicines.map((m) => {
      const name = text(m?.name, 100, 'Medicine name');
      if (!name) throw err(400, 'VALIDATION_ERROR', 'Medicine name is required.');
      return {
        name,
        dosage: text(m.dosage, 60, 'Dosage'),
        frequency: text(m.frequency, 60, 'Frequency'),
        duration: text(m.duration, 60, 'Duration'),
        instructions: text(m.instructions, 120, 'Instructions'),
      };
    }),
    advice: text(body.advice, 1000, 'Advice'),
    followUpDate,
  };
}

function savePrescription(v: Viewer, a: AppointmentRow, body: Record<string, unknown>): C.Prescription {
  if (!isAssignedDoctor(v, a)) throw err(403, 'FORBIDDEN', 'Only the assigned doctor can write this prescription.');
  if (a.consultationMode !== 'online') throw err(422, 'UNPROCESSABLE', 'Prescriptions are written during online consultations.');
  if (a.status === 'cancelled') throw err(409, 'CONFLICT', 'This appointment was cancelled.');
  if (!a.consultationStartedAt) throw err(422, 'UNPROCESSABLE', 'Start the consultation before writing the prescription.');
  const input = parsePrescription(body);
  const issue = body.issue === true;
  if (issue && !input.diagnosis && input.medicines.length === 0) {
    throw err(422, 'UNPROCESSABLE', 'Add a diagnosis or at least one medicine before issuing the prescription.');
  }
  let row = state.prescriptions.find((r) => r.appointmentId === a.id);
  if (row?.issuedAt) throw err(409, 'CONFLICT', 'This prescription has already been issued and can’t be changed.');
  if (!row) {
    row = { id: newId('rx'), appointmentId: a.id, ...input, issuedAt: null, updatedAt: nowIso() };
    state.prescriptions.push(row);
  }
  Object.assign(row, input, { updatedAt: nowIso() }, issue ? { issuedAt: nowIso() } : {});
  save();
  return toPrescription(row, a);
}

/**
 * Demo only: the patient's browser keeps the prescription the doctor issued during the live call
 * (there's no shared server), and marks the shared consultation as ended in this browser too.
 */
export function demoReceivePrescription(rx: C.Prescription) {
  const a = allAppointments().find((x) => x.id === rx.appointmentId);
  if (!a || rx.status !== 'issued') return;
  let input: C.PrescriptionInput;
  try {
    input = parsePrescription(rx as unknown as Record<string, unknown>);
  } catch {
    return;
  }
  state.prescriptions = state.prescriptions.filter((r) => r.appointmentId !== a.id);
  state.prescriptions.push({ id: String(rx.id).slice(0, 40), appointmentId: a.id, ...input, issuedAt: rx.issuedAt ?? nowIso(), updatedAt: nowIso() });
  if (a.id === SHARED_VIDEO_ID && !state.videoEnded) {
    if (!state.videoStartedAt) state.videoStartedAt = nowIso();
    updateAppointment(a.id, { status: 'completed', consultationEndedAt: nowIso() });
  }
  save();
}

// ---------- Router ----------

export interface DemoRequestOptions {
  method?: string;
  body?: unknown;
  query?: Q;
}

const delay = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 180));

export async function demoRequest<T>(path: string, opts: DemoRequestOptions, accessToken: string | undefined): Promise<T> {
  await delay();
  return (await route(path, opts.method ?? 'GET', (opts.body ?? {}) as Record<string, unknown>, opts.query ?? {}, viewerFrom(accessToken))) as T;
}

async function route(path: string, method: string, body: Record<string, unknown>, q: Q, viewer: Viewer | null): Promise<unknown> {
  const [p0, p1, p2, p3] = path.split('/').filter(Boolean);
  const b = body as never;

  // ----- auth -----
  if (p0 === 'auth') {
    if (p1 === 'login' && method === 'POST') {
      const { email, password } = body as { email: string; password: string };
      const u = state.users.find((x) => x.email === String(email).trim().toLowerCase());
      if (!u || u.password !== password) throw err(401, 'UNAUTHENTICATED', 'Incorrect email or password.');
      if (!u.isActive) throw err(403, 'FORBIDDEN', 'This account has been deactivated.');
      return session(u);
    }
    if (p1 === 'register' && method === 'POST') {
      const r = b as C.RegisterRequest;
      const email = r.email.trim().toLowerCase();
      checkPassword(r.password);
      if (state.users.some((x) => x.email === email)) throw err(409, 'CONFLICT', 'An account with this email already exists.');
      const id = newId('u');
      let doctorId: string | null = null;
      if (r.role === 'doctor') {
        if (!r.specialtyId || !r.clinicId) throw err(400, 'VALIDATION_ERROR', 'Choose your specialty and clinic.');
        doctorId = newId('dr');
        state.doctors.push({
          id: doctorId,
          userId: id,
          name: r.name.trim(),
          email,
          phone: r.phone ?? '',
          specialtyId: r.specialtyId,
          clinicId: r.clinicId,
          qualifications: [],
          experienceYears: 0,
          rating: 0,
          reviewCount: 0,
          consultationFee: 100,
          languages: ['English'],
          about: '',
          services: [],
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: WEEKDAY_SLOTS,
          profileImageUrl: null,
          offersOnlineConsultation: false,
          isVerified: false,
          isActive: true,
        });
      }
      const u: UserRow = {
        id,
        name: r.name.trim(),
        email,
        role: r.role,
        phone: r.phone ?? null,
        avatarUrl: null,
        dateOfBirth: null,
        gender: null,
        address: null,
        doctorId,
        isActive: true,
        createdAt: nowIso(),
        password: r.password,
      };
      state.users.push(u);
      save();
      return session(u);
    }
    if (p1 === 'logout') return undefined;
    if (p1 === 'forgot-password') return undefined;
    if (p1 === 'reset-password') throw err(400, 'VALIDATION_ERROR', 'Password reset emails aren’t sent in the demo. Use the demo password instead.');
    const v = requireViewer(viewer);
    const row = state.users.find((x) => x.id === v.id)!;
    if (p1 === 'me' && method === 'GET') return toUser(row);
    if (p1 === 'me' && method === 'PATCH') {
      Object.assign(row, body);
      save();
      return toUser(row);
    }
    if (p1 === 'change-password') {
      const { currentPassword, newPassword } = b as C.ChangePasswordRequest;
      if (row.password !== currentPassword) throw err(401, 'UNAUTHENTICATED', 'Your current password is incorrect.');
      checkPassword(newPassword);
      row.password = newPassword;
      save();
      return undefined;
    }
  }

  // ----- public catalog -----
  if (p0 === 'doctors') {
    if (!p1) return listDoctors(q);
    if (p1 === 'meta' && p2 === 'cities') {
      return [...new Set(state.doctors.filter(visible).map((d) => clinicOf(d.clinicId)?.city).filter(Boolean) as string[])].sort();
    }
    const d = doctorRow(p1);
    const own = viewer && (viewer.role === 'admin' || viewer.doctorId === p1);
    if (!d || (!visible(d) && !own)) throw notFound('Doctor');
    if (!p2) return toDoctor(d);
    if (p2 === 'availability') return availability(d, q);
    if (p2 === 'reviews' && method === 'GET') {
      return state.reviews.filter((r) => r.doctorId === d.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map(toReview);
    }
    if (p2 === 'reviews' && method === 'POST') {
      const v = requireViewer(viewer, 'patient');
      const { rating, comment } = b as C.CreateReviewRequest;
      if (!(rating >= 1 && rating <= 5) || String(comment).trim().length < 10) throw err(400, 'VALIDATION_ERROR', 'Give a rating and at least 10 characters of feedback.');
      if (state.reviews.some((r) => r.doctorId === d.id && r.patientId === v.id)) throw err(409, 'CONFLICT', 'You’ve already reviewed this doctor.');
      const verifiedVisit = allAppointments().some((a) => a.doctorId === d.id && a.patientId === v.id && a.status === 'completed');
      const review: ReviewRow = { id: newId('rv'), doctorId: d.id, patientId: v.id, patientName: v.name, rating, comment: comment.trim(), verifiedVisit, createdAt: nowIso() };
      state.reviews.push(review);
      d.rating = Math.round(((d.rating * d.reviewCount + rating) / (d.reviewCount + 1)) * 10) / 10;
      d.reviewCount += 1;
      save();
      return toReview(review);
    }
  }
  if (p0 === 'specialties') {
    if (!p1 && method === 'GET') return state.specialties.map(toSpecialty);
    if (method === 'GET') {
      const s = state.specialties.find((x) => x.slug === p1);
      if (!s) throw notFound('Specialty');
      return toSpecialty(s);
    }
    requireViewer(viewer, 'admin');
    const input = b as C.SpecialtyInput;
    const slug = String(input.name ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (method === 'POST') {
      const s: SpecialtyRow = { id: `sp-${slug}-${Date.now().toString(36)}`, slug, ...input };
      state.specialties.push(s);
      save();
      return toSpecialty(s);
    }
    const s = state.specialties.find((x) => x.id === p1);
    if (!s) throw notFound('Specialty');
    if (method === 'DELETE') {
      if (state.doctors.some((d) => d.specialtyId === s.id)) throw err(409, 'CONFLICT', 'Doctors are listed under this specialty.');
      state.specialties = state.specialties.filter((x) => x.id !== s.id);
      save();
      return undefined;
    }
    Object.assign(s, input, { slug });
    save();
    return toSpecialty(s);
  }
  if (p0 === 'clinics') {
    if (!p1 && method === 'GET') return state.clinics.map(toClinic);
    if (method === 'GET') {
      const c = clinicOf(p1!);
      if (!c) throw notFound('Clinic');
      if (p2 === 'doctors') return state.doctors.filter((d) => d.clinicId === c.id && visible(d)).map(toDoctor);
      return toClinic(c);
    }
    requireViewer(viewer, 'admin');
    const input = b as C.ClinicInput;
    if (method === 'POST') {
      const c: ClinicRow = { rating: 0, reviewCount: 0, imageUrl: null, establishedYear: null, ...input, id: newId('cl') };
      state.clinics.push(c);
      save();
      return toClinic(c);
    }
    const c = clinicOf(p1!);
    if (!c) throw notFound('Clinic');
    if (method === 'DELETE') {
      if (state.doctors.some((d) => d.clinicId === c.id)) throw err(409, 'CONFLICT', 'Doctors are affiliated with this clinic.');
      state.clinics = state.clinics.filter((x) => x.id !== c.id);
      save();
      return undefined;
    }
    Object.assign(c, input);
    save();
    return toClinic(c);
  }
  if (p0 === 'search') {
    const text = str(q, 'q') ?? '';
    return {
      doctors: sortDoctors(state.doctors.filter(visible).map(toDoctor).filter((d) => matchesDoctor(d, text))).slice(0, 10),
      specialties: state.specialties.filter((s) => has(s.name, text) || has(s.description, text)).map(toSpecialty),
      clinics: state.clinics.filter((c) => has(c.name, text) || has(c.city, text) || has(c.address, text)).map(toClinic),
    } satisfies C.SearchResults;
  }

  // ----- appointments & consultations -----
  if (p0 === 'appointments') {
    const v = requireViewer(viewer);
    if (!p1 && method === 'GET') return listAppointments(v, q);
    if (!p1 && method === 'POST') {
      if (v.role !== 'patient') throw err(403, 'FORBIDDEN', 'Only patient accounts can book appointments.');
      const r = b as C.BookAppointmentRequest;
      const d = doctorRow(r.doctorId);
      if (!d) throw notFound('Doctor');
      if (String(r.reason ?? '').trim().length < 5) throw err(400, 'VALIDATION_ERROR', 'Describe the reason for your visit (at least 5 characters).');
      assertBookable(d, r.appointmentDate, r.timeSlot);
      const online = r.consultationMode === 'online';
      if (online && !d.offersOnlineConsultation) throw err(422, 'UNPROCESSABLE', `${d.name} doesn’t offer online consultations.`);
      const row: AppointmentRow = {
        id: newId('a'),
        bookingRef: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
        patientId: v.id,
        patientName: r.patientName.trim(),
        patientEmail: r.patientEmail.trim().toLowerCase(),
        patientPhone: r.patientPhone.trim(),
        doctorId: d.id,
        clinicId: d.clinicId,
        appointmentDate: r.appointmentDate,
        timeSlot: r.timeSlot,
        status: 'upcoming',
        consultationFee: d.consultationFee,
        paymentStatus: 'pay_at_clinic',
        reason: r.reason.trim(),
        notes: r.notes?.trim() ?? '',
        cancellationReason: null,
        consultationMode: online ? 'online' : 'in_person',
        consultationStartedAt: null,
        consultationEndedAt: null,
        createdAt: nowIso(),
      };
      state.appointments.push(row);
      save();
      return toAppointment(row);
    }
    const a = findAppointment(v, p1!);
    if (!p2 && method === 'GET') return toAppointment(a);
    if (p2 === 'consultation') {
      if (a.consultationMode !== 'online') throw err(422, 'UNPROCESSABLE', 'This is an in-person visit.');
      if (!p3) return consultationOf(v, a);
      if (p3 === 'join') return joinConsultation(v, a);
      if (p3 === 'end') {
        if (!(v.role === 'doctor' && a.doctorId === v.doctorId)) throw err(403, 'FORBIDDEN', 'Only the doctor can end the consultation.');
        if (a.status === 'completed') return toAppointment(a);
        if (a.status === 'cancelled') throw err(409, 'CONFLICT', 'This appointment was cancelled.');
        return updateAppointment(a.id, { status: 'completed', consultationEndedAt: nowIso() });
      }
    }
    if (p2 === 'prescription') {
      if (method === 'GET') return { prescription: prescriptionFor(v, a) };
      if (method === 'PUT') return savePrescription(v, a, body);
    }
    if (a.id === SHARED_VIDEO_ID && p2 !== 'complete') {
      throw err(422, 'UNPROCESSABLE', 'The live demo consultation can’t be changed. Book another appointment to try this.');
    }
    if (p2 === 'cancel') {
      if (a.status !== 'upcoming') throw err(409, 'CONFLICT', 'Only upcoming appointments can be cancelled.');
      return updateAppointment(a.id, { status: 'cancelled', cancellationReason: (body.reason as string | undefined)?.trim() || null });
    }
    if (p2 === 'reschedule') {
      if (!(v.role === 'admin' || a.patientId === v.id)) throw err(403, 'FORBIDDEN', 'Only the patient can reschedule.');
      if (a.status !== 'upcoming') throw err(409, 'CONFLICT', 'Only upcoming appointments can be rescheduled.');
      if (a.consultationStartedAt) throw err(422, 'UNPROCESSABLE', 'The consultation has already started.');
      const r = b as C.RescheduleRequest;
      assertBookable(doctorRow(a.doctorId)!, r.appointmentDate, r.timeSlot, a.id);
      return updateAppointment(a.id, { appointmentDate: r.appointmentDate, timeSlot: r.timeSlot });
    }
    if (p2 === 'complete') {
      if (v.role === 'patient') throw err(403, 'FORBIDDEN', 'Only the doctor can complete a visit.');
      if (a.status !== 'upcoming') throw err(409, 'CONFLICT', 'Only upcoming appointments can be completed.');
      return updateAppointment(a.id, { status: 'completed', ...(a.consultationStartedAt ? { consultationEndedAt: nowIso() } : {}) });
    }
    if (p2 === 'status') {
      requireViewer(viewer, 'admin');
      const r = b as C.SetStatusRequest;
      if (r.status === 'upcoming' && a.status === 'cancelled' && slotTaken(a.doctorId, a.appointmentDate, a.timeSlot, a.id)) {
        throw err(409, 'CONFLICT', 'That slot has been booked by someone else.');
      }
      return updateAppointment(a.id, { status: r.status, cancellationReason: r.status === 'cancelled' ? (r.reason ?? null) : null });
    }
  }

  // ----- doctor portal -----
  if (p0 === 'doctor' && p1 === 'me') {
    const v = requireViewer(viewer, 'doctor');
    const d = doctorRow(v.doctorId ?? '');
    if (!d) throw notFound('Doctor profile');
    if (!p2) return { doctor: toDoctor(d), stats: doctorStats(d.id) };
    if (p2 === 'fee') d.consultationFee = Number(body.consultationFee);
    if (p2 === 'availability') {
      const r = b as C.UpdateAvailabilityRequest;
      if (!r.availableDays?.length || !r.timeSlots?.length) throw err(400, 'VALIDATION_ERROR', 'Choose at least one day and one time slot.');
      d.availableDays = r.availableDays;
      d.timeSlots = sortSlots(r.timeSlots);
      if (r.offersOnlineConsultation !== undefined) d.offersOnlineConsultation = r.offersOnlineConsultation;
    }
    if (p2 === 'profile') Object.assign(d, body);
    save();
    return toDoctor(d);
  }

  // ----- admin -----
  if (p0 === 'admin') {
    const v = requireViewer(viewer, 'admin');
    if (p1 === 'stats') {
      const appts = allAppointments();
      const completed = appts.filter((a) => a.status === 'completed');
      return {
        totalDoctors: state.doctors.length,
        activeDoctors: state.doctors.filter(visible).length,
        pendingDoctors: state.doctors.filter((d) => !d.isVerified).length,
        totalPatients: state.users.filter((u) => u.role === 'patient').length,
        totalAppointments: appts.length,
        upcomingAppointments: appts.filter((a) => a.status === 'upcoming').length,
        completedAppointments: completed.length,
        cancelledAppointments: appts.filter((a) => a.status === 'cancelled').length,
        completedRevenue: completed.reduce((s, a) => s + a.consultationFee, 0),
        totalClinics: state.clinics.length,
        totalSpecialties: state.specialties.length,
      } satisfies C.AdminStats;
    }
    if (p1 === 'doctors') {
      if (!p2 && method === 'GET') {
        let list = state.doctors.map(toDoctor);
        const search = str(q, 'search');
        if (search) list = list.filter((d) => matchesDoctor(d, search) || has(d.email, search));
        const status = str(q, 'status');
        if (status === 'active') list = list.filter((d) => d.isActive && d.isVerified);
        if (status === 'inactive') list = list.filter((d) => !d.isActive);
        if (status === 'unverified') list = list.filter((d) => !d.isVerified);
        return paginate(list, q, 20, 100);
      }
      const input = b as C.DoctorInput;
      if (!p2 && method === 'POST') {
        const d: DoctorRow = {
          id: newId('dr'),
          userId: null,
          qualifications: [],
          languages: ['English'],
          about: '',
          services: [],
          profileImageUrl: null,
          ...input,
          rating: 0,
          reviewCount: 0,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: WEEKDAY_SLOTS,
          offersOnlineConsultation: false,
          isVerified: true,
          isActive: true,
        };
        state.doctors.push(d);
        save();
        return toDoctor(d);
      }
      const d = doctorRow(p2!);
      if (!d) throw notFound('Doctor');
      if (p3 === 'flags') Object.assign(d, body as C.DoctorFlagsRequest);
      else Object.assign(d, input);
      save();
      return toDoctor(d);
    }
    if (p1 === 'users') {
      if (!p2) {
        let list = state.users;
        const role = str(q, 'role');
        if (role) list = list.filter((u) => u.role === role);
        const search = str(q, 'search');
        if (search) list = list.filter((u) => has(u.name, search) || has(u.email, search));
        return paginate(list.map(toUser), q, 20, 100);
      }
      const u = state.users.find((x) => x.id === p2);
      if (!u) throw notFound('User');
      if (method === 'GET') return toUser(u);
      if (u.id === v.id) throw err(403, 'FORBIDDEN', 'You can’t change your own account here.');
      if (method === 'DELETE') {
        state.users = state.users.filter((x) => x.id !== u.id);
        state.appointments = state.appointments.filter((a) => a.patientId !== u.id);
        save();
        return undefined;
      }
      u.isActive = Boolean(body.isActive);
      save();
      return toUser(u);
    }
  }

  throw err(404, 'NOT_FOUND', 'This feature isn’t available in the demo.');
}
