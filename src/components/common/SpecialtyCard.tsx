import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { Specialty } from '../../types';
import { SpecialtyIcon } from './IconHelper';
import { SPECIALTY_COLORS } from './specialtyColors';

interface SpecialtyCardProps {
  specialty: Specialty;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ specialty }) => {
  const theme = SPECIALTY_COLORS[specialty.slug] || {
    bg: 'bg-brand-50',
    text: 'text-brand-600',
    border: 'border-brand-100',
    hoverBorder: 'hover:border-brand-300',
  };

  return (
    <Link
      to={`/specialties/${specialty.slug}`}
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft hover:shadow-card hover:-translate-y-1 ${theme.hoverBorder} transition-all duration-300 flex flex-col justify-between group`}
    >
      <div>
        <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs mb-4`}>
          <SpecialtyIcon name={specialty.iconName} className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
          {specialty.name}
        </h3>

        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {specialty.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-semibold text-slate-600">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {specialty.doctorCount} Doctors
        </span>
        <span className="text-brand-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
          Consult <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
};
