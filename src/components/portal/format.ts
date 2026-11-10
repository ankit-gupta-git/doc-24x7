import type { Weekday } from '../../api/contract';

export const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function initialsOf(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDaysKey(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** "2026-10-23" -> "Fri, 23 Oct 2026" (parsed as a calendar date, no timezone shift). */
export function formatDateKey(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatIso(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "02:30 PM" -> minutes since midnight (NaN if malformed). */
export function slotMinutes(slot: string): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot.trim());
  if (!m) return Number.NaN;
  let h = Number(m[1]) % 12;
  if (m[3]!.toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

export function minutesToSlot(total: number): string {
  const h24 = Math.floor(total / 60) % 24;
  const mins = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad(h12)}:${pad(mins)} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

export const sortSlots = (slots: string[]) => [...slots].sort((a, b) => slotMinutes(a) - slotMinutes(b));

/** Every 30-minute slot from 07:00 AM to 09:30 PM. */
export const HALF_HOUR_SLOTS: string[] = Array.from({ length: 30 }, (_, i) => minutesToSlot(7 * 60 + i * 30));

export const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
];
