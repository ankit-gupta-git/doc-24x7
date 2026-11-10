import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Search,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { useAppointments } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { CancelAppointmentDialog } from '../components/booking/CancelAppointmentDialog';
import { Appointment, AppointmentStatus } from '../types';
import { RescheduleModal } from '../components/booking/RescheduleModal';
import { formatDateKey } from '../components/common/format';
import { ConsultationModeBadge } from '../components/consultation/ConsultationStatus';
import { JoinConsultationButton } from '../components/consultation/JoinConsultationButton';

export const PatientAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  const [selectedForReschedule, setSelectedForReschedule] = useState<Appointment | null>(null);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<Appointment | null>(null);

  // The list is filtered and searched on the server (scoped to this patient).
  const listQuery = useAppointments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    pageSize: 100,
  });
  const filtered = listQuery.data?.items ?? [];

  // Tab badges: one lightweight count query per status.
  const allCount = useAppointments({ pageSize: 1 }).data?.total;
  const upcomingCount = useAppointments({ status: 'upcoming', pageSize: 1 }).data?.total;
  const completedCount = useAppointments({ status: 'completed', pageSize: 1 }).data?.total;
  const cancelledCount = useAppointments({ status: 'cancelled', pageSize: 1 }).data?.total;
  const tabCounts: Record<'all' | AppointmentStatus, number | undefined> = {
    all: allCount,
    upcoming: upcomingCount,
    completed: completedCount,
    cancelled: cancelledCount,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Medical Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track, reschedule, or cancel your scheduled consultations with full history.
          </p>
        </div>

        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all shrink-0 ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab} ({tabCounts[tab] ?? '–'})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctor or booking ref..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
          />
        </div>
      </div>

      {/* Appointment Cards List */}
      {listQuery.isLoading ? (
        <LoadingState label="Loading appointments…" />
      ) : listQuery.isError ? (
        <ErrorState error={listQuery.error} onRetry={() => void listQuery.refetch()} />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-all"
            >
              {/* Left Info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    {apt.bookingRef}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      apt.status === 'upcoming'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : apt.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {apt.status}
                  </span>
                  <ConsultationModeBadge mode={apt.consultationMode} />
                  <span className="text-xs text-slate-400">
                    Booked on {new Date(apt.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {apt.doctorName}
                </h3>
                <span className="text-xs font-semibold text-brand-600 block">
                  {apt.doctorSpecialty}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="font-bold text-slate-800">
                      {formatDateKey(apt.appointmentDate)} at {apt.timeSlot}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{apt.consultationMode === 'online' ? `Online · ${apt.clinicName}` : apt.clinicName}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 mt-2">
                  <span className="font-semibold text-slate-700">Reason: </span>
                  {apt.reason}
                  {apt.cancellationReason && (
                    <span className="block text-rose-600 mt-1">
                      <strong>Cancellation note:</strong> {apt.cancellationReason}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Fee & Actions */}
              <div className="md:text-right shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 space-y-3 flex md:flex-col justify-between items-center md:items-end">
                <div>
                  <span className="text-[11px] text-slate-500 block">Fee:</span>
                  <span className="text-xl font-black text-slate-900">₹{apt.consultationFee}</span>
                </div>

                {apt.status === 'upcoming' ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <JoinConsultationButton appointment={apt} />
                    <button
                      type="button"
                      onClick={() => setCancelModalAppointment(apt)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForReschedule(apt)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <JoinConsultationButton appointment={apt} />
                    <Link
                      to={`/doctors/${apt.doctorId}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-block"
                    >
                      Book Doctor Again
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500">
            {searchTerm ? 'Try adjusting your search query.' : 'You have no appointments under this filter.'}
          </p>
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={selectedForReschedule}
        isOpen={!!selectedForReschedule}
        onClose={() => setSelectedForReschedule(null)}
        onSuccess={() => setSelectedForReschedule(null)}
      />

      {/* Cancel Modal */}
      <CancelAppointmentDialog appointment={cancelModalAppointment} onClose={() => setCancelModalAppointment(null)} />
    </div>
  );
};
