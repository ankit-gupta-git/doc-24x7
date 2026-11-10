import { useEffect, useState } from 'react';

import type { Consultation } from '../../api/contract';

/**
 * Milliseconds until the join window opens, measured on the server's clock
 * (the device clock may be wrong). Ticks every second while counting down.
 */
export function useServerCountdown(consultation: Consultation | undefined, fetchedAt: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  const active = consultation?.status === 'scheduled';
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  if (!consultation || !active) return null;
  const serverNow = new Date(consultation.serverTime).getTime() + (now - fetchedAt);
  return Math.max(0, new Date(consultation.joinOpensAt).getTime() - serverNow);
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
