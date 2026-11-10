import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronRight,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/auth';
import { useAppointments } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { CancelAppointmentDialog } from '../components/booking/CancelAppointmentDialog';
import { Appointment } from '../types';
import { RescheduleModal } from '../components/booking/RescheduleModal';
import { avatarFor, formatDateKey } from '../components/common/format';
import { ConsultationCard } from '../components/consultation/ConsultationCard';
import { ConsultationModeBadge } from '../components/consultation/ConsultationStatus';
import { JoinConsultationButton } from '../components/consultation/JoinConsultationButton';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  // Server-scoped to the signed-in patient.
  const upcomingQuery = useAppointments({ status: 'upcoming', pageSize: 50 });
  const completedQuery = useAppointments({ status: 'completed', pageSize: 10 });
  const cancelledQuery = useAppointments({ status: 'cancelled', pageSize: 1 });

  const [selectedForReschedule, setSelectedForReschedule] = useState<Appointment | null>(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<Appointment | null>(null);

  const upcomingAppointments = upcomingQuery.data?.items ?? [];
  const onlineUpcoming = upcomingAppointments.filter((a) => a.consultationMode === 'online').slice(0, 3);
  const pastAppointments = completedQuery.data?.items ?? [];
  const counts = {
    upcoming: upcomingQuery.data?.total,
    completed: completedQuery.data?.total,
    cancelled: cancelledQuery.data?.total,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-brand-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || avatarFor(user?.name ?? 'Patient')}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white/60 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                Patient Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Welcome back, {user?.name.split(' ')[0] ?? 'there'}!
            </h1>
            <p className="text-xs text-brand-100 mt-0.5">
              Review your upcoming consultations, reschedule visits, or search for new specialists.
            </p>
          </div>
        </div>

        <Link
          to="/doctors"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-700 font-bold text-xs shadow-md hover:bg-brand-50 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-brand-600" />
          <span>Book New Appointment</span>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Visits
            </span>
            <div className="text-2xl font-black text-brand-600 mt-1">
              {counts.upcoming ?? '–'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Consultations
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {counts.completed ?? '–'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cancelled Visits
            </span>
            <div className="text-2xl font-black text-slate-400 mt-1">
              {counts.cancelled ?? '–'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* UPCOMING VIDEO CONSULTATIONS */}
      {onlineUpcoming.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming Video Consultations</h2>
            <p className="text-xs text-slate-500">The room opens shortly before each appointment. Use a private, quiet place.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {onlineUpcoming.map((apt) => (
              <ConsultationCard key={apt.id} appointment={apt} perspective="patient" />
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING APPOINTMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>
            <p className="text-xs text-slate-500">Live verified bookings scheduled with your specialists.</p>
          </div>
          <Link
            to="/patient/appointments"
            className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
          >
            <span>All Appointments</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingQuery.isLoading ? (
          <LoadingState label="Loading your appointments…" />
        ) : upcomingQuery.isError ? (
          <ErrorState error={upcomingQuery.error} onRetry={() => void upcomingQuery.refetch()} />
        ) : upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                      Ref: {apt.bookingRef}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {apt.doctorName}
                    </h3>
                    <span className="text-xs font-medium text-brand-600 block">
                      {apt.doctorSpecialty}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Confirmed
                    </span>
                    <ConsultationModeBadge mode={apt.consultationMode} />
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      {formatDateKey(apt.appointmentDate)} at {apt.timeSlot}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-800">{apt.clinicName}</span>
                      <span className="text-slate-400 block text-[11px]">
                        {apt.consultationMode === 'online' ? 'Online video consultation' : apt.clinicAddress}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                    <strong className="text-slate-700">Reason: </strong>
                    {apt.reason}
                  </div>
                </div>

                {/* Actions */}
                {apt.consultationMode === 'online' && <JoinConsultationButton appointment={apt} className="w-full sm:w-auto" />}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalAppointment(apt)}
                    className="py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    Cancel Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedForReschedule(apt)}
                    className="py-2 px-4 text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">No upcoming appointments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Need a checkup? Search verified doctors and book in seconds.</p>
            </div>
            <Link
              to="/doctors"
              className="inline-block py-2 px-4 rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-xs"
            >
              Browse Doctors
            </Link>
          </div>
        )}
      </div>

      {/* RECENT PAST VISITS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Past & Completed Consultations</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Booking Ref</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Specialty</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pastAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono font-bold text-brand-700">{apt.bookingRef}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{apt.doctorName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{apt.doctorSpecialty}</td>
                    <td className="px-5 py-3.5">{formatDateKey(apt.appointmentDate)} ({apt.timeSlot})</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">₹{apt.consultationFee}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {completedQuery.isSuccess && pastAppointments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                      No completed consultations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={selectedForReschedule}
        isOpen={!!selectedForReschedule}
        onClose={() => setSelectedForReschedule(null)}
        onSuccess={() => setSelectedForReschedule(null)}
      />

      {/* Cancel Confirmation Modal */}
      <CancelAppointmentDialog appointment={cancelModalAppointment} onClose={() => setCancelModalAppointment(null)} />
    </div>
  );
};
