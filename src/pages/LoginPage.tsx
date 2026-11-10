import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { errorMessage } from '../api/client';
import { roleHome, useAuth } from '../context/auth';

type FromState = { from?: { pathname: string; search?: string } } | null;

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, role, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where a protected route (or the booking flow) sent the user from.
  const fromLoc = (location.state as FromState)?.from;
  const from = fromLoc && fromLoc.pathname !== '/login' ? `${fromLoc.pathname}${fromLoc.search ?? ''}` : null;

  if (status === 'ready' && isAuthenticated && !isSubmitting) {
    return <Navigate to={from ?? roleHome(role)} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      navigate(from ?? roleHome(user.role), { replace: true });
    } catch (err) {
      setErrorMsg(errorMessage(err, 'We couldn’t sign you in. Please try again.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="group inline-flex" aria-label="Doctor 24x7 home">
            <BrandLogo size="lg" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-500">
            {from ? 'Sign in to continue where you left off.' : 'Patients, doctors and administrators all sign in here.'}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <span>Signing in...</span> : <span>Sign In</span>}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" state={location.state} className="font-bold text-brand-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
