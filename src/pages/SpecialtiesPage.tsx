import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSpecialties } from '../api/hooks';
import { CardSkeletonGrid, ErrorState } from '../components/common/QueryState';
import { SpecialtyCard } from '../components/common/SpecialtyCard';

export const SpecialtiesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const specialtiesQuery = useSpecialties();
  const specialties = specialtiesQuery.data ?? [];

  const filteredSpecialties = specialties.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 inline-block">
          Medical Specialties Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Explore Healthcare by Specialty
        </h1>
        <p className="text-sm text-slate-500">
          From preventive cardiology and dermatology to pediatric care and neuro-diagnostics, find the right expert for your exact medical needs.
        </p>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto pt-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-7" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search specialties (e.g. Cardiology, Skin, Eyes)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200 bg-white shadow-xs focus:outline-hidden focus:border-brand-500"
          />
        </div>
      </div>

      {specialtiesQuery.isLoading && <CardSkeletonGrid count={8} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4" height="h-48" />}
      {specialtiesQuery.isError && <ErrorState error={specialtiesQuery.error} onRetry={() => void specialtiesQuery.refetch()} />}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {filteredSpecialties.map((spec) => (
          <SpecialtyCard key={spec.id} specialty={spec} />
        ))}
      </div>

      {specialtiesQuery.isSuccess && filteredSpecialties.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          {searchTerm ? `No specialties matched "${searchTerm}". Try a different term or clear the filter.` : 'No specialties have been added yet.'}
        </div>
      )}
    </div>
  );
};
