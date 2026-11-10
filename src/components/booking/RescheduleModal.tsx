import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Appointment } from '../../types';
import { errorMessage } from '../../api/client';
import { useRescheduleAppointment } from '../../api/hooks';
import { SlotPicker } from './SlotPicker';
import { formatDateKey } from '../common/format';

interface RescheduleModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ appointment, isOpen, onClose, onSuccess }) => {
  if (!isOpen || !appointment) return null;
  return <RescheduleContent key={appointment.id} appointment={appointment} onClose={onClose} onSuccess={onSuccess} />;
};

const RescheduleContent: React.FC<{ appointment: Appointment; onClose: () => void; onSuccess: (a: Appointment) => void }> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const reschedule = useRescheduleAppointment();
  const [selectedDate, setSelectedDate] = useState<string>(appointment.appointmentDate);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReschedule = async () => {
    if (!selectedSlot) return setErrorMsg('Please select a new time slot.');
    setErrorMsg(null);
    try {
      const updated = await reschedule.mutateAsync({ id: appointment.id, appointmentDate: selectedDate, timeSlot: selectedSlot });
      onSuccess(updated);
      onClose();
    } catch (err) {
      // Conflicts refresh the availability (see the hook), so the grid now shows the taken slot.
      setSelectedSlot('');
      setErrorMsg(errorMessage(err, 'Failed to reschedule the appointment.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-brand-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Reschedule Appointment</h3>
            <p className="text-xs text-brand-100">Booking Ref: {appointment.bookingRef}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500">Currently Scheduled For:</span>
            <div className="font-bold text-slate-800 text-sm mt-0.5">
              {appointment.doctorName} on {formatDateKey(appointment.appointmentDate)} at {appointment.timeSlot}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <SlotPicker
            doctorId={appointment.doctorId}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onSelectDate={setSelectedDate}
            onSelectSlot={setSelectedSlot}
            current={{ date: appointment.appointmentDate, slot: appointment.timeSlot }}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Keep Current Time
            </button>
            <button
              type="button"
              disabled={reschedule.isPending || !selectedSlot}
              onClick={() => void handleReschedule()}
              className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {reschedule.isPending ? 'Rescheduling...' : 'Confirm New Time'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
