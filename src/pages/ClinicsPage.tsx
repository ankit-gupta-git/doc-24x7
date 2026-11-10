import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useClinics } from '../api/hooks';
import { CardSkeletonGrid, ErrorState } from '../components/common/QueryState';
import { ClinicCard } from '../components/common/ClinicCard';

export const ClinicsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const clinicsQuery = useClinics();
  const clinics = clinicsQuery.data ?? [];
  const cities = [...new Set(clinics.map((c) => c.city))].sort();

  const filteredClinics = clinics.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.services.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCity === 'all' || c.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesQuery && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 inline-block">
          Network of Accredited Facilities
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Partner Clinics & Health Centers
        </h1>
        <p className="text-sm text-slate-500">
          World-class outpatient clinics equipped with top diagnostic technologies, digital imaging, and patient amenities.
        </p>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clinic name or service..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-brand-500 shadow-2xs"
            />
          </div>

          <div className="relative sm:w-48">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-brand-500 shadow-2xs text-slate-700"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {clinicsQuery.isLoading && <CardSkeletonGrid count={6} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4" height="h-96" />}
      {clinicsQuery.isError && <ErrorState error={clinicsQuery.error} onRetry={() => void clinicsQuery.refetch()} />}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredClinics.map((clinic) => (
          <ClinicCard key={clinic.id} clinic={clinic} />
        ))}
      </div>

      {clinicsQuery.isSuccess && filteredClinics.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No clinics found matching your search. Try resetting the filters.
        </div>
      )}
    </div>
  );
};
