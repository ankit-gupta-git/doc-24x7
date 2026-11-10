import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowUpDown,
  RotateCcw,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCities, useDoctors, useSpecialties } from '../api/hooks';
import { CardSkeletonGrid, ErrorState } from '../components/common/QueryState';
import { DoctorCard } from '../components/common/DoctorCard';
import { BookingModal } from '../components/booking/BookingModal';
import { Doctor, DoctorQuery } from '../types';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State initialized from URL params if available
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get('minRating')) || 0);
  const [minExperience, setMinExperience] = useState<number>(Number(searchParams.get('minExp')) || 0);
  const [maxFee, setMaxFee] = useState<number>(Number(searchParams.get('maxFee')) || 1000);
  const [onlineOnly, setOnlineOnly] = useState(searchParams.get('online') === '1');
  const [sortBy, setSortBy] = useState<DoctorQuery['sortBy']>(
    (searchParams.get('sort') as DoctorQuery['sortBy']) || 'recommended'
  );
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
  // Debounce typing so the API isn't queried on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  const pageSize = 8;

  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);

  const specialtiesQuery = useSpecialties();
  const specialties = specialtiesQuery.data ?? [];
  const cities = useCities().data ?? [];

  // Keep query params synced with URL for shareable search links
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedSpecialty !== 'all') params.set('specialty', selectedSpecialty);
    if (selectedCity !== 'all') params.set('city', selectedCity);
    if (minRating > 0) params.set('minRating', minRating.toString());
    if (minExperience > 0) params.set('minExp', minExperience.toString());
    if (maxFee < 1000) params.set('maxFee', maxFee.toString());
    if (onlineOnly) params.set('online', '1');
    if (sortBy !== 'recommended') params.set('sort', sortBy || 'recommended');
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedSpecialty, selectedCity, minRating, minExperience, maxFee, onlineOnly, sortBy, currentPage, setSearchParams]);

  // Any filter change goes back to page 1 (adjusted during render, not in an effect,
  // so a `?page=` in a shared link survives the first render).
  const filterKey = JSON.stringify([debouncedSearch, selectedSpecialty, selectedCity, minRating, minExperience, maxFee, onlineOnly, sortBy]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  // Filtering, sorting and pagination all happen on the server.
  const doctorsQuery = useDoctors({
    search: debouncedSearch || undefined,
    specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    minExperience: minExperience > 0 ? minExperience : undefined,
    maxFee: maxFee < 1000 ? maxFee : undefined,
    online: onlineOnly || undefined,
    sortBy,
    page: currentPage,
    pageSize,
  });
  const paginatedDoctors = doctorsQuery.data?.items ?? [];
  const totalResults = doctorsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const selectedSpecialtyName = specialties.find((sp) => sp.slug === selectedSpecialty)?.name ?? selectedSpecialty;

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('all');
    setSelectedCity('all');
    setMinRating(0);
    setMinExperience(0);
    setMaxFee(1000);
    setOnlineOnly(false);
    setSortBy('recommended');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSpecialty !== 'all' ||
    selectedCity !== 'all' ||
    minRating > 0 ||
    minExperience > 0 ||
    maxFee < 1000 ||
    onlineOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 mb-1">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Doctor Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Find & Book Verified Doctors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified specialists with transparent fees and live slot availability.
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <ArrowUpDown className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-600">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as DoctorQuery['sortBy'])}
            className="text-xs font-bold bg-transparent text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value="recommended">Recommended & Ratings</option>
            <option value="rating">Highest Rated (★)</option>
            <option value="experience">Years of Experience</option>
            <option value="fee_asc">Consultation Fee: Low to High</option>
            <option value="fee_desc">Consultation Fee: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card space-y-4">
        {/* Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Query input */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor name or condition..."
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Specialty selector */}
          <div className="relative">
            <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors text-slate-700 cursor-pointer"
            >
              <option value="all">All Specialties ({specialties.length})</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name} ({s.doctorCount})
                </option>
              ))}
            </select>
          </div>

          {/* City selector */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors text-slate-700 cursor-pointer"
            >
              <option value="all">All Locations{cities.length ? ` (${cities.length} Cities)` : ''}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters: Rating, Experience, Max Fee */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Rating Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Min Rating:</span>
              {[0, 4.7, 4.8, 4.9].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setMinRating(rate)}
                  className={`px-3 py-1 rounded-xl border font-bold transition-all ${
                    minRating === rate
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {rate === 0 ? 'All' : `${rate}★+`}
                </button>
              ))}
            </div>

            {/* Experience Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Experience:</span>
              {[
                { label: 'Any', val: 0 },
                { label: '10+ yrs', val: 10 },
                { label: '15+ yrs', val: 15 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setMinExperience(item.val)}
                  className={`px-3 py-1 rounded-xl border font-bold transition-all ${
                    minExperience === item.val
                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Max Fee Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Max Fee:</span>
              <span className="font-black text-slate-900">{maxFee >= 1000 ? 'Any' : `₹${maxFee}`}</span>
              <input
                type="range"
                min="300"
                max="1000"
                step="50"
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                className="w-24 accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Online consultations */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="accent-teal-600 w-4 h-4" />
              <span className="text-slate-700 font-semibold">Video consult available</span>
            </label>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-rose-50 transition-colors border border-rose-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900 font-bold">{totalResults}</strong> verified doctors
          {selectedSpecialty !== 'all' && ` in ${selectedSpecialtyName}`}
          {selectedCity !== 'all' && ` in ${selectedCity}`}
        </span>
        <span className="font-semibold text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Doctors Grid */}
      {doctorsQuery.isLoading ? (
        <CardSkeletonGrid count={8} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" height="h-80" />
      ) : doctorsQuery.isError ? (
        <ErrorState error={doctorsQuery.error} onRetry={() => void doctorsQuery.refetch()} title="We couldn’t load doctors" />
      ) : paginatedDoctors.length > 0 ? (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity ${doctorsQuery.isFetching ? 'opacity-60' : ''}`}>
          {paginatedDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBookClick={(doctor) => setSelectedDoctorForBooking(doctor)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No matching doctors found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your specialty, city, fee slider, or clearing the search terms.
            </p>
          </div>
          <button
            onClick={resetAllFilters}
            className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                currentPage === i + 1
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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
