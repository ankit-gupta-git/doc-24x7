import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { errorMessage } from '../api/client';
import { authApi } from '../api/endpoints';
import type { Gender } from '../api/contract';
import { passwordProblem } from '../components/common/validation';
import { useAuth } from '../context/auth';
import { avatarFor } from '../components/common/format';

type Feedback = { type: 'success' | 'error'; text: string } | null;

const FeedbackBanner: React.FC<{ feedback: Feedback }> = ({ feedback }) =>
  feedback ? (
    <div
      role={feedback.type === 'error' ? 'alert' : 'status'}
      className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
        feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
      }`}
    >
      {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
      <span>{feedback.text}</span>
    </div>
  ) : null;

export const PatientProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    if (name.trim().length < 2) return setProfileFeedback({ type: 'error', text: 'Please enter your full name.' });
    if (dateOfBirth && dateOfBirth >= today) return setProfileFeedback({ type: 'error', text: 'Date of birth must be in the past.' });

    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
      });
      setProfileFeedback({ type: 'success', text: 'Profile information updated.' });
    } catch (err) {
      setProfileFeedback({ type: 'error', text: errorMessage(err, 'We couldn’t save your profile.') });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (!currentPassword) return setPasswordFeedback({ type: 'error', text: 'Enter your current password.' });
    const issue = passwordProblem(newPassword);
    if (issue) return setPasswordFeedback({ type: 'error', text: issue });
    if (newPassword !== confirmPassword) return setPasswordFeedback({ type: 'error', text: 'New passwords don’t match.' });
    if (newPassword === currentPassword) return setPasswordFeedback({ type: 'error', text: 'Choose a password different from your current one.' });

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({ type: 'success', text: 'Password updated. You’ve been signed out on your other devices.' });
    } catch (err) {
      setPasswordFeedback({ type: 'error', text: errorMessage(err, 'We couldn’t change your password.') });
    } finally {
      setSavingPassword(false);
    }
  };

  const inputCls = 'w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your personal profile, contact details and password.</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <img
            src={user?.avatarUrl || avatarFor(user?.name ?? 'Patient')}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
          />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-50 text-brand-700">
              {user?.role === 'patient' ? 'Patient account' : `${user?.role ?? ''} account`}
            </span>
          </div>
        </div>

        <FeedbackBanner feedback={profileFeedback} />

        <form onSubmit={(e) => void handleProfileSave(e)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input id="pf-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="pf-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (Read-Only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="pf-email"
                  type="email"
                  disabled
                  value={user?.email ?? ''}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="pf-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pf-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="pf-dob"
                  type="date"
                  max={today}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={`${inputCls} text-slate-700`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                id="pf-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender | '')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 text-slate-700"
              >
                <option value="">Not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="pf-address" className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="pf-address"
                  type="text"
                  autoComplete="street-address"
                  maxLength={300}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs shadow-md transition-all"
            >
              {savingProfile ? 'Saving…' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-600" />
            <span>Change Password</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Changing your password signs you out on all your other devices.</p>
        </div>

        <FeedbackBanner feedback={passwordFeedback} />

        <form onSubmit={(e) => void handlePasswordChange(e)} className="space-y-4 max-w-md" noValidate>
          <div>
            <label htmlFor="pw-current" className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
          </div>

          <div>
            <label htmlFor="pw-new" className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">8+ characters with at least one letter and one number.</p>
          </div>

          <div>
            <label htmlFor="pw-confirm" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all"
          >
            {savingPassword ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
