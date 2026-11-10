import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Award, BadgeCheck, ArrowRight, CalendarDays, Video } from 'lucide-react';
import { Doctor } from '../../types';
import { avatarFor, workingDaysLabel } from './format';

interface DoctorCardProps {
  doctor: Doctor;
  onBookClick?: (doctor: Doctor) => void;
}

/** Vertical card: photo with badges, then details, with price and actions pinned to the bottom so cards in a row line up. */
export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookClick }) => {
  const fallbackAvatar = avatarFor(doctor.name);

  return (
    <div className="group h-full bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-hover hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Photo with specialty, video and rating badges */}
      <Link to={`/doctors/${doctor.id}`} className="relative block aspect-[4/3] bg-slate-100 overflow-hidden" tabIndex={-1} aria-hidden>
        <img
          src={doctor.profileImageUrl || fallbackAvatar}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackAvatar;
          }}
          className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <span className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-brand-700 shadow-xs">
          {doctor.specialty}
        </span>
        {doctor.offersOnlineConsultation && (
          <span className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-[11px] font-bold bg-teal-500 text-white inline-flex items-center gap-1 shadow-xs">
            <Video className="w-3 h-3" />
            Video
          </span>
        )}
        <span className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 inline-flex items-center gap-1 shadow-xs">
          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          {doctor.rating}
          <span className="font-medium text-slate-500">({doctor.reviewCount})</span>
        </span>
      </Link>

      {/* Details */}
      <div className="flex-1 flex flex-col p-4 sm:p-5">
        <Link
          to={`/doctors/${doctor.id}`}
          className="flex items-center gap-1.5 text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-brand-600 transition-colors"
          title={doctor.name}
        >
          <span className="truncate">{doctor.name}</span>
          {doctor.isVerified && (
            <BadgeCheck className="w-4.5 h-4.5 shrink-0 text-teal-500" aria-label="Verified" />
          )}
        </Link>
        <p className="text-xs text-slate-500 truncate mt-0.5" title={doctor.qualifications[0]}>
          {doctor.qualifications[0] || 'Board Certified MD'}
        </p>

        <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>{doctor.experienceYears} years experience</span>
          </li>
          <li className="flex items-center gap-2 min-w-0" title={`${doctor.clinicName}, ${doctor.city}`}>
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              {doctor.clinicName}, {doctor.city}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">{workingDaysLabel(doctor.availableDays)}</span>
          </li>
        </ul>

        {/* Price and actions */}
        <div className="mt-auto pt-4">
          <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Consultation fee</span>
            <span className="text-lg font-black text-slate-900">₹{doctor.consultationFee}</span>
          </div>
          <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
            <Link
              to={`/doctors/${doctor.id}`}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => onBookClick?.(doctor)}
              className="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span>Book Visit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
