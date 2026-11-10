import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Stethoscope, Building, Activity } from 'lucide-react';
import { useSearch } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { DoctorCard } from '../components/common/DoctorCard';
import { SpecialtyCard } from '../components/common/SpecialtyCard';
import { ClinicCard } from '../components/common/ClinicCard';
import { BookingModal } from '../components/booking/BookingModal';
import { Doctor } from '../types';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'doctors' | 'specialties' | 'clinics'>('all');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  // The submitted query lives in the URL (?q=); typing only updates the input.
  const submittedQuery = (searchParams.get('q') || '').trim();
  const [lastSubmitted, setLastSubmitted] = useState(submittedQuery);
  if (lastSubmitted !== submittedQuery) {
    setLastSubmitted(submittedQuery);
    setSearchTerm(submittedQuery);
  }

  const searchQuery = useSearch(submittedQuery);
  const matchedDoctors = searchQuery.data?.doctors ?? [];
  const matchedSpecialties = searchQuery.data?.specialties ?? [];
  const matchedClinics = searchQuery.data?.clinics ?? [];
  const tooShort = submittedQuery.length < 2;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm.trim() });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header and Search Form */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Universal Search Results
        </h1>

        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctors, medical specialties, or accredited clinics..."
            className="w-full pl-12 pr-28 py-3 text-sm rounded-2xl border border-slate-200 bg-white shadow-card focus:outline-hidden focus:border-brand-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Results ({matchedDoctors.length + matchedSpecialties.length + matchedClinics.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('doctors')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'doctors'
              ? 'bg-brand-600 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Doctors ({matchedDoctors.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('specialties')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'specialties'
              ? 'bg-brand-600 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Specialties ({matchedSpecialties.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clinics')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'clinics'
              ? 'bg-brand-600 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clinics ({matchedClinics.length})
        </button>
      </div>

      {/* Doctors Section */}
      {(activeTab === 'all' || activeTab === 'doctors') && matchedDoctors.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-brand-600" />
              <span>Matching Doctors ({matchedDoctors.length})</span>
            </h2>
            <Link to="/doctors" className="text-xs font-semibold text-brand-600 hover:underline">
              Filter with sorting →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {matchedDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onBookClick={(doctor) => setSelectedDoctorForBooking(doctor)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Specialties Section */}
      {(activeTab === 'all' || activeTab === 'specialties') && matchedSpecialties.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>Medical Specialties ({matchedSpecialties.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {matchedSpecialties.map((spec) => (
              <SpecialtyCard key={spec.id} specialty={spec} />
            ))}
          </div>
        </div>
      )}

      {/* Clinics Section */}
      {(activeTab === 'all' || activeTab === 'clinics') && matchedClinics.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              <span>Matching Clinics ({matchedClinics.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchedClinics.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        </div>
      )}

      {tooShort && (
        <div className="text-center py-16 text-slate-500 text-sm">Type at least 2 characters and press Enter to search doctors, specialties and clinics.</div>
      )}
      {!tooShort && searchQuery.isLoading && <LoadingState label="Searching…" />}
      {!tooShort && searchQuery.isError && <ErrorState error={searchQuery.error} onRetry={() => void searchQuery.refetch()} />}

      {/* Empty State */}
      {!tooShort && searchQuery.isSuccess && matchedDoctors.length === 0 && matchedSpecialties.length === 0 && matchedClinics.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm space-y-2">
          <p>No results found matching "{submittedQuery}".</p>
          <Link to="/doctors" className="text-brand-600 font-bold hover:underline inline-block">
            View All Doctors
          </Link>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={!!selectedDoctorForBooking}
        onClose={() => setSelectedDoctorForBooking(null)}
      />
    </div>
  );
};
