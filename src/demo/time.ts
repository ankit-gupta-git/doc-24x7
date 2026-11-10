/** Clinic-time-zone helpers for the demo API (mirrors backend/src/lib/time.ts without luxon). */
import type { Weekday } from '../api/contract';

export const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOT_RE = /^(0[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/;

export function parseSlot(slot: string): number | null {
  const m = SLOT_RE.exec(slot);
  if (!m) return null;
  let hours = Number(m[1]) % 12;
  if (m[3] === 'PM') hours += 12;
  return hours * 60 + Number(m[2]);
}

export function formatSlot(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

export const sortSlots = (slots: string[]) => [...slots].sort((a, b) => (parseSlot(a) ?? 0) - (parseSlot(b) ?? 0));

/** Wall-clock parts of an instant in a zone. */
function partsIn(zone: string, ms: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function todayIn(zone: string, ms = Date.now()): string {
  const p = partsIn(zone, ms);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Minutes since midnight now, in the zone. */
export function minutesNowIn(zone: string, ms = Date.now()): number {
  const p = partsIn(zone, ms);
  return p.hour * 60 + p.minute;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): Weekday {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(day + 6) % 7]!;
}

/** Epoch ms when a slot starts, in the clinic zone. */
export function slotStartMs(date: string, slot: string, zone: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const minutes = parseSlot(slot) ?? 0;
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  // Two passes settle the zone offset, including around DST changes.
  let guess = wall;
  for (let i = 0; i < 2; i++) {
    const p = partsIn(zone, guess);
    const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wall - seen;
  }
  return guess;
}

export function daysFromToday(date: string, zone: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayIn(zone)}T00:00:00Z`)) / 86_400_000);
}
