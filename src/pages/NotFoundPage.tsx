import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center border border-brand-200 shadow-md">
          <Activity className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-brand-600 font-extrabold text-sm uppercase tracking-widest block">
            404 Error
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The healthcare discovery page or appointment link you were looking for doesn't exist or has moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/"
            className="py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            to="/doctors"
            className="py-3 px-6 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Find Doctors</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
