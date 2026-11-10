/** Generated initials avatar for people without a photo. */
export function avatarFor(name: string, size = 200): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/^Dr\.?\s+/i, ''))}&background=0284c7&color=ffffff&size=${size}&bold=true`;
}

export const CLINIC_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800';

const SHORT_DAYS: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};
const ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** "Mon–Fri", "Mon, Wed, Fri" or "By appointment". */
export function workingDaysLabel(days: string[]): string {
  const idx = days.map((d) => ORDER.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b);
  if (idx.length === 0) return 'By appointment';
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contiguous && idx.length > 2) return `${SHORT_DAYS[ORDER[idx[0]]]}–${SHORT_DAYS[ORDER[idx[idx.length - 1]]]}`;
  return idx.map((i) => SHORT_DAYS[ORDER[i]]).join(', ');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Fri, 23 Oct 2026" for a YYYY-MM-DD calendar date (no timezone conversion). */
export function formatDateKey(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Oct 23" for a YYYY-MM-DD calendar date. */
export function shortDateKey(key: string): string {
  const [, mm, dd] = key.split('-');
  return `${MONTHS[Number(mm) - 1]} ${Number(dd)}`;
}
