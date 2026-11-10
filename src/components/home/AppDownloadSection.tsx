import React, { useState } from 'react';
import { Apple, PhoneOff, Play } from 'lucide-react';
import { BrandMark } from '../common/BrandLogo';

/** Store links for the DocPulse mobile app (frontend/.env). Until they're set, the badges say "Coming soon". */
const ANDROID_URL = (import.meta.env.VITE_ANDROID_APP_URL as string | undefined) || '';
const IOS_URL = (import.meta.env.VITE_IOS_APP_URL as string | undefined) || '';

const DOCTOR_PHOTO = 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&q=80&w=600';
const PATIENT_PHOTO = 'https://images.unsplash.com/photo-1683348758606-860c720fda9a?auto=format&fit=crop&q=80&w=300';

const StoreBadge: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => {
  const className = 'inline-flex items-center gap-2.5 px-5 h-[50px] rounded-md bg-slate-800 text-white font-semibold text-[17px] transition-colors';
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} hover:bg-slate-900`}>
      {icon}
      {label}
    </a>
  ) : (
    <span className={`${className} opacity-90 cursor-default relative`} title="Coming soon">
      {icon}
      {label}
      <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded bg-amber-400 text-[10px] font-bold uppercase text-slate-900">Soon</span>
    </span>
  );
};

/** "Download the app" band: phone mock-up of a video consultation, SMS link form and store badges. */
export const AppDownloadSection: React.FC = () => {
  const [code, setCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 7) {
      setNote({ tone: 'error', text: 'Enter a valid phone number.' });
      return;
    }
    // No SMS provider is connected yet, so nothing is sent: say so rather than pretend.
    setNote({ tone: 'info', text: 'App download links by SMS are coming soon. Meanwhile, book and join video consultations right here on the website.' });
  };

  return (
    <section className="bg-slate-50 border-y border-slate-100 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Phone mock-up */}
        <div className="relative mx-auto w-[260px] sm:w-[310px]" aria-hidden>
          <div className="rounded-t-[34px] border-[5px] border-b-0 border-indigo-900 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4">
              <BrandMark className="w-7 h-7" />
              <span className="text-[22px] font-extrabold tracking-tight text-indigo-900">
                Doctor <span className="text-sky-500">24×7</span>
              </span>
            </div>
            <div className="relative h-[330px] sm:h-[400px] mx-2 bg-slate-200 overflow-hidden">
              <img src={DOCTOR_PHOTO} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-top" />
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                <PhoneOff className="w-5 h-5" />
              </span>
            </div>
          </div>
          <div className="absolute top-[72px] -right-12 sm:-right-24 w-[110px] sm:w-[135px] h-[150px] sm:h-[185px] rounded-xl border-4 border-white shadow-lg overflow-hidden bg-slate-200">
            <img src={PATIENT_PHOTO} alt="" loading="lazy" className="w-full h-full object-cover object-[center_15%] scale-125" />
          </div>
        </div>

        {/* Copy, SMS form and store badges */}
        <div className="max-w-xl">
          <h2 className="text-3xl sm:text-[40px] font-bold text-slate-700 tracking-tight leading-tight">Download the Doctor 24x7 app</h2>
          <p className="mt-5 text-base text-slate-700 leading-relaxed">
            Access video consultations with top verified doctors on the Doctor 24x7 app. Connect with doctors online from the comfort of your home.
          </p>

          <h3 className="mt-10 text-lg font-semibold text-slate-700">Get the link to download the app</h3>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 h-[60px] rounded-md border border-slate-300 bg-white overflow-hidden focus-within:border-sky-500">
              <label className="sr-only" htmlFor="app-sms-code">Country code</label>
              <select
                id="app-sms-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="px-3 font-semibold text-slate-800 bg-white border-r border-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <label className="sr-only" htmlFor="app-sms-phone">Phone number</label>
              <input
                id="app-sms-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setNote(null);
                }}
                placeholder="Enter phone number"
                className="flex-1 min-w-0 px-4 text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
              />
            </div>
            <button type="submit" className="h-[60px] px-9 rounded-md bg-sky-400 hover:bg-sky-500 text-white font-semibold text-lg transition-colors cursor-pointer">
              Send SMS
            </button>
          </form>
          {note && (
            <p role="status" className={`mt-3 text-sm ${note.tone === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
              {note.text}
            </p>
          )}

          <div className="mt-9 flex flex-wrap gap-5">
            <StoreBadge href={ANDROID_URL} icon={<Play className="w-5 h-5 fill-white" />} label="Google Play" />
            <StoreBadge href={IOS_URL} icon={<Apple className="w-5 h-5 fill-white" />} label="App Store" />
          </div>
        </div>
      </div>
    </section>
  );
};
