import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, DollarSign, CheckCircle2, Building, Loader2 } from 'lucide-react';

import type { Appointment, Doctor, DoctorStats } from '../api/contract';
import { useAppointments, useCancelAppointment, useCompleteAppointment, useUpdateFee } from '../api/hooks';
import { DoctorPortal } from '../components/portal/DoctorPortal';
import { AvatarImg, ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState } from '../components/portal/PortalUI';
import { useFeedback } from '../components/portal/hooks';
import { formatDateKey, money } from '../components/portal/format';
import { ConsultationCard } from '../components/consultation/ConsultationCard';
import { ConsultationModeBadge } from '../components/consultation/ConsultationStatus';
import { JoinConsultationButton } from '../components/consultation/JoinConsultationButton';

export const DoctorDashboardPage: React.FC = () => (
  <DoctorPortal>{({ doctor, stats }) => <Dashboard doctor={doctor} stats={stats} />}</DoctorPortal>
);

const Dashboard: React.FC<{ doctor: Doctor; stats: DoctorStats }> = ({ doctor, stats }) => {
  const queue = useAppointments({ status: 'upcoming', pageSize: 10 });
  const onlineQueue = useAppointments({ status: 'upcoming', consultationMode: 'online', pageSize: 3 });
  const complete = useCompleteAppointment();
  const cancel = useCancelAppointment();
  const updateFee = useUpdateFee();

  const [feeInput, setFeeInput] = useState<string>(String(doctor.consultationFee));
  const feeFeedback = useFeedback();
  const queueFeedback = useFeedback();
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const handleComplete = (apt: Appointment) => {
    complete.mutate(apt.id, {
      onSuccess: () => queueFeedback.success(`Visit ${apt.bookingRef} marked as completed.`),
      onError: (err) => queueFeedback.fail(err),
    });
  };

  const handleUpdateFee = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number(feeInput);
    if (!Number.isInteger(fee) || fee < 10 || fee > 1000) {
      feeFeedback.fail(new Error('Enter a whole-rupee fee between ₹10 and ₹1,000.'));
      return;
    }
    updateFee.mutate(fee, {
      onSuccess: (d) => feeFeedback.success(`Consultation fee updated to ${money(d.consultationFee)}.`),
      onError: (err) => feeFeedback.fail(err),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <AvatarImg src={doctor.profileImageUrl} name={doctor.name} className="w-16 h-16 rounded-2xl border-2 border-brand-400 shadow-md" />
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Doctor Practice Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">{doctor.name}</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {doctor.specialty} Specialist • {doctor.clinicName} ({doctor.city})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/doctor/availability"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Manage Available Slots</span>
          </Link>
          <Link
            to="/doctor/appointments"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
          >
            All Appointments
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Today’s Visits" value={stats.todayVisits} hint="Booked for today" tone="text-slate-900" />
        <Metric label="Upcoming Visits" value={stats.upcoming} hint="Scheduled on calendar" tone="text-brand-600" />
        <Metric label="Completed Visits" value={stats.completed} hint="Consultations finalized" tone="text-emerald-600" />
        <Metric label="Completed Revenue" value={money(stats.completedRevenue)} hint="Fees of completed visits" tone="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming queue */}
        <div className="lg:col-span-2 space-y-4">
          {onlineQueue.data && onlineQueue.data.items.length > 0 && (
            <div className="space-y-3 pb-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upcoming Video Consultations</h2>
                <p className="text-xs text-slate-500">Patients can wait in the room before you start. Ending the call marks the visit completed.</p>
              </div>
              {onlineQueue.data.items.map((apt) => (
                <ConsultationCard key={apt.id} appointment={apt} perspective="doctor" />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Patient Schedule Queue</h2>
              <p className="text-xs text-slate-500">Upcoming appointments, soonest first.</p>
            </div>
            <Link to="/doctor/appointments" className="text-xs font-semibold text-brand-600 hover:underline">
              View Full History →
            </Link>
          </div>

          <FeedbackBanner feedback={queueFeedback.feedback} onClose={queueFeedback.clear} />

          {queue.isPending ? (
            <LoadingState label="Loading your queue…" />
          ) : queue.isError ? (
            <ErrorState error={queue.error} onRetry={() => void queue.refetch()} title="Couldn’t load your queue" />
          ) : queue.data.items.length === 0 ? (
            <EmptyState title="No upcoming appointments" message="New bookings from patients will appear here." />
          ) : (
            <div className="space-y-3">
              {queue.data.items.map((apt) => {
                const busy = (complete.isPending && complete.variables === apt.id) || (cancel.isPending && cancel.variables?.id === apt.id);
                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                          {apt.bookingRef}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{apt.patientName}</span>
                        <ConsultationModeBadge mode={apt.consultationMode} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-brand-500" />
                          {formatDateKey(apt.appointmentDate)} at {apt.timeSlot}
                        </span>
                        <span>•</span>
                        <span>{apt.patientPhone}</span>
                      </div>
                      <p className="text-xs text-slate-500 pt-1">
                        <strong className="text-slate-700">Reason:</strong> {apt.reason}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0">
                      <JoinConsultationButton appointment={apt} perspective="doctor" />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleComplete(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                      >
                        {busy && complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Complete</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          cancel.reset();
                          setCancelTarget(apt);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Consultation Fee Setting</span>
            </h3>
            <p className="text-xs text-slate-500">
              Current fee: <strong className="text-slate-900">{money(doctor.consultationFee)}</strong>. Existing bookings keep the fee they
              were booked at.
            </p>

            <FeedbackBanner feedback={feeFeedback.feedback} onClose={feeFeedback.clear} />

            <form onSubmit={handleUpdateFee} className="space-y-3">
              <div>
                <label htmlFor="fee" className="block text-xs font-semibold text-slate-700 mb-1">
                  Per Consultation Rate (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                  <input
                    id="fee"
                    type="number"
                    min={10}
                    max={1000}
                    step={5}
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 font-bold text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Between ₹10 and ₹1,000.</p>
              </div>

              <button
                type="submit"
                disabled={updateFee.isPending}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {updateFee.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save New Fee</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              <span>Associated Clinic</span>
            </h3>
            <p className="font-semibold text-slate-800">{doctor.clinicName}</p>
            <p className="text-slate-500">{doctor.clinicAddress}</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <span>Working Days:</span>
              <span className="font-semibold text-slate-800">{doctor.availableDays.length} days / week</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Rating:</span>
              <span className="font-semibold text-amber-600">
                {doctor.rating.toFixed(1)} ★ ({doctor.reviewCount} reviews)
              </span>
            </div>
            <Link
              to="/doctor/availability"
              className="block text-center w-full py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold"
            >
              Configure Days & Slots →
            </Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={cancelTarget !== null}
        title={`Cancel ${cancelTarget?.patientName ?? ''}'s visit?`}
        message={cancelTarget ? `${formatDateKey(cancelTarget.appointmentDate)} at ${cancelTarget.timeSlot}. The slot becomes available to other patients.` : undefined}
        tone="danger"
        confirmLabel="Cancel visit"
        inputLabel="Reason (optional, shared with the patient)"
        inputPlaceholder="e.g. Clinic closed for maintenance"
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
                queueFeedback.success(`Visit ${ref} cancelled.`);
              },
            },
          );
        }}
      />
    </div>
  );
};

const Metric: React.FC<{ label: string; value: React.ReactNode; hint: string; tone: string }> = ({ label, value, hint, tone }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    <div className={`text-2xl font-black mt-1 ${tone}`}>{value}</div>
    <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>
  </div>
);
