import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, Stethoscope, ChevronRight, Phone } from 'lucide-react';
import { Clinic } from '../../types';
import { CLINIC_PLACEHOLDER_IMAGE } from './format';

interface ClinicCardProps {
  clinic: Clinic;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Cover Image */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <img
            src={clinic.imageUrl || CLINIC_PLACEHOLDER_IMAGE}
            alt={clinic.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = CLINIC_PLACEHOLDER_IMAGE;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-amber-800 border border-amber-200/60 shadow-xs flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{clinic.rating}</span>
            <span className="text-slate-400 font-normal">({clinic.reviewCount})</span>
          </div>
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md">
            {clinic.establishedYear ? `Est. ${clinic.establishedYear}` : clinic.city}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <Link
            to={`/clinics/${clinic.id}`}
            className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors block leading-tight truncate"
          >
            {clinic.name}
          </Link>

          <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{clinic.address}, {clinic.city}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{clinic.openHours}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{clinic.phone}</span>
          </div>

          {/* Services tags */}
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {clinic.services.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600"
              >
                {service}
              </span>
            ))}
            {clinic.services.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-400">
                +{clinic.services.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <Stethoscope className="w-3.5 h-3.5 text-brand-500" />
          <span>{clinic.doctorCount} Verified {clinic.doctorCount === 1 ? 'Doctor' : 'Doctors'}</span>
        </div>

        <Link
          to={`/clinics/${clinic.id}`}
          className="text-xs font-semibold text-slate-700 hover:text-brand-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Clinic</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
