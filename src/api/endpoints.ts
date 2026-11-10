import { request } from './client';
import type {
  AdminDoctorQuery,
  AdminStats,
  AdminUserQuery,
  Appointment,
  AppointmentQuery,
  AuthSession,
  Availability,
  BookAppointmentRequest,
  ChangePasswordRequest,
  Clinic,
  ClinicInput,
  Consultation,
  ConsultationJoin,
  CreateReviewRequest,
  Doctor,
  DoctorFlagsRequest,
  DoctorInput,
  DoctorQuery,
  DoctorStats,
  LoginRequest,
  Paginated,
  Prescription,
  RegisterRequest,
  ResetPasswordRequest,
  ResetTokenInfo,
  SavePrescriptionRequest,
  Review,
  SearchResults,
  SetStatusRequest,
  Specialty,
  SpecialtyInput,
  UpdateAvailabilityRequest,
  UpdateDoctorProfileRequest,
  UpdateProfileRequest,
  User,
} from './contract';

type Q = Record<string, string | number | boolean | undefined | null>;
const q = (v: object) => v as Q;

export const authApi = {
  register: (body: RegisterRequest) => request<AuthSession>('/auth/register', { method: 'POST', body, auth: false }),
  login: (body: LoginRequest) => request<AuthSession>('/auth/login', { method: 'POST', body, auth: false }),
  logout: (refreshToken: string) => request<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),
  me: () => request<User>('/auth/me'),
  updateMe: (body: UpdateProfileRequest) => request<User>('/auth/me', { method: 'PATCH', body }),
  changePassword: (body: ChangePasswordRequest) => request<void>('/auth/change-password', { method: 'POST', body }),
  forgotPassword: (email: string) => request<void>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  checkResetToken: (token: string) => request<ResetTokenInfo>(`/auth/reset-password/${encodeURIComponent(token)}`, { auth: false }),
  resetPassword: (body: ResetPasswordRequest) => request<void>('/auth/reset-password', { method: 'POST', body, auth: false }),
};

export const catalogApi = {
  doctors: (query: DoctorQuery = {}) => request<Paginated<Doctor>>('/doctors', { query: q(query) }),
  doctor: (id: string) => request<Doctor>(`/doctors/${id}`),
  doctorReviews: (id: string) => request<Review[]>(`/doctors/${id}/reviews`),
  availability: (id: string, opts: { from?: string; days?: number } = {}) =>
    request<Availability>(`/doctors/${id}/availability`, { query: q(opts) }),
  cities: () => request<string[]>('/doctors/meta/cities'),
  addReview: (doctorId: string, body: CreateReviewRequest) => request<Review>(`/doctors/${doctorId}/reviews`, { method: 'POST', body }),
  specialties: () => request<Specialty[]>('/specialties'),
  specialty: (slug: string) => request<Specialty>(`/specialties/${encodeURIComponent(slug)}`),
  clinics: () => request<Clinic[]>('/clinics'),
  clinic: (id: string) => request<Clinic>(`/clinics/${id}`),
  clinicDoctors: (id: string) => request<Doctor[]>(`/clinics/${id}/doctors`),
  search: (text: string) => request<SearchResults>('/search', { query: { q: text } }),
};

export const appointmentsApi = {
  list: (query: AppointmentQuery = {}) => request<Paginated<Appointment>>('/appointments', { query: q(query) }),
  get: (id: string) => request<Appointment>(`/appointments/${id}`),
  book: (body: BookAppointmentRequest) => request<Appointment>('/appointments', { method: 'POST', body }),
  reschedule: (id: string, appointmentDate: string, timeSlot: string) =>
    request<Appointment>(`/appointments/${id}/reschedule`, { method: 'POST', body: { appointmentDate, timeSlot } }),
  cancel: (id: string, reason?: string) => request<Appointment>(`/appointments/${id}/cancel`, { method: 'POST', body: { reason } }),
  complete: (id: string) => request<Appointment>(`/appointments/${id}/complete`, { method: 'POST', body: {} }),
  setStatus: (id: string, body: SetStatusRequest) => request<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body }),
};

export const consultationsApi = {
  get: (appointmentId: string) => request<Consultation>(`/appointments/${appointmentId}/consultation`),
  join: (appointmentId: string) => request<ConsultationJoin>(`/appointments/${appointmentId}/consultation/join`, { method: 'POST', body: {} }),
  end: (appointmentId: string) => request<Appointment>(`/appointments/${appointmentId}/consultation/end`, { method: 'POST', body: {} }),
};

export const prescriptionsApi = {
  get: (appointmentId: string) => request<{ prescription: Prescription | null }>(`/appointments/${appointmentId}/prescription`),
  save: (appointmentId: string, body: SavePrescriptionRequest) =>
    request<Prescription>(`/appointments/${appointmentId}/prescription`, { method: 'PUT', body }),
};

export const doctorPortalApi = {
  me: () => request<{ doctor: Doctor; stats: DoctorStats }>('/doctor/me'),
  setFee: (consultationFee: number) => request<Doctor>('/doctor/me/fee', { method: 'PATCH', body: { consultationFee } }),
  setAvailability: (body: UpdateAvailabilityRequest) => request<Doctor>('/doctor/me/availability', { method: 'PUT', body }),
  updateProfile: (body: UpdateDoctorProfileRequest) => request<Doctor>('/doctor/me/profile', { method: 'PATCH', body }),
};

export const adminApi = {
  stats: () => request<AdminStats>('/admin/stats'),
  doctors: (query: AdminDoctorQuery = {}) => request<Paginated<Doctor>>('/admin/doctors', { query: q(query) }),
  createDoctor: (body: DoctorInput) => request<Doctor>('/admin/doctors', { method: 'POST', body }),
  updateDoctor: (id: string, body: DoctorInput) => request<Doctor>(`/admin/doctors/${id}`, { method: 'PATCH', body }),
  setDoctorFlags: (id: string, body: DoctorFlagsRequest) => request<Doctor>(`/admin/doctors/${id}/flags`, { method: 'PATCH', body }),
  users: (query: AdminUserQuery = {}) => request<Paginated<User>>('/admin/users', { query: q(query) }),
  user: (id: string) => request<User>(`/admin/users/${id}`),
  setUserActive: (id: string, isActive: boolean) => request<User>(`/admin/users/${id}`, { method: 'PATCH', body: { isActive } }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  createSpecialty: (body: SpecialtyInput) => request<Specialty>('/specialties', { method: 'POST', body }),
  updateSpecialty: (id: string, body: SpecialtyInput) => request<Specialty>(`/specialties/${id}`, { method: 'PATCH', body }),
  deleteSpecialty: (id: string) => request<void>(`/specialties/${id}`, { method: 'DELETE' }),
  createClinic: (body: ClinicInput) => request<Clinic>('/clinics', { method: 'POST', body }),
  updateClinic: (id: string, body: ClinicInput) => request<Clinic>(`/clinics/${id}`, { method: 'PATCH', body }),
  deleteClinic: (id: string) => request<void>(`/clinics/${id}`, { method: 'DELETE' }),
};
