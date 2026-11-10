import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { ApiError } from '../api/client';
import { useClinic, useClinicDoctors } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { DoctorCard } from '../components/common/DoctorCard';
import { BookingModal } from '../components/booking/BookingModal';
import { Doctor } from '../types';
import { CLINIC_PLACEHOLDER_IMAGE } from '../components/common/format';

export const ClinicDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const clinicQuery = useClinic(id);
  const clinic = clinicQuery.data;
  const doctorsQuery = useClinicDoctors(id);
  const doctors = doctorsQuery.data ?? [];

  if (clinicQuery.isLoading) return <LoadingState label="Loading clinic…" className="min-h-[60vh]" />;

  if (clinicQuery.isError && !(clinicQuery.error instanceof ApiError && clinicQuery.error.status === 404)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <ErrorState error={clinicQuery.error} onRetry={() => void clinicQuery.refetch()} />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Clinic Not Found</h2>
        <p className="text-sm text-slate-500">The requested healthcare facility does not exist or has been removed.</p>
        <Link
          to="/clinics"
          className="inline-block py-2.5 px-6 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-md"
        >
          View All Clinics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to="/clinics"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clinics Directory</span>
      </Link>

      {/* Main Clinic Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-100">
          <img
            src={clinic.imageUrl || CLINIC_PLACEHOLDER_IMAGE}
            alt={clinic.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = CLINIC_PLACEHOLDER_IMAGE;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-brand-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Accredited Facility
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                  {clinic.establishedYear ? `Established ${clinic.establishedYear}` : clinic.city}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black">{clinic.name}</h1>
              <p className="text-sm text-slate-200 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{clinic.address}, {clinic.city}</span>
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-slate-900 shrink-0 flex items-center gap-2 border border-white/40 shadow-lg">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <div>
                <span className="font-extrabold text-base leading-none block">{clinic.rating}</span>
                <span className="text-[10px] text-slate-500 font-medium">({clinic.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinic Info Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-sm">Operating Hours</span>
              <span className="text-slate-600 mt-0.5 block">{clinic.openHours}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-sm">Direct Reception</span>
              <span className="text-slate-600 mt-0.5 block">{clinic.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-sm">Clinic Inquiries</span>
              <span className="text-slate-600 mt-0.5 block">{clinic.email}</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="p-6 sm:p-8 border-t border-slate-100 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-500">
            Available Facility Diagnostic & Clinical Services
          </h3>
          <div className="flex flex-wrap gap-2">
            {clinic.services.map((svc, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{svc}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Associated Doctors */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Doctors Practicing at {clinic.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Book verified in-person consultation slots directly with practitioners at this clinic.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            {clinic.doctorCount} Doctors Available
          </span>
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
            No doctors are currently listed for this clinic.
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
