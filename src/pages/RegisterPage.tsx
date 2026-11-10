import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { User as UserIcon, Stethoscope, Mail, Lock, Phone, ArrowRight, AlertCircle, Building, Clock } from 'lucide-react';
import { errorMessage } from '../api/client';
import { useClinics, useSpecialties } from '../api/hooks';
import { roleHome, useAuth } from '../context/auth';
import { EMAIL_RE, passwordProblem } from '../components/common/validation';

type FromState = { from?: { pathname: string; search?: string } } | null;

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const specialtiesQuery = useSpecialties();
  const clinicsQuery = useClinics();
  const specialties = specialtiesQuery.data ?? [];
  const clinics = clinicsQuery.data ?? [];

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDoctor, setPendingDoctor] = useState(false);

  const fromLoc = (location.state as FromState)?.from;
  const from = fromLoc ? `${fromLoc.pathname}${fromLoc.search ?? ''}` : null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2) return setErrorMsg('Please enter your full name.');
    if (!EMAIL_RE.test(email.trim())) return setErrorMsg('Please enter a valid email address.');
    const pwIssue = passwordProblem(password);
    if (pwIssue) return setErrorMsg(pwIssue);
    if (password !== confirmPassword) return setErrorMsg('Passwords don’t match.');
    if (role === 'doctor' && (!specialtyId || !clinicId)) return setErrorMsg('Please choose your specialty and practice clinic.');

    setIsSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role,
        specialtyId: role === 'doctor' ? specialtyId : undefined,
        clinicId: role === 'doctor' ? clinicId : undefined,
      });
      if (user.role === 'doctor') {
        setPendingDoctor(true);
      } else {
        navigate(from ?? roleHome(user.role), { replace: true });
      }
    } catch (err) {
      setErrorMsg(errorMessage(err, 'We couldn’t create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingDoctor) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Your doctor profile is pending verification</h2>
          <p className="text-sm text-slate-600">
            Your account is ready. A Doctor 24x7 administrator will review your profile before it appears in patient search and can receive bookings.
            Meanwhile you can set up your schedule and consultation fee.
          </p>
          <button
            type="button"
            onClick={() => navigate('/doctor/dashboard', { replace: true })}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
          >
            Go to my practice dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="group inline-flex" aria-label="Doctor 24x7 home">
            <BrandLogo size="lg" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500">Join Doctor 24x7 to schedule appointments or manage your medical practice.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold" role="tablist">
          {(['patient', 'doctor'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                role === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'patient' ? <UserIcon className="w-4 h-4 text-emerald-600" /> : <Stethoscope className="w-4 h-4 text-brand-600" />}
              <span>{r === 'patient' ? "I'm a Patient" : "I'm a Doctor"}</span>
            </button>
          ))}
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleRegister(e)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. Jordan Hayes' : 'Your full name'}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputCls}
                />
              </div>
            </div>

            {role === 'doctor' && (
              <>
                <div>
                  <label htmlFor="reg-specialty" className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Medical Specialty *
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select id="reg-specialty" value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} className={`${inputCls} text-slate-700`}>
                      <option value="">{specialtiesQuery.isLoading ? 'Loading specialties…' : 'Select a specialty'}</option>
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-clinic" className="block text-xs font-semibold text-slate-700 mb-1">
                    Practice Clinic *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select id="reg-clinic" value={clinicId} onChange={(e) => setClinicId(e.target.value)} className={`${inputCls} text-slate-700`}>
                      <option value="">{clinicsQuery.isLoading ? 'Loading clinics…' : 'Select your clinic'}</option>
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">New doctor profiles are reviewed by an administrator before they appear in search.</p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputCls}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Use 8 or more characters with at least one letter and one number.</p>
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="reg-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <span>Creating Account...</span> : <span>Create Account</span>}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" state={location.state} className="font-bold text-brand-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
