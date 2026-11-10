import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  FileText,
  MapPin,
  Printer,
  Radio,
  Stethoscope,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';

import { PrescriptionView } from '../prescription/PrescriptionView';
import { CountUp } from './AnimatedSections';

// ---------- Platform in numbers ----------

interface StatsProps {
  doctors: number;
  onlineDoctors: number;
  specialties: number;
  clinics: number;
  cities: number;
}

/** Live counts from the catalog (nothing made up): shown only once they've loaded. */
export const PlatformStats: React.FC<StatsProps> = ({ doctors, onlineDoctors, specialties, clinics, cities }) => {
  if (!doctors) return null;
  const stats = [
    { icon: Stethoscope, value: doctors, label: 'Verified doctors' },
    { icon: Video, value: onlineDoctors, label: 'Offer video consults' },
    { icon: ClipboardList, value: specialties, label: 'Specialties' },
    { icon: Building2, value: clinics, label: 'Partner clinics' },
    { icon: MapPin, value: cities, label: 'Cities' },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-teal-500 text-white p-6 sm:p-8 shadow-lg shadow-brand-600/20">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
          <div className="lg:max-w-56">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-100">Doctor 24x7 today</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight">Care you can book any time of day</h2>
          </div>
          <dl className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <Icon className="w-5 h-5 text-teal-100" />
                <dd className="mt-2 text-3xl font-black tabular-nums">
                  <CountUp value={value} />
                </dd>
                <dt className="text-xs text-white/80">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

// ---------- Live prescription spotlight ----------

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Introduces the live prescription feature, with an example of what the patient sees. */
export const LivePrescriptionSpotlight: React.FC = () => (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
          <Radio className="w-3.5 h-3.5" /> New in video consultations
        </span>
        <h2 className="mt-3 text-2xl sm:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
          Watch your prescription being written, live
        </h2>
        <p className="mt-3 text-slate-600">
          During a video consultation your doctor writes the prescription right beside the call, and it appears on your screen as they type. When the
          consultation ends, it’s saved to your visit.
        </p>
        <ul className="mt-6 space-y-4">
          {[
            { icon: Radio, title: 'Follow along in real time', text: 'Diagnosis, medicines, dosage and advice, as your doctor writes them.' },
            { icon: FileText, title: 'Saved to your visit', text: 'Open it any time from your appointments, under “Prescription”.' },
            { icon: Printer, title: 'Print or save as PDF', text: 'Take it to the pharmacy or keep it with your records.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-bold text-slate-900">{title}</span>
                <span className="block text-sm text-slate-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <Link
          to="/doctors?online=1"
          className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition-colors"
        >
          Find a doctor for a video consult <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-100 via-teal-50 to-white -z-10" aria-hidden />
        <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Example of what you see</p>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-6 max-w-md mx-auto" aria-label="Example prescription">
          <PrescriptionView
            status="live"
            meta={{
              doctorName: 'Dr. Arjun Mehta',
              doctorSpecialty: 'Cardiology',
              clinicName: 'Hridaya Heart & Vascular Centre',
              clinicAddress: '',
              patientName: 'Rahul Verma',
              appointmentDate: todayKey(),
              bookingRef: 'BK-SAMPLE',
            }}
            rx={{
              diagnosis: 'Stage 1 hypertension',
              medicines: [
                { name: 'Amlodipine', dosage: '5 mg', frequency: '1-0-0', duration: '30 days', instructions: 'After breakfast' },
                { name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once a day', duration: '8 weeks', instructions: 'With food' },
              ],
              advice: 'Cut down on salt. Walk for 30 minutes a day.',
              followUpDate: null,
            }}
          />
        </div>
      </div>
    </div>
  </section>
);

// ---------- For doctors ----------

/** Invites doctors to join, listing what the doctor portal already does. */
export const ForDoctorsSection: React.FC = () => (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="rounded-3xl bg-slate-900 text-white overflow-hidden grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <div className="p-7 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-300">For doctors</p>
        <h2 className="mt-2 text-2xl sm:text-[30px] font-bold leading-tight">Run your practice online with Doctor 24x7</h2>
        <p className="mt-3 text-slate-300 text-sm sm:text-base">
          Join as a doctor and manage clinic visits and video consultations from one dashboard. Profiles are checked by our team before they appear in
          search.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: CalendarClock, text: 'Set your working days and time slots' },
            { icon: Video, text: 'Consult patients by private video call' },
            { icon: FileText, text: 'Write prescriptions live during the call' },
            { icon: Users, text: 'See your patient queue and visit history' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
              <Icon className="w-5 h-5 shrink-0 text-teal-300" />
              {text}
            </div>
          ))}
        </div>
        <Link
          to="/register"
          className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 text-sm font-bold transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Join as a doctor
        </Link>
      </div>
      <div className="relative min-h-64 lg:min-h-full">
        <img
          src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=900"
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/30 to-transparent lg:via-transparent" aria-hidden />
      </div>
    </div>
  </section>
);

// ---------- FAQ ----------

const FAQS = [
  {
    q: 'How do I book an appointment?',
    a: 'Search for a doctor by name, specialty or city, pick a free slot on their profile and confirm. Each slot can only be booked once, so what you see is really available.',
  },
  {
    q: 'How does a video consultation work?',
    a: 'Book a slot marked “Video consult”. Shortly before your appointment, open your dashboard and click “Join Consultation”. You can test your camera and microphone in the waiting room before you join.',
  },
  {
    q: 'What do I need for a video call?',
    a: 'A recent version of Chrome, Edge, Safari or Firefox, a camera and microphone, and a stable internet connection. No app install is needed.',
  },
  {
    q: 'Will I get a prescription after an online consultation?',
    a: 'If your doctor prescribes something, you see it on your screen as they write it during the call. It’s saved to your visit when the consultation ends, and you can print it or save it as a PDF.',
  },
  {
    q: 'Can I reschedule or cancel?',
    a: 'Yes. Go to My Appointments and choose Reschedule or Cancel on any upcoming visit.',
  },
  {
    q: 'Who can see my visits and prescriptions?',
    a: 'Only you and the doctor you booked with. Video calls take place in a private room that only the two of you can join, and calls are not recorded.',
  },
];

/** Common questions, answered from how the app actually works. */
export const FaqSection: React.FC = () => (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8">
      <div>
        <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Frequently asked questions</h2>
        <p className="mt-2 text-sm text-slate-500">Everything you need to know about booking and consulting on Doctor 24x7.</p>
      </div>
      <div className="space-y-3">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-slate-200 bg-white open:border-brand-200 open:shadow-card transition-colors">
            <summary className="flex items-center justify-between gap-4 p-4 sm:p-5 cursor-pointer list-none font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="px-4 sm:px-5 pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);
