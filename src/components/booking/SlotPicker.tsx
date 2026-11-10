import React, { useEffect, useMemo } from 'react';
import { Clock, Globe } from 'lucide-react';
import { useAvailability } from '../../api/hooks';
import type { AvailabilityDay } from '../../types';
import { ErrorState, LoadingState } from '../common/QueryState';
import { shortDateKey } from '../common/format';

function dayLabel(day: AvailabilityDay, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return day.weekday.slice(0, 3);
}

interface SlotPickerProps {
  doctorId: string;
  selectedDate: string;
  selectedSlot: string;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: string) => void;
  /** The appointment being rescheduled: its own slot is shown as "Current" instead of booked. */
  current?: { date: string; slot: string };
}

/**
 * Date strip + slot grid driven by the server's availability for the next 7 days
 * (booked, past and non-working days are all computed in the clinic's timezone).
 */
export const SlotPicker: React.FC<SlotPickerProps> = ({ doctorId, selectedDate, selectedSlot, onSelectDate, onSelectSlot, current }) => {
  const { data, isLoading, isError, error, refetch, isFetching } = useAvailability(doctorId, { days: 7 });

  const days = useMemo(() => data?.days ?? [], [data]);
  const activeDay = useMemo(() => days.find((d) => d.date === selectedDate), [days, selectedDate]);

  // Default to the first day with an open slot; clear a selection that just became unavailable.
  useEffect(() => {
    if (!data) return;
    if (!activeDay) {
      const firstOpen = data.days.find((d) => d.isWorkingDay && d.slots.some((s) => s.state === 'available')) ?? data.days[0];
      if (firstOpen) onSelectDate(firstOpen.date);
      return;
    }
    if (selectedSlot && activeDay.slots.find((s) => s.slot === selectedSlot)?.state !== 'available') {
      onSelectSlot('');
    }
  }, [data, activeDay, selectedSlot, onSelectDate, onSelectSlot]);

  if (isLoading) return <LoadingState label="Checking live availability…" className="py-10" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} title="Couldn’t load available slots" className="py-8" />;

  const openCount = activeDay?.slots.filter((s) => s.state === 'available').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">1. Select Appointment Date</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map((day, i) => {
            const isSelected = selectedDate === day.date;
            const off = !day.isWorkingDay;
            return (
              <button
                key={day.date}
                type="button"
                disabled={off}
                onClick={() => {
                  onSelectDate(day.date);
                  onSelectSlot('');
                }}
                title={off ? 'Not consulting on this day' : undefined}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  off
                    ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    : isSelected
                      ? 'border-brand-600 bg-brand-50/80 text-brand-900 ring-2 ring-brand-500/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase">{dayLabel(day, i)}</div>
                <div className="text-sm font-bold mt-0.5">{shortDateKey(day.date)}</div>
                {off && <div className="text-[9px] font-medium mt-0.5">Not consulting</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">2. Choose Consultation Slot</label>
          <span className="text-xs text-slate-600">
            {isFetching ? 'Refreshing…' : activeDay?.isWorkingDay ? `${openCount} of ${activeDay.slots.length} open` : ''}
          </span>
        </div>

        {activeDay && !activeDay.isWorkingDay ? (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            The doctor doesn’t consult on {activeDay.weekday}s. Please pick another day.
          </p>
        ) : activeDay && activeDay.slots.length === 0 ? (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">No slots are offered on this day.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
            {activeDay?.slots.map(({ slot, state }) => {
              const isCurrent = current && current.date === selectedDate && current.slot === slot;
              const unavailable = state !== 'available';
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={unavailable}
                  onClick={() => onSelectSlot(slot)}
                  title={isCurrent ? 'Your current time' : state === 'booked' ? 'Already booked' : state === 'past' ? 'This time has passed' : undefined}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed'
                      : unavailable
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-400/40'
                          : 'bg-white hover:bg-brand-50 text-slate-700 border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isCurrent ? `${slot} · Current` : slot}</span>
                </button>
              );
            })}
          </div>
        )}
        {data && (
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Times are local to the clinic ({data.timezone.replace(/_/g, ' ')}).
          </p>
        )}
      </div>
    </div>
  );
};
