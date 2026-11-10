import React from 'react';
import { FileText } from 'lucide-react';

import type { Appointment } from '../../api/contract';
import { PrescriptionView } from './PrescriptionView';
import { isBlank, type LiveRxMessage } from './rx';

/** The patient's side of the live prescription: read-only, updated as the doctor types. */
export const LivePrescription: React.FC<{ appointment: Appointment; live: LiveRxMessage | null }> = ({ appointment, live }) => {
  if (!live || (live.type === 'draft' && isBlank(live.prescription))) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
        <span className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <FileText className="w-7 h-7" />
        </span>
        <p className="text-sm font-bold text-slate-800">Your prescription</p>
        <p className="text-xs max-w-[16rem]">
          If {appointment.doctorName} prescribes anything, you’ll see it here as they write it. It’s saved to your visit when the consultation ends.
        </p>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-5" aria-live="polite">
      {live.type === 'issued' ? (
        <PrescriptionView rx={live.prescription} meta={live.prescription} status="issued" issuedAt={live.prescription.issuedAt} />
      ) : (
        <PrescriptionView rx={live.prescription} meta={appointment} status="live" />
      )}
    </div>
  );
};
