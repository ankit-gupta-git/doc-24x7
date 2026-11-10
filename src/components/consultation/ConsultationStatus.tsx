import React from 'react';
import { Building, Video } from 'lucide-react';

import type { ConsultationMode, ConsultationStatus as Status } from '../../api/contract';

const STATUS: Record<Status, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  open: { label: 'Room open', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'In progress', className: 'bg-brand-50 text-brand-700 border-brand-200' },
  ended: { label: 'Ended', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  missed: { label: 'Missed', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

/** Server-side lifecycle of an online consultation. */
export const ConsultationStatus: React.FC<{ status: Status }> = ({ status }) => {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${s.className}`}>
      {status === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" aria-hidden />}
      {s.label}
    </span>
  );
};

/** "Video visit" vs "Clinic visit" chip for appointment cards. */
export const ConsultationModeBadge: React.FC<{ mode: ConsultationMode }> = ({ mode }) =>
  mode === 'online' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-100">
      <Video className="w-3 h-3" />
      Video visit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-50 text-slate-600 border border-slate-200">
      <Building className="w-3 h-3" />
      Clinic visit
    </span>
  );
