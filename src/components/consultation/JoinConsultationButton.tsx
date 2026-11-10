import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Loader2, Video } from 'lucide-react';

import type { Appointment } from '../../api/contract';
import { useConsultation } from '../../api/hooks';
import { ConsultationStatus } from './ConsultationStatus';
import { formatCountdown, useServerCountdown } from './useServerCountdown';

interface Props {
  appointment: Appointment;
  /** Doctors see "Start" before the call has begun. */
  perspective?: 'patient' | 'doctor';
  className?: string;
}

/**
 * Join / countdown control for an online appointment. Eligibility comes from the server
 * (status, join window, server clock); this only reflects it.
 */
export const JoinConsultationButton: React.FC<Props> = ({ appointment, perspective = 'patient', className = '' }) => {
  const live = appointment.consultationMode === 'online' && appointment.status === 'upcoming';
  const q = useConsultation(appointment.id, live);
  const remaining = useServerCountdown(q.data, q.dataUpdatedAt);
  const opened = remaining === 0;
  const { refetch } = q;
  // Ask the server again the moment the countdown reaches zero, rather than waiting for the next poll.
  useEffect(() => {
    if (opened) void refetch();
  }, [opened, refetch]);

  if (appointment.consultationMode !== 'online') return null;
  if (appointment.consultationMode === 'online' && appointment.status === 'completed') {
    return (
      <Link
        to={`/prescription/${appointment.id}`}
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-colors ${className}`}
      >
        <FileText className="w-4 h-4" />
        <span>Prescription</span>
      </Link>
    );
  }
  if (!live) return q.data ? <ConsultationStatus status={q.data.status} /> : null;
  if (q.isPending) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking room…
      </span>
    );
  }
  if (q.isError || !q.data) return null;

  const c = q.data;
  if (c.canJoin) {
    const label = perspective === 'doctor' && c.status === 'open' ? 'Start Consultation' : 'Join Consultation';
    return (
      <Link
        to={`/consultation/${appointment.id}`}
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors ${className}`}
      >
        <Video className="w-4 h-4" />
        <span>{label}</span>
        {c.status === 'in_progress' && <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-label="Call in progress" />}
      </Link>
    );
  }

  if (remaining !== null && remaining > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold ${className}`}
        title={c.joinBlockedReason ?? undefined}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Room opens in {formatCountdown(remaining)}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col gap-1 items-start text-xs ${className}`}>
      <ConsultationStatus status={c.status} />
      {c.joinBlockedReason && <span className="text-slate-500 max-w-[16rem]">{c.joinBlockedReason}</span>}
    </span>
  );
};
