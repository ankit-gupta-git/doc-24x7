import React from 'react';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { errorMessage } from '../../api/client';

/** Centered spinner used while a query loads. */
export const LoadingState: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-500 ${className}`} role="status" aria-live="polite">
    <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

/** Error panel with the server's message and a Retry action. */
export const ErrorState: React.FC<{ error: unknown; onRetry?: () => void; title?: string; className?: string }> = ({
  error,
  onRetry,
  title = 'We couldn’t load this',
  className = '',
}) => (
  <div className={`max-w-md mx-auto text-center py-14 px-6 bg-white rounded-2xl border border-rose-100 shadow-soft ${className}`} role="alert">
    <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-600">{errorMessage(error)}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
      >
        <RotateCcw className="w-4 h-4" /> Retry
      </button>
    )}
  </div>
);

/** Skeleton grid placeholder for card lists. */
export const CardSkeletonGrid: React.FC<{ count?: number; className?: string; height?: string }> = ({
  count = 6,
  className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  height = 'h-64',
}) => (
  <div className={className} aria-hidden>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`${height} rounded-2xl bg-white border border-slate-200/80 animate-pulse`}>
        <div className="p-5 space-y-3">
          <div className="h-12 w-12 rounded-xl bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);
