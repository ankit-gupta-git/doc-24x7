import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Plus, Trash2, ArrowLeft, Loader2, Video } from 'lucide-react';

import type { Doctor, Weekday } from '../api/contract';
import { useUpdateAvailability } from '../api/hooks';
import { DoctorPortal } from '../components/portal/DoctorPortal';
import { FeedbackBanner } from '../components/portal/PortalUI';
import { useFeedback } from '../components/portal/hooks';
import { HALF_HOUR_SLOTS, WEEKDAYS, sortSlots } from '../components/portal/format';

export const DoctorAvailabilityPage: React.FC = () => (
  // Keyed by the saved schedule so the draft resets whenever the server copy changes.
  <DoctorPortal>
    {({ doctor }) => <AvailabilityEditor key={`${doctor.availableDays.join()}|${doctor.timeSlots.join()}|${doctor.offersOnlineConsultation}`} doctor={doctor} />}
  </DoctorPortal>
);

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

const AvailabilityEditor: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
  const save = useUpdateAvailability();
  const feedback = useFeedback();

  const [availableDays, setAvailableDays] = useState<Weekday[]>(doctor.availableDays);
  const [timeSlots, setTimeSlots] = useState<string[]>(sortSlots(doctor.timeSlots));
  const addable = useMemo(() => HALF_HOUR_SLOTS.filter((s) => !timeSlots.includes(s)), [timeSlots]);
  const [newSlot, setNewSlot] = useState<string>('');
  const [offersOnline, setOffersOnline] = useState(doctor.offersOnlineConsultation);

  const dirty =
    !sameSet(availableDays, doctor.availableDays) || !sameSet(timeSlots, doctor.timeSlots) || offersOnline !== doctor.offersOnlineConsultation;
  const validation =
    availableDays.length === 0 ? 'Select at least one working day.' : timeSlots.length === 0 ? 'Add at least one consultation slot.' : null;

  const toggleDay = (day: Weekday) =>
    setAvailableDays((days) => (days.includes(day) ? days.filter((d) => d !== day) : WEEKDAYS.filter((d) => d === day || days.includes(d))));

  const addTimeSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const slot = newSlot || addable[0];
    if (!slot || timeSlots.includes(slot)) return;
    setTimeSlots((s) => sortSlots([...s, slot]));
    setNewSlot('');
  };

  const handleSave = () => {
    if (validation) return;
    save.mutate(
      { availableDays, timeSlots, offersOnlineConsultation: offersOnline },
      {
        onSuccess: () => feedback.success('Working days and consultation slots saved. Patients see the new schedule right away.'),
        onError: (err) => feedback.fail(err),
      },
    );
  };

  const discard = () => {
    setAvailableDays(doctor.availableDays);
    setTimeSlots(sortSlots(doctor.timeSlots));
    setOffersOnline(doctor.offersOnlineConsultation);
    feedback.clear();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/doctor/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctor Dashboard</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Manage Working Days & Time Slots</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure which days of the week and which consultation times patients can book. Times are in your clinic’s time zone (
          {doctor.timezone}). Existing bookings are not changed.
        </p>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>1. Working Days of the Week</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Patients will be able to book slots on any selected day.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {WEEKDAYS.map((day) => {
            const isSelected = availableDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleDay(day)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                  isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div>{day}</div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5">{isSelected ? 'Active' : 'Off'}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>2. Available Consultation Time Slots</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Add or delete 30-minute consultation slots available for patient reservations.</p>
        </div>

        {timeSlots.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
            No slots yet. Add at least one below.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {timeSlots.map((slot) => (
              <div key={slot} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs group">
                <span className="font-bold text-xs text-slate-800">{slot}</span>
                <button
                  type="button"
                  onClick={() => setTimeSlots((s) => s.filter((x) => x !== slot))}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                  title={`Remove ${slot}`}
                  aria-label={`Remove ${slot}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addTimeSlot} className="pt-4 border-t border-slate-100 flex items-center gap-3 max-w-md">
          <select
            value={newSlot || addable[0] || ''}
            onChange={(e) => setNewSlot(e.target.value)}
            disabled={addable.length === 0}
            aria-label="Slot to add"
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 bg-white"
          >
            {addable.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={addable.length === 0}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-4 h-4 text-teal-600" />
            <span>3. Online Video Consultations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Let patients choose a video call instead of a clinic visit for the slots above. Turning this off keeps existing video bookings.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={offersOnline}
          aria-label="Offer online video consultations"
          onClick={() => setOffersOnline((v) => !v)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${offersOnline ? 'bg-teal-600' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${offersOnline ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
        {validation ? (
          <span className="text-xs font-semibold text-rose-600 sm:mr-auto">{validation}</span>
        ) : dirty ? (
          <span className="text-xs font-semibold text-amber-600 sm:mr-auto">You have unsaved changes.</span>
        ) : (
          <span className="text-xs text-slate-400 sm:mr-auto">All changes saved.</span>
        )}
        <button
          type="button"
          onClick={discard}
          disabled={!dirty || save.isPending}
          className="py-3 px-5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Discard changes
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || !!validation || save.isPending}
          className="py-3 px-8 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {save.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Save Availability Schedule</span>
        </button>
      </div>
    </div>
  );
};
