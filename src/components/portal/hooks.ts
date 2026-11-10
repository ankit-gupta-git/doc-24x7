import React, { useState } from 'react';

import { errorMessage } from '../../api/client';

export type Feedback = { tone: 'success' | 'error'; message: string } | null;

/** `value`, updated only after it stops changing for `ms` (for search boxes that hit the API). */
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Feedback state that clears success messages after a few seconds. */
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = React.useCallback((next: Feedback) => {
    if (timer.current) clearTimeout(timer.current);
    setFeedback(next);
    if (next?.tone === 'success') timer.current = setTimeout(() => setFeedback(null), 4000);
  }, []);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return {
    feedback,
    clear: () => show(null),
    success: (message: string) => show({ tone: 'success', message }),
    fail: (err: unknown) => show({ tone: 'error', message: errorMessage(err) }),
  };
}
