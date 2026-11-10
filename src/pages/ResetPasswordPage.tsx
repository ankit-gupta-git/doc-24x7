import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { ApiError, errorMessage } from '../api/client';
import { authApi } from '../api/endpoints';
import { LoadingState } from '../components/common/QueryState';
import { passwordProblem } from '../components/common/validation';

export const ResetPasswordPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();

  const tokenQuery = useQuery({
    queryKey: ['resetToken', token],
    queryFn: () => authApi.checkResetToken(token),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const issue = passwordProblem(newPassword);
    if (issue) return setErrorMsg(issue);
    if (newPassword !== confirmPassword) return setErrorMsg('Passwords don’t match.');

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err) {
      setErrorMsg(errorMessage(err, 'We couldn’t reset your password. The link may have expired.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const invalidLink = !token || (tokenQuery.isError && tokenQuery.error instanceof ApiError && tokenQuery.error.status < 500);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center border border-teal-200 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h1>
          {tokenQuery.data && !isSuccess && (
            <p className="text-xs text-slate-500">
              Choose a new password for <strong className="text-slate-700">{tokenQuery.data.email}</strong>.
            </p>
          )}
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          {tokenQuery.isLoading ? (
            <LoadingState label="Checking your reset link…" className="py-8" />
          ) : invalidLink ? (
            <div className="text-center space-y-3" role="alert">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">This reset link is invalid or has expired</h3>
              <p className="text-xs text-slate-600">Reset links work once and expire after 1 hour. Request a new one to continue.</p>
              <Link
                to="/forgot-password"
                className="inline-block py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md"
              >
                Request a new link
              </Link>
            </div>
          ) : tokenQuery.isError ? (
            <div className="text-center space-y-3" role="alert">
              <p className="text-sm text-slate-700">{errorMessage(tokenQuery.error)}</p>
              <button type="button" onClick={() => void tokenQuery.refetch()} className="text-xs font-semibold text-brand-600 hover:underline">
                Try again
              </button>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4" role="status">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Password updated</h3>
                <p className="text-xs text-slate-600 mt-1">You’ve been signed out on all devices. Sign in with your new password.</p>
              </div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <form onSubmit={(e) => void handleReset(e)} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="rp-new" className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="rp-new"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">8+ characters with at least one letter and one number.</p>
                </div>
                <div>
                  <label htmlFor="rp-confirm" className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="rp-confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'Updating…' : 'Update Password'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
