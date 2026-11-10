import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search, CheckCircle2, XCircle, Phone, User as UserIcon, ArrowLeft, Loader2 } from 'lucide-react';

import type { Appointment, AppointmentQuery, AppointmentStatus, ConsultationMode, Doctor } from '../api/contract';
import { useAppointments, useCancelAppointment, useCompleteAppointment } from '../api/hooks';
import { DoctorPortal } from '../components/portal/DoctorPortal';
import { ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState, Pager } from '../components/portal/PortalUI';
import { useDebouncedValue, useFeedback } from '../components/portal/hooks';
import { addDaysKey, dateKey, formatDateKey } from '../components/portal/format';
import { ConsultationModeBadge } from '../components/consultation/ConsultationStatus';
import { JoinConsultationButton } from '../components/consultation/JoinConsultationButton';

type StatusTab = 'all' | AppointmentStatus;
type RangeTab = 'all' | 'today' | 'next7' | 'past';
type ModeTab = 'all' | ConsultationMode;

const RANGES: { value: RangeTab; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'next7', label: 'Next 7 days' },
  { value: 'past', label: 'Past' },
];

function rangeQuery(range: RangeTab): Pick<AppointmentQuery, 'from' | 'to'> {
  const today = dateKey();
  if (range === 'today') return { from: today, to: today };
  if (range === 'next7') return { from: today, to: addDaysKey(6) };
  if (range === 'past') return { to: addDaysKey(-1) };
  return {};
}

const PAGE_SIZE = 20;

export const DoctorAppointmentsPage: React.FC = () => <DoctorPortal>{({ doctor }) => <Appointments doctor={doctor} />}</DoctorPortal>;

const Appointments: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [range, setRange] = useState<RangeTab>('all');
  const [mode, setMode] = useState<ModeTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchTerm.trim());

  const base = { search: search || undefined, consultationMode: mode === 'all' ? undefined : mode, ...rangeQuery(range) };
  const list = useAppointments({ ...base, status: statusFilter === 'all' ? undefined : statusFilter, page, pageSize: PAGE_SIZE });
  // Tab counts: totals only (pageSize 1 keeps these cheap).
  const counts = {
    all: useAppointments({ ...base, pageSize: 1 }).data?.total,
    upcoming: useAppointments({ ...base, status: 'upcoming', pageSize: 1 }).data?.total,
    completed: useAppointments({ ...base, status: 'completed', pageSize: 1 }).data?.total,
    cancelled: useAppointments({ ...base, status: 'cancelled', pageSize: 1 }).data?.total,
  };

  const complete = useCompleteAppointment();
  const cancel = useCancelAppointment();
  const feedback = useFeedback();
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const changeFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const handleComplete = (apt: Appointment) =>
    complete.mutate(apt.id, {
      onSuccess: () => feedback.success(`Visit ${apt.bookingRef} marked as completed.`),
      onError: (err) => feedback.fail(err),
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/doctor/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctor Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Patient Appointments Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review appointments scheduled for {doctor.name} at {doctor.clinicName}.
          </p>
        </div>
        {counts.all !== undefined && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 self-start sm:self-auto">
            {counts.all} Patient Consultations
          </span>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => changeFilter(setStatusFilter)(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all shrink-0 ${
                  statusFilter === tab ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
                {counts[tab] !== undefined ? ` (${counts[tab]})` : ''}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => changeFilter(setSearchTerm)(e.target.value)}
              placeholder="Search patient, reason, or ref..."
              aria-label="Search appointments"
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => changeFilter(setRange)(r.value)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                range === r.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
          <span className="w-px bg-slate-200 mx-1" aria-hidden />
          {(
            [
              { value: 'all', label: 'All visits' },
              { value: 'online', label: 'Video' },
              { value: 'in_person', label: 'Clinic' },
            ] as const
          ).map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => changeFilter(setMode)(m.value)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                mode === m.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      {list.isPending ? (
        <LoadingState label="Loading appointments…" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} title="Couldn’t load appointments" />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No appointments found" message="Try a different status, date range or search." />
      ) : (
        <div className={`space-y-4 ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
          {list.data.items.map((apt) => {
            const busy = (complete.isPending && complete.variables === apt.id) || (cancel.isPending && cancel.variables?.id === apt.id);
            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
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
                      Payment: <strong className="text-slate-700 capitalize">{apt.paymentStatus.replace(/_/g, ' ')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <h3 className="text-base font-bold text-slate-900">{apt.patientName}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                      <span className="font-bold text-slate-800">
                        {formatDateKey(apt.appointmentDate)} at {apt.timeSlot}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {apt.patientPhone} ({apt.patientEmail})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                    <div>
                      <strong className="text-slate-800">Reason for visit:</strong> {apt.reason}
                    </div>
                    {apt.notes && (
                      <div className="text-slate-500 italic">
                        <strong>Patient notes:</strong> {apt.notes}
                      </div>
                    )}
                    {apt.cancellationReason && (
                      <div className="text-rose-600">
                        <strong>Cancellation notice:</strong> {apt.cancellationReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                  {apt.status === 'upcoming' && (
                    <>
                      <JoinConsultationButton appointment={apt} perspective="doctor" />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleComplete(apt)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {busy && complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Mark Completed</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          cancel.reset();
                          setCancelTarget(apt);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        Cancel Visit
                      </button>
                    </>
                  )}
                  {apt.status === 'completed' && (
                    <>
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Consultation Finished</span>
                      </span>
                      <JoinConsultationButton appointment={apt} perspective="doctor" />
                    </>
                  )}
                  {apt.status === 'cancelled' && (
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Cancelled</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />
        </div>
      )}

      <ConfirmModal
        open={cancelTarget !== null}
        title={`Cancel ${cancelTarget?.patientName ?? ''}'s visit?`}
        message={cancelTarget ? `${formatDateKey(cancelTarget.appointmentDate)} at ${cancelTarget.timeSlot}. The slot becomes available to other patients.` : undefined}
        tone="danger"
        confirmLabel="Cancel visit"
        inputLabel="Reason (optional, shared with the patient)"
        inputPlaceholder="e.g. Doctor unavailable that day"
        pending={cancel.isPending}
        error={cancel.error}
        onClose={() => setCancelTarget(null)}
        onConfirm={(reason) => {
          if (!cancelTarget) return;
          const ref = cancelTarget.bookingRef;
          cancel.mutate(
            { id: cancelTarget.id, reason: reason || undefined },
            {
              onSuccess: () => {
                setCancelTarget(null);
                feedback.success(`Visit ${ref} cancelled.`);
              },
            },
          );
        }}
      />
    </div>
  );
};
