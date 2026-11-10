import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  Star,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Calendar,
  Building,
} from 'lucide-react';
import { Doctor } from '../../types';
import { avatarFor, workingDaysLabel } from '../common/format';

interface HeroInteractiveShowcaseProps {
  doctor: Doctor;
  onBookClick: (doctor: Doctor) => void;
}

export const HeroInteractiveShowcase: React.FC<HeroInteractiveShowcaseProps> = ({
  doctor,
  onBookClick,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'credentials' | 'outcomes'>('schedule');
  const [selectedSlot, setSelectedSlot] = useState<string>(doctor.timeSlots[0] || '09:00 AM');

  // GSAP animation refs
  const showcaseContainerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const floatingVitalsRef = useRef<HTMLDivElement>(null);
  const floatingBadgeRef = useRef<HTMLDivElement>(null);
  const floatingBadgeLeftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !showcaseContainerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Subtle organic floating on satellite cards
      if (floatingVitalsRef.current) {
        gsap.to(floatingVitalsRef.current, {
          y: '-=10',
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      if (floatingBadgeRef.current) {
        gsap.to(floatingBadgeRef.current, {
          y: '+=8',
          duration: 2.8,
          delay: 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      if (floatingBadgeLeftRef.current) {
        gsap.to(floatingBadgeLeftRef.current, {
          y: '-=7',
          duration: 3.4,
          delay: 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // 2. Interactive multi-layer 3D Parallax Tilt
      const container = showcaseContainerRef.current;
      const mainCard = mainCardRef.current;
      if (!container || !mainCard) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Subtle main card tilt
        gsap.to(mainCard, {
          rotateX: Math.max(-4, Math.min(4, (-y / (rect.height / 2)) * 4)),
          rotateY: Math.max(-4, Math.min(4, (x / (rect.width / 2)) * 4)),
          transformPerspective: 1200,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        // Deeper parallax on floating satellites
        if (floatingVitalsRef.current) {
          gsap.to(floatingVitalsRef.current, {
            x: (x / rect.width) * 16,
            y: (y / rect.height) * 16,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }

        if (floatingBadgeRef.current) {
          gsap.to(floatingBadgeRef.current, {
            x: (-x / rect.width) * 14,
            y: (-y / rect.height) * 14,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }

        if (floatingBadgeLeftRef.current) {
          gsap.to(floatingBadgeLeftRef.current, {
            x: (-x / rect.width) * 12,
            y: (-y / rect.height) * 12,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(mainCard, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.8,
          ease: 'power2.out',
        });
        if (floatingVitalsRef.current) {
          gsap.to(floatingVitalsRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
        }
        if (floatingBadgeRef.current) {
          gsap.to(floatingBadgeRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
        }
        if (floatingBadgeLeftRef.current) {
          gsap.to(floatingBadgeLeftRef.current, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
        }
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }, showcaseContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={showcaseContainerRef} className="relative w-full max-w-lg mx-auto lg:max-w-none pt-4 pb-8">
      {/* 1. SATELLITE CARD: SYSTEM TELEMETRY (Top Left, In Front of Card z-30) */}
      <div
        ref={floatingBadgeLeftRef}
        className="absolute -top-3.5 -left-2 sm:-left-4 z-30 bg-white/95 text-slate-800 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-card flex items-center gap-2 pointer-events-none select-none"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="text-left text-[11px] font-bold text-slate-700 tracking-tight whitespace-nowrap">
          {doctor.isVerified ? 'Verified practitioner' : 'Listed practitioner'} <span className="text-emerald-600 font-semibold">• {doctor.city}</span>
        </div>
      </div>

      {/* 2. SATELLITE CARD: REAL-TIME CARDIAC TELEMETRY (Top Right) */}
      <div
        ref={floatingVitalsRef}
        className="absolute -top-3 -right-2 sm:-right-4 z-30 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700/80 shadow-card flex items-center gap-3 pointer-events-none select-none"
      >
        <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
        <div className="text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Consultation Fee
            </span>
          </div>
          <div className="text-xs font-bold text-white tracking-wide">
            ₹{doctor.consultationFee} <span className="text-slate-400 font-normal">• pay at clinic</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CLINICAL DOSSIER CARD */}
      <div
        ref={mainCardRef}
        className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-7 space-y-6 transition-shadow hover:shadow-hover"
      >
        {/* Header Ribbon & Dossier Mode Switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-700">In-Clinic Consultations Open</span>
          </div>

          {/* Interactive Dossier Tabs */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-[11px] font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-800'
              }`}
            >
              Slots
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-800'
              }`}
            >
              Credentials
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outcomes')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'outcomes'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-800'
              }`}
            >
              Outcomes
            </button>
          </div>
        </div>

        {/* Doctor Identity Block */}
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <img
              src={doctor.profileImageUrl || avatarFor(doctor.name)}
              alt={doctor.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = avatarFor(doctor.name);
              }}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
            />
            <div className="absolute -bottom-1 -right-1 bg-brand-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-100">
                {doctor.specialty}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>{doctor.rating}</span>
                <span className="text-amber-600 font-normal">({doctor.reviewCount})</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mt-1 truncate">
              {doctor.name}
            </h3>

            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Director of Interventional Cardiology
            </p>

            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{doctor.clinicName} • {doctor.city}</span>
            </p>
          </div>
        </div>

        {/* Tab 1: Interactive Schedule & Slot Selector */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>Consultation Hours ({workingDaysLabel(doctor.availableDays)})</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Instant Confirmation
                </span>
              </div>

              {/* Slot Selector Grid */}
              <div className="grid grid-cols-3 gap-2">
                {doctor.timeSlots.slice(0, 3).map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSlot === slot
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs scale-102'
                        : 'bg-white hover:bg-brand-50 text-slate-700 border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Selected: <strong>{selectedSlot}</strong> (pick a date when you book)</span>
              </div>
            </div>

            {/* Pricing & Booking CTA */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Out-of-Pocket Rate
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-900">
                    ₹{doctor.consultationFee}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 30 min</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onBookClick(doctor)}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>Reserve {selectedSlot}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Clinical Credentials Dossier */}
        {activeTab === 'credentials' && (
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3 text-xs text-left">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Medical Education & Training
              </span>
              <p className="font-semibold text-slate-900">
                {doctor.qualifications}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Experience
                </span>
                <p className="font-bold text-slate-800">{doctor.experienceYears} Years Practicing</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Board Certification
                </span>
                <p className="font-bold text-slate-800">ABIM Cardiovascular</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-500 font-medium">{doctor.languages.join(', ')}</span>
              <span className="text-brand-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{doctor.isVerified ? 'Verified by Doctor 24x7' : 'Pending verification'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Patient Outcomes */}
        {activeTab === 'outcomes' && (
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3 text-xs text-left">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-extrabold text-slate-900">{doctor.rating.toFixed(1)} / 5</div>
                <div className="text-[11px] text-slate-500">Average Patient Rating</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-emerald-600">{doctor.reviewCount}</div>
                <div className="text-[11px] text-slate-500">Patient Reviews</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-3">{doctor.about}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. SATELLITE CARD: CLINIC (Bottom Left - Safely Positioned) */}
      <div
        ref={floatingBadgeRef}
        className="absolute -bottom-3 -left-2 sm:-left-5 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-slate-200/90 shadow-card flex items-center gap-3 select-none"
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>Direct In-Person Visits</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-[11px] text-slate-500">
            {doctor.clinicName}
          </div>
        </div>
      </div>
    </div>
  );
};
