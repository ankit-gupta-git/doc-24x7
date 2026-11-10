import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle2 } from 'lucide-react';
import { ApiError } from '../api/client';
import { useDoctors, useSpecialty } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { SpecialtyIcon } from '../components/common/IconHelper';
import { DoctorCard } from '../components/common/DoctorCard';
import { BookingModal } from '../components/booking/BookingModal';
import { Doctor } from '../types';

export const SpecialtyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const specialtyQuery = useSpecialty(slug);
  const specialty = specialtyQuery.data;
  const doctorsQuery = useDoctors({ specialty: slug, sortBy: 'recommended', pageSize: 100 });
  const doctors = doctorsQuery.data?.items ?? [];

  if (specialtyQuery.isLoading) return <LoadingState label="Loading specialty…" className="min-h-[60vh]" />;

  if (specialtyQuery.isError && !(specialtyQuery.error instanceof ApiError && specialtyQuery.error.status === 404)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <ErrorState error={specialtyQuery.error} onRetry={() => void specialtyQuery.refetch()} />
      </div>
    );
  }

  if (!specialty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Specialty Not Found</h2>
        <p className="text-sm text-slate-500">The requested medical specialty does not exist in our directory.</p>
        <Link
          to="/specialties"
          className="inline-block py-2.5 px-6 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-md"
        >
          View All Specialties
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/specialties"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Specialties</span>
      </Link>

      {/* Specialty Banner Card */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-teal-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md">
            <SpecialtyIcon name={specialty.iconName} className="w-7 h-7" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{specialty.name}</h1>
          <p className="text-brand-100 text-sm sm:text-base leading-relaxed">
            {specialty.description}
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs font-medium text-brand-100">
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
              <Users className="w-4 h-4" />
              {specialty.doctorCount} Board-Certified Specialists
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Verified In-Person Consultations
            </span>
          </div>
        </div>
      </div>

      {/* Doctors in this specialty */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Doctors Specializing in {specialty.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a specialist below to view details and book an appointment.
            </p>
          </div>
          <Link
            to={`/doctors?specialty=${specialty.slug}`}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Filter by city or fee →
          </Link>
        </div>

        {doctorsQuery.isLoading ? (
          <LoadingState label="Loading doctors…" />
        ) : doctorsQuery.isError ? (
          <ErrorState error={doctorsQuery.error} onRetry={() => void doctorsQuery.refetch()} />
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onBookClick={(doctor) => setSelectedDoctorForBooking(doctor)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No doctors are currently available in this specialty.
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={!!selectedDoctorForBooking}
        onClose={() => setSelectedDoctorForBooking(null)}
      />
    </div>
  );
};
