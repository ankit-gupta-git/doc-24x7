import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';

import { errorMessage } from '../../api/client';
import type { Feedback } from './hooks';
import { initialsOf } from './format';

/** Full-width spinner shown while a page's first request is in flight. */
export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3" role="status">
    <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
    <span className="text-xs font-semibold">{label}</span>
  </div>
);

/** Error card with a Retry button. */
export const ErrorState: React.FC<{ error: unknown; onRetry?: () => void; title?: string }> = ({
  error,
  onRetry,
  title = 'Couldn’t load this page',
}) => (
  <div className="bg-white rounded-2xl border border-rose-200 shadow-soft p-8 text-center max-w-lg mx-auto my-10 space-y-3" role="alert">
    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
    <h2 className="font-bold text-slate-900">{title}</h2>
    <p className="text-xs text-slate-600">{errorMessage(error)}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry</span>
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; message?: string; action?: React.ReactNode }> = ({ title, message, action }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
    <p className="font-bold text-slate-800 text-sm">{title}</p>
    {message && <p className="text-xs text-slate-500">{message}</p>}
    {action && <div className="pt-2">{action}</div>}
  </div>
);

/** Inline success / error banner for mutation results. */
export const FeedbackBanner: React.FC<{ feedback: Feedback; onClose?: () => void }> = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const ok = feedback.tone === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
        ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}
    >
      {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
      <span className="flex-1">{feedback.message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="text-current opacity-60 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
  /** Shows an optional text input whose value is passed to onConfirm. */
  inputLabel?: string;
  inputPlaceholder?: string;
  pending?: boolean;
  /** Error from the last attempt, shown inside the dialog. */
  error?: unknown;
  onConfirm: (input: string) => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'default',
  inputLabel,
  inputPlaceholder,
  pending,
  error,
  onConfirm,
  onClose,
}) => {
  const [text, setText] = useState('');
  if (!open) return null;
  const close = () => {
    setText('');
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white rounded-2xl shadow-hover w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {message && <div className="text-xs text-slate-600 leading-relaxed">{message}</div>}
        {inputLabel && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{inputLabel}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={inputPlaceholder}
              maxLength={300}
              rows={3}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
          </div>
        )}
        {error ? (
          <p className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs" role="alert">
            {errorMessage(error)}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onConfirm(text.trim())}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 ${
              tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/** Profile photo with an initials fallback when the URL is missing or broken. */
export const AvatarImg: React.FC<{ src: string | null | undefined; name: string; className?: string }> = ({ src, name, className = 'w-10 h-10 rounded-xl' }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0`} aria-label={name}>
        {initialsOf(name)}
      </div>
    );
  }
  return <img src={src} alt={name} onError={() => setFailed(true)} className={`${className} object-cover shrink-0`} />;
};

/** Prev / next pager for paginated admin lists. */
export const Pager: React.FC<{ page: number; pageSize: number; total: number; onPage: (p: number) => void }> = ({ page, pageSize, total, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

