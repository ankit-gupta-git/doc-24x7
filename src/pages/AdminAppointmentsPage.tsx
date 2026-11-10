import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Eye, X } from 'lucide-react';

import type { Appointment, AppointmentStatus } from '../api/contract';
import { useAppointments, useSetAppointmentStatus } from '../api/hooks';
import { ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState, Pager } from '../components/portal/PortalUI';
import { useDebouncedValue, useFeedback } from '../components/portal/hooks';
import { formatDateKey, money } from '../components/portal/format';

type StatusTab = 'all' | AppointmentStatus;
const PAGE_SIZE = 25;

const statusClass = (s: AppointmentStatus) =>
  s === 'upcoming'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : s === 'completed'
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-rose-50 text-rose-700 border border-rose-200';

export const AdminAppointmentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchTerm.trim()) || undefined;

  const list = useAppointments({ search, status: statusFilter === 'all' ? undefined : statusFilter, page, pageSize: PAGE_SIZE });
  const counts: Record<StatusTab, number | undefined> = {
    all: useAppointments({ search, pageSize: 1 }).data?.total,
    upcoming: useAppointments({ search, status: 'upcoming', pageSize: 1 }).data?.total,
    completed: useAppointments({ search, status: 'completed', pageSize: 1 }).data?.total,
    cancelled: useAppointments({ search, status: 'cancelled', pageSize: 1 }).data?.total,
  };

  const setStatus = useSetAppointmentStatus();
  const feedback = useFeedback();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [override, setOverride] = useState<{ apt: Appointment; status: AppointmentStatus } | null>(null);

  const confirmOverride = (reason: string) => {
    if (!override) return;
    const { apt, status } = override;
    setStatus.mutate(
      { id: apt.id, status, reason: reason || undefined },
      {
        onSuccess: (updated) => {
          setOverride(null);
          setSelected((cur) => (cur?.id === updated.id ? updated : cur));
          feedback.success(`${updated.bookingRef} is now ${updated.status}.`);
        },
      },
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Appointment Bookings Oversight</h1>
          <p className="text-xs text-slate-500 mt-1">Register of all patient bookings, consultation schedules and fees.</p>
        </div>
        {counts.all !== undefined && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {counts.all} Total Platform Bookings
          </span>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search booking ref, patient or doctor..."
            aria-label="Search bookings"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all shrink-0 ${
                statusFilter === s ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
              {counts[s] !== undefined ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      {list.isPending ? (
        <LoadingState label="Loading bookings…" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} title="Couldn’t load bookings" />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No bookings found" message="Try a different status or search." />
      ) : (
        <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Booking Ref</th>
                  <th className="px-5 py-3.5">Patient Name</th>
                  <th className="px-5 py-3.5">Assigned Doctor</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Clinic Location</th>
                  <th className="px-5 py-3.5">Fee</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {list.data.items.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-brand-700">{apt.bookingRef}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>{apt.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{apt.patientPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                      <div className="text-[10px] text-brand-600">{apt.doctorSpecialty}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{formatDateKey(apt.appointmentDate)}</div>
                      <div className="text-[10px] text-slate-500">{apt.timeSlot}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="truncate block max-w-[150px]">{apt.clinicName}</span>
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">{money(apt.consultationFee)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusClass(apt.status)}`}>{apt.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(apt)}
                        className="p-1.5 text-slate-600 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Inspect booking details"
                        aria-label={`Inspect ${apt.bookingRef}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4">
            <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Booking Reference</span>
                <span className="text-base font-mono font-bold text-brand-700">{selected.bookingRef}</span>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Patient</span>
                  <span className="font-bold text-slate-800">{selected.patientName}</span>
                  <span className="text-[11px] text-slate-500 block">{selected.patientPhone}</span>
                  <span className="text-[11px] text-slate-500 block">{selected.patientEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Doctor</span>
                  <span className="font-bold text-slate-800">{selected.doctorName}</span>
                  <span className="text-[11px] text-brand-600 block">{selected.doctorSpecialty}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 block">Scheduled Time & Clinic</span>
                <div className="font-bold text-slate-800">
                  {formatDateKey(selected.appointmentDate)} at {selected.timeSlot}
                </div>
                <div className="text-slate-600">{selected.clinicName}</div>
                <div className="text-slate-400 text-[11px]">
                  {selected.clinicAddress} · {selected.timezone}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 block">Reason for Visit</span>
                <div className="text-slate-700">{selected.reason}</div>
                {selected.notes && <div className="text-slate-500 italic mt-1">Notes: {selected.notes}</div>}
                {selected.cancellationReason && (
                  <div className="text-rose-600 mt-1 font-semibold">Cancellation reason: {selected.cancellationReason}</div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <span className="text-slate-400 block">Fee & Payment</span>
                  <span className="font-black text-slate-900 text-sm">
                    {money(selected.consultationFee)} ({selected.paymentStatus.replace(/_/g, ' ')})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Override Status:</span>
                  {(['upcoming', 'completed', 'cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={selected.status === s}
                      onClick={() => {
                        setStatus.reset();
                        setOverride({ apt: selected, status: s });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        selected.status === s ? 'bg-slate-900 text-white cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={override !== null}
        title={override ? `Mark ${override.apt.bookingRef} as ${override.status}?` : ''}
        message={
          override
            ? override.apt.status === 'cancelled'
              ? 'Restoring a cancelled visit re-reserves its slot. If another patient has booked that slot since, the change is refused.'
              : override.status === 'cancelled'
                ? 'The slot becomes available to other patients. The patient and doctor will see the visit as cancelled.'
                : 'This overrides the current status for the patient and the doctor.'
            : undefined
        }
        tone={override?.status === 'cancelled' ? 'danger' : 'default'}
        confirmLabel="Change status"
        inputLabel={override?.status === 'cancelled' ? 'Reason (optional)' : undefined}
        inputPlaceholder="e.g. Duplicate booking"
        pending={setStatus.isPending}
        error={setStatus.error}
        onClose={() => setOverride(null)}
        onConfirm={confirmOverride}
      />
    </div>
  );
};
