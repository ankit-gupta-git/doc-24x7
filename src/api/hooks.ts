import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type {
  AdminDoctorQuery,
  AdminUserQuery,
  AppointmentQuery,
  BookAppointmentRequest,
  ClinicInput,
  CreateReviewRequest,
  DoctorFlagsRequest,
  DoctorInput,
  DoctorQuery,
  SavePrescriptionRequest,
  SetStatusRequest,
  SpecialtyInput,
  UpdateAvailabilityRequest,
  UpdateDoctorProfileRequest,
} from './contract';
import { adminApi, appointmentsApi, catalogApi, consultationsApi, doctorPortalApi, prescriptionsApi } from './endpoints';

/** Query keys, grouped so a mutation can invalidate everything that depends on it. */
export const qk = {
  doctors: (query?: DoctorQuery) => ['doctors', query ?? {}] as const,
  doctor: (id: string) => ['doctor', id] as const,
  reviews: (id: string) => ['doctor', id, 'reviews'] as const,
  availability: (id: string, from?: string, days?: number) => ['availability', id, from ?? '', days ?? 7] as const,
  cities: ['cities'] as const,
  specialties: ['specialties'] as const,
  specialty: (slug: string) => ['specialty', slug] as const,
  clinics: ['clinics'] as const,
  clinic: (id: string) => ['clinic', id] as const,
  clinicDoctors: (id: string) => ['clinic', id, 'doctors'] as const,
  search: (text: string) => ['search', text] as const,
  appointments: (query?: AppointmentQuery) => ['appointments', query ?? {}] as const,
  appointment: (id: string) => ['appointment', id] as const,
  consultation: (id: string) => ['appointment', id, 'consultation'] as const,
  prescription: (id: string) => ['appointment', id, 'prescription'] as const,
  doctorMe: ['doctorMe'] as const,
  adminStats: ['admin', 'stats'] as const,
  adminDoctors: (query?: AdminDoctorQuery) => ['admin', 'doctors', query ?? {}] as const,
  adminUsers: (query?: AdminUserQuery) => ['admin', 'users', query ?? {}] as const,
  adminUser: (id: string) => ['admin', 'user', id] as const,
};

/** After any booking change, slot grids, lists and dashboards may all be stale. */
function invalidateBookings(qc: QueryClient) {
  return Promise.all(
    ['appointments', 'appointment', 'availability', 'doctorMe', 'admin'].map((k) => qc.invalidateQueries({ queryKey: [k] })),
  );
}

function invalidateCatalog(qc: QueryClient) {
  return Promise.all(
    ['doctors', 'doctor', 'specialties', 'specialty', 'clinics', 'clinic', 'search', 'cities', 'admin', 'doctorMe', 'availability'].map((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    ),
  );
}

// ---------- Public catalog ----------

export const useDoctors = (query: DoctorQuery = {}, enabled = true) =>
  useQuery({ queryKey: qk.doctors(query), queryFn: () => catalogApi.doctors(query), placeholderData: keepPreviousData, enabled });
export const useDoctor = (id: string | undefined) =>
  useQuery({ queryKey: qk.doctor(id ?? ''), queryFn: () => catalogApi.doctor(id!), enabled: !!id });
export const useDoctorReviews = (id: string | undefined) =>
  useQuery({ queryKey: qk.reviews(id ?? ''), queryFn: () => catalogApi.doctorReviews(id!), enabled: !!id });
export const useAvailability = (id: string | undefined, opts: { from?: string; days?: number } = {}) =>
  useQuery({
    queryKey: qk.availability(id ?? '', opts.from, opts.days),
    queryFn: () => catalogApi.availability(id!, opts),
    enabled: !!id,
    // Slot grids should reflect other patients' bookings quickly.
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
export const useCities = () => useQuery({ queryKey: qk.cities, queryFn: catalogApi.cities, staleTime: 5 * 60_000 });
export const useSpecialties = (enabled = true) =>
  useQuery({ queryKey: qk.specialties, queryFn: catalogApi.specialties, staleTime: 5 * 60_000, enabled });
export const useSpecialty = (slug: string | undefined) =>
  useQuery({ queryKey: qk.specialty(slug ?? ''), queryFn: () => catalogApi.specialty(slug!), enabled: !!slug });
export const useClinics = (enabled = true) => useQuery({ queryKey: qk.clinics, queryFn: catalogApi.clinics, staleTime: 5 * 60_000, enabled });
export const useClinic = (id: string | undefined) =>
  useQuery({ queryKey: qk.clinic(id ?? ''), queryFn: () => catalogApi.clinic(id!), enabled: !!id });
export const useClinicDoctors = (id: string | undefined) =>
  useQuery({ queryKey: qk.clinicDoctors(id ?? ''), queryFn: () => catalogApi.clinicDoctors(id!), enabled: !!id });
export const useSearch = (text: string) =>
  useQuery({ queryKey: qk.search(text), queryFn: () => catalogApi.search(text), enabled: text.trim().length >= 2, placeholderData: keepPreviousData });

export function useAddReview(doctorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReviewRequest) => catalogApi.addReview(doctorId, body),
    onSuccess: () => invalidateCatalog(qc).then(() => qc.invalidateQueries({ queryKey: qk.reviews(doctorId) })),
  });
}

// ---------- Appointments ----------

export const useAppointments = (query: AppointmentQuery = {}, enabled = true) =>
  useQuery({ queryKey: qk.appointments(query), queryFn: () => appointmentsApi.list(query), enabled, placeholderData: keepPreviousData });
export const useAppointment = (id: string | undefined) =>
  useQuery({ queryKey: qk.appointment(id ?? ''), queryFn: () => appointmentsApi.get(id!), enabled: !!id });

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BookAppointmentRequest) => appointmentsApi.book(body),
    // Refresh slots even on failure: a 409 means someone else just took the slot.
    onSettled: () => invalidateBookings(qc),
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; appointmentDate: string; timeSlot: string }) => appointmentsApi.reschedule(v.id, v.appointmentDate, v.timeSlot),
    onSettled: () => invalidateBookings(qc),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; reason?: string }) => appointmentsApi.cancel(v.id, v.reason),
    onSettled: () => invalidateBookings(qc),
  });
}

export function useCompleteAppointment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => appointmentsApi.complete(id), onSettled: () => invalidateBookings(qc) });
}

export function useSetAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string } & SetStatusRequest) => appointmentsApi.setStatus(v.id, { status: v.status, reason: v.reason }),
    onSettled: () => invalidateBookings(qc),
  });
}

// ---------- Online consultations ----------

/** Join eligibility and lifecycle. Polls so the Join button opens (and closes) on time, by the server's clock. */
export const useConsultation = (appointmentId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: qk.consultation(appointmentId ?? ''),
    queryFn: () => consultationsApi.get(appointmentId!),
    enabled: !!appointmentId && enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

/** Room credentials are one-shot and short-lived: fetched by a mutation, never cached. */
export function useJoinConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => consultationsApi.join(appointmentId),
    onSuccess: (join, appointmentId) => qc.setQueryData(qk.consultation(appointmentId), join.consultation),
    onError: () => invalidateBookings(qc),
  });
}

export function useEndConsultation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (appointmentId: string) => consultationsApi.end(appointmentId), onSettled: () => invalidateBookings(qc) });
}

// ---------- Prescriptions ----------

/** The doctor gets their draft; patients get the prescription once it's issued (null before). */
export const usePrescription = (appointmentId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: qk.prescription(appointmentId ?? ''),
    queryFn: async () => (await prescriptionsApi.get(appointmentId!)).prescription,
    enabled: !!appointmentId && enabled,
  });

export function useSavePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { appointmentId: string } & SavePrescriptionRequest) => {
      const { appointmentId, ...body } = v;
      return prescriptionsApi.save(appointmentId, body);
    },
    onSuccess: (rx) => qc.setQueryData(qk.prescription(rx.appointmentId), rx),
  });
}

// ---------- Doctor portal ----------

export const useDoctorMe = (enabled = true) => useQuery({ queryKey: qk.doctorMe, queryFn: doctorPortalApi.me, enabled });

export function useUpdateFee() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (fee: number) => doctorPortalApi.setFee(fee), onSuccess: () => invalidateCatalog(qc) });
}

export function useUpdateAvailability() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: UpdateAvailabilityRequest) => doctorPortalApi.setAvailability(body), onSuccess: () => invalidateCatalog(qc) });
}

export function useUpdateDoctorProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (body: UpdateDoctorProfileRequest) => doctorPortalApi.updateProfile(body), onSuccess: () => invalidateCatalog(qc) });
}

// ---------- Admin ----------

export const useAdminStats = () => useQuery({ queryKey: qk.adminStats, queryFn: adminApi.stats });
export const useAdminDoctors = (query: AdminDoctorQuery = {}) =>
  useQuery({ queryKey: qk.adminDoctors(query), queryFn: () => adminApi.doctors(query), placeholderData: keepPreviousData });
export const useAdminUsers = (query: AdminUserQuery = {}) =>
  useQuery({ queryKey: qk.adminUsers(query), queryFn: () => adminApi.users(query), placeholderData: keepPreviousData });
export const useAdminUser = (id: string | undefined) =>
  useQuery({ queryKey: qk.adminUser(id ?? ''), queryFn: () => adminApi.user(id!), enabled: !!id });

export function useSaveDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; body: DoctorInput }) => (v.id ? adminApi.updateDoctor(v.id, v.body) : adminApi.createDoctor(v.body)),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useSetDoctorFlags() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string } & DoctorFlagsRequest) => adminApi.setDoctorFlags(v.id, v), onSuccess: () => invalidateCatalog(qc) });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => adminApi.setUserActive(v.id, v.isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminApi.deleteUser(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }) });
}

export function useSaveSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; body: SpecialtyInput }) => (v.id ? adminApi.updateSpecialty(v.id, v.body) : adminApi.createSpecialty(v.body)),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useDeleteSpecialty() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminApi.deleteSpecialty(id), onSuccess: () => invalidateCatalog(qc) });
}

export function useSaveClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; body: ClinicInput }) => (v.id ? adminApi.updateClinic(v.id, v.body) : adminApi.createClinic(v.body)),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useDeleteClinic() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => adminApi.deleteClinic(id), onSuccess: () => invalidateCatalog(qc) });
}
