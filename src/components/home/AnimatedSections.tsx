import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Award, BadgeCheck, CalendarCheck, ChevronLeft, ChevronRight, FileText, Languages, MapPin, Mic, Pause, Play, Star, Video } from 'lucide-react';

import type { Doctor, Specialty } from '../../api/contract';
import { useDoctors } from '../../api/hooks';
import { avatarFor } from '../common/format';
import { SpecialtyIcon } from '../common/IconHelper';
import { SPECIALTY_COLORS } from '../common/specialtyColors';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Animations run only for people who haven't asked their device to reduce motion. */
const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Reveal on scroll ----------

/**
 * Fades and lifts its content in the first time it scrolls into view. Children marked
 * `data-reveal` come in one after another; otherwise the whole block does.
 */
export const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const items = el.querySelectorAll('[data-reveal]');
        gsap.from(items.length ? items : el, {
          y: 48,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

// ---------- Count-up numbers ----------

/** Counts up to `value` when scrolled into view. Shows the real number straight away without motion. */
export const CountUp: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: value,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.v));
          },
        });
        return () => {
          el.textContent = String(value);
        };
      });
    },
    { dependencies: [value], revertOnUpdate: true },
  );
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
};

// ---------- Specialty marquee ----------

const DEFAULT_THEME = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', hoverBorder: 'hover:border-slate-300' };

const MarqueeRow: React.FC<{ items: Specialty[]; reverse?: boolean; duration: number }> = ({ items, reverse, duration }) => {
  const track = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The track holds the list twice, so moving it by half its width loops seamlessly.
        tween.current = gsap.fromTo(
          track.current,
          { xPercent: reverse ? -50 : 0 },
          { xPercent: reverse ? 0 : -50, duration, ease: 'none', repeat: -1 },
        );
      });
    },
    { dependencies: [items.length], revertOnUpdate: true },
  );
  // Ease to a stop on hover or keyboard focus, so a chip can be read and clicked.
  const setSpeed = (timeScale: number) => tween.current && gsap.to(tween.current, { timeScale, duration: 0.6, overwrite: true });

  const chips = [...items, ...items];
  return (
    <div
      className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto"
      onMouseEnter={() => setSpeed(0)}
      onMouseLeave={() => setSpeed(1)}
      onFocusCapture={() => setSpeed(0)}
      onBlurCapture={() => setSpeed(1)}
    >
      <div ref={track} className="flex w-max gap-3 py-1.5">
        {chips.map((sp, i) => {
          const theme = SPECIALTY_COLORS[sp.slug] ?? DEFAULT_THEME;
          const copy = i >= items.length;
          return (
            <Link
              key={`${sp.id}-${i}`}
              to={`/specialties/${sp.slug}`}
              aria-hidden={copy || undefined}
              tabIndex={copy ? -1 : undefined}
              className={`flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-white border ${theme.border} ${theme.hoverBorder} shadow-xs hover:shadow-md transition-all whitespace-nowrap`}
            >
              <span className={`w-9 h-9 rounded-full ${theme.bg} ${theme.text} flex items-center justify-center`}>
                <SpecialtyIcon name={sp.iconName} className="w-4.5 h-4.5" />
              </span>
              <span className="text-sm font-semibold text-slate-800">{sp.name}</span>
              {sp.doctorCount > 0 && (
                <span className="text-[11px] font-medium text-slate-400">
                  {sp.doctorCount} {sp.doctorCount === 1 ? 'doctor' : 'doctors'}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/** Two rows of specialty chips drifting in opposite directions. */
export const SpecialtyMarquee: React.FC<{ specialties: Specialty[] }> = ({ specialties }) => {
  if (specialties.length < 4) return null;
  const half = Math.ceil(specialties.length / 2);
  const rowA = specialties.slice(0, half);
  const rowB = specialties.slice(half).length >= 2 ? specialties.slice(half) : specialties;
  return (
    <section className="space-y-5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Every kind of care</p>
        <h2 className="mt-1 text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Specialists for every part of you</h2>
      </div>
      <div className="space-y-3">
        <MarqueeRow items={rowA} duration={38} />
        <MarqueeRow items={rowB} duration={44} reverse />
      </div>
    </section>
  );
};

// ---------- Doctor spotlight carousel ----------

const SLIDE_MS = 6000;

/** "Meet our specialists": one doctor at a time, animated with GSAP, auto-advancing with a progress bar. */
export const DoctorSpotlightCarousel: React.FC = () => {
  const query = useDoctors({ sortBy: 'rating', pageSize: 8 });
  const doctors = query.data?.items ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(reducedMotion);
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const count = doctors.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  // Slide-in: photo wipes and settles, details rise in one after another.
  useGSAP(
    () => {
      if (!count) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline()
          .fromTo('[data-slide-photo]', { clipPath: 'inset(0 100% 0 0 round 24px)', scale: 1.08 }, { clipPath: 'inset(0 0% 0 0 round 24px)', scale: 1, duration: 0.9, ease: 'power3.inOut' })
          .fromTo('[data-slide-line]', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power2.out', stagger: 0.07 }, '-=0.5');
      });
    },
    { scope: root, dependencies: [index, count], revertOnUpdate: true },
  );

  // Auto-advance: the progress bar fills over SLIDE_MS, then moves to the next doctor.
  const bar = useRef<gsap.core.Tween | null>(null);
  useGSAP(
    () => {
      if (count < 2) return;
      bar.current = gsap.fromTo(progress.current, { scaleX: 0 }, { scaleX: 1, duration: SLIDE_MS / 1000, ease: 'none', onComplete: () => go(index + 1) });
    },
    { dependencies: [index, count], revertOnUpdate: true },
  );
  useEffect(() => {
    if (paused || userPaused) bar.current?.pause();
    else bar.current?.resume();
  }, [paused, userPaused, index]);

  if (query.isPending || count === 0) return null;
  const d: Doctor = doctors[index]!;
  const fallback = avatarFor(d.name);

  return (
    <section
      ref={root}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      aria-roledescription="carousel"
      aria-label="Meet our specialists"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Meet our specialists</p>
          <h2 className="mt-1 text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">The doctors patients rate highest</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
            aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {userPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => go(index - 1)} className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer" aria-label="Previous doctor">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => go(index + 1)} className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center cursor-pointer" aria-label="Next doctor">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] bg-gradient-to-br from-brand-50 via-white to-teal-50 border border-slate-200 p-4 sm:p-6 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 md:gap-10 items-center" aria-live="polite">
          <div className="relative aspect-[4/5] max-h-[440px] w-full">
            <img
              key={d.id}
              data-slide-photo
              src={d.profileImageUrl || fallback}
              alt={d.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallback;
              }}
              className="absolute inset-0 w-full h-full object-cover object-top rounded-3xl shadow-xl"
            />
            {d.offersOnlineConsultation && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-teal-700 text-xs font-bold shadow">
                <Video className="w-3.5 h-3.5" /> Video consults
              </span>
            )}
            <span className="absolute -bottom-3 right-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-400 text-slate-900 text-sm font-black shadow-lg">
              <Star className="w-4 h-4 fill-slate-900" /> {d.rating}
            </span>
          </div>

          <div className="min-w-0 space-y-4">
            <p data-slide-line className="text-xs font-bold uppercase tracking-widest text-teal-600">
              {d.specialty}
            </p>
            <h3 data-slide-line className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="truncate">{d.name}</span>
              {d.isVerified && <BadgeCheck className="w-7 h-7 shrink-0 text-teal-500" aria-label="Verified" />}
            </h3>
            <p data-slide-line className="text-sm text-slate-500">
              {d.qualifications.join(' · ')}
            </p>
            {d.about && (
              <p data-slide-line className="text-slate-600 leading-relaxed line-clamp-3">
                {d.about}
              </p>
            )}
            <ul data-slide-line className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> {d.experienceYears} years experience
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> {d.reviewCount} patient reviews
              </li>
              <li className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 shrink-0 text-slate-400" /> <span className="truncate">{d.clinicName}, {d.city}</span>
              </li>
              {d.languages.length > 0 && (
                <li className="flex items-center gap-2 min-w-0">
                  <Languages className="w-4 h-4 shrink-0 text-slate-400" /> <span className="truncate">{d.languages.join(', ')}</span>
                </li>
              )}
            </ul>
            <div data-slide-line className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/doctors/${d.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-600/20 transition-colors"
              >
                View profile & book <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-sm text-slate-600">
                From <span className="font-black text-slate-900">₹{d.consultationFee}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnails and progress */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Choose a doctor">
          {doctors.map((doc, i) => (
            <button
              key={doc.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={doc.name}
              onClick={() => go(i)}
              className={`relative shrink-0 rounded-2xl overflow-hidden transition-all cursor-pointer ${
                i === index ? 'w-16 h-16 ring-2 ring-brand-600 ring-offset-2' : 'w-12 h-12 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={doc.profileImageUrl || avatarFor(doc.name)} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
            </button>
          ))}
          <div className="ml-auto hidden sm:block w-40 h-1.5 rounded-full bg-slate-200 overflow-hidden shrink-0" aria-hidden>
            <span ref={progress} className="block h-full bg-brand-600 origin-left" />
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------- Video visit journey ----------

const JOURNEY = [
  { icon: CalendarCheck, title: 'Book a video slot', text: 'Choose a doctor marked “Video consult” and pick a time that suits you.' },
  { icon: Mic, title: 'Check camera & mic', text: 'The waiting room lets you test your devices before you join.' },
  { icon: Video, title: 'Meet face to face', text: 'A private video room that only you and your doctor can join.' },
  { icon: FileText, title: 'Get your prescription', text: 'Watch it being written live. It’s saved to your visit afterwards.' },
];

/** The steps of a video visit; the connecting line draws and each step lights up as you scroll. */
export const ConsultJourney: React.FC = () => {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '[data-journey]', start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
        });
        tl.fromTo('[data-journey-line="x"]', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: JOURNEY.length }, 0);
        tl.fromTo('[data-journey-line="y"]', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: JOURNEY.length }, 0);
        gsap.utils.toArray<HTMLElement>('[data-journey-step]').forEach((step, i) => {
          tl.fromTo(step, { autoAlpha: 0.25, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, i);
          tl.fromTo(step.querySelector('[data-journey-icon]'), { scale: 0.6, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2)' }, i);
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Video consultations</p>
        <h2 className="mt-1 text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Your video visit, step by step</h2>
        <p className="mt-2 text-sm text-slate-500">From booking to prescription without leaving home.</p>
      </div>
      <ol data-journey className="relative mt-12 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
        {/* Connector: vertical on phones, horizontal from md up. */}
        <span className="absolute left-7 top-7 bottom-7 w-1 rounded-full bg-slate-200 md:hidden" aria-hidden>
          <span data-journey-line="y" className="block w-full h-full rounded-full bg-gradient-to-b from-brand-600 to-teal-400 origin-top" />
        </span>
        <span className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-1 rounded-full bg-slate-200" aria-hidden>
          <span data-journey-line="x" className="block w-full h-full rounded-full bg-gradient-to-r from-brand-600 to-teal-400 origin-left" />
        </span>
        {JOURNEY.map(({ icon: Icon, title, text }, i) => (
          <li key={title} data-journey-step className="relative flex md:flex-col md:items-center md:text-center gap-4">
            <span
              data-journey-icon
              className="relative z-10 w-15 h-15 shrink-0 rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25 ring-8 ring-slate-50"
            >
              <Icon className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-brand-700 text-xs font-black flex items-center justify-center shadow">{i + 1}</span>
            </span>
            <span>
              <span className="block font-bold text-slate-900">{title}</span>
              <span className="mt-1 block text-sm text-slate-500 max-w-xs">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-10 text-center">
        <Link to="/doctors?online=1" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
          Browse doctors who consult by video <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};
