import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Appointment } from '../../types';
import { errorMessage } from '../../api/client';
import { useCancelAppointment } from '../../api/hooks';
import { formatDateKey } from '../common/format';

const REASONS = ['Change of plans', 'Recovered from illness', 'Schedule conflict', 'Booked with another doctor', 'Other'];

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
  onCancelled?: (updated: Appointment) => void;
}

/** Confirmation dialog that cancels an upcoming appointment with an optional reason. */
export const CancelAppointmentDialog: React.FC<Props> = ({ appointment, onClose, onCancelled }) => {
  if (!appointment) return null;
  return <Dialog key={appointment.id} appointment={appointment} onClose={onClose} onCancelled={onCancelled} />;
};

const Dialog: React.FC<Props & { appointment: Appointment }> = ({ appointment, onClose, onCancelled }) => {
  const cancel = useCancelAppointment();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const confirm = async () => {
    setErrorMsg(null);
    const text = reason === 'Other' ? details.trim() || undefined : details.trim() ? `${reason}: ${details.trim()}` : reason;
    try {
      const updated = await cancel.mutateAsync({ id: appointment.id, reason: text });
      onCancelled?.(updated);
      onClose();
    } catch (err) {
      setErrorMsg(errorMessage(err, 'We couldn’t cancel this appointment.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-bold text-slate-900 text-base">Cancel Appointment?</h3>
          <p className="text-xs text-slate-500">
            Your visit with {appointment.doctorName} on {formatDateKey(appointment.appointmentDate)} at {appointment.timeSlot} will be cancelled and the slot
            released to other patients.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700">
            Reason for Cancellation (optional)
          </label>
          <select
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 text-slate-700 focus:outline-hidden"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={250}
            rows={2}
            placeholder="Anything the clinic should know? (optional)"
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
          >
            Keep Booking
          </button>
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => void confirm()}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-xs shadow-md"
          >
            {cancel.isPending ? 'Cancelling…' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};
