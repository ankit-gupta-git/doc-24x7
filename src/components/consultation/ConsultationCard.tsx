import React from 'react';
import { Calendar, Video } from 'lucide-react';

import type { Appointment } from '../../api/contract';
import { avatarFor, formatDateKey } from '../common/format';
import { JoinConsultationButton } from './JoinConsultationButton';

/** Compact card for an upcoming online consultation, with its live join control. */
export const ConsultationCard: React.FC<{ appointment: Appointment; perspective: 'patient' | 'doctor' }> = ({ appointment: a, perspective }) => {
  const name = perspective === 'patient' ? a.doctorName : a.patientName;
  const detail = perspective === 'patient' ? a.doctorSpecialty : a.reason;
  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {perspective === 'patient' ? (
          <img
            src={a.doctorImageUrl || avatarFor(a.doctorName)}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = avatarFor(a.doctorName);
            }}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">{name}</h3>
          <p className="text-xs text-slate-500 truncate">{detail}</p>
          <p className="text-xs text-slate-700 font-semibold flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            {formatDateKey(a.appointmentDate)} at {a.timeSlot}
          </p>
        </div>
      </div>
      <JoinConsultationButton appointment={a} perspective={perspective} className="self-start sm:self-center" />
    </div>
  );
};
