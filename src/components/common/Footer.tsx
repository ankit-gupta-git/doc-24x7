import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Phone, Mail, MapPin } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="print:hidden bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="group inline-block" aria-label="Doctor 24x7 home">
              <BrandLogo tone="dark" size="lg" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Doctor 24x7 connects patients with verified top-tier medical specialists and world-class clinics.
              Book trusted in-person appointments with live, verified availability.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Verified doctors · Live availability
              </span>
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">
              Specialties
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/doctors?specialty=cardiology" className="hover:text-brand-400 transition-colors">
                  Cardiology
                </Link>
              </li>
              <li>
                <Link to="/doctors?specialty=dermatology" className="hover:text-brand-400 transition-colors">
                  Dermatology
                </Link>
              </li>
              <li>
                <Link to="/doctors?specialty=pediatrics" className="hover:text-brand-400 transition-colors">
                  Pediatrics
                </Link>
              </li>
              <li>
                <Link to="/doctors?specialty=orthopedics" className="hover:text-brand-400 transition-colors">
                  Orthopedics
                </Link>
              </li>
              <li>
                <Link to="/doctors?specialty=neurology" className="hover:text-brand-400 transition-colors">
                  Neurology
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="text-brand-400 font-medium hover:underline">
                  All 10 Specialties →
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/doctors" className="hover:text-brand-400 transition-colors">
                  Find Doctors
                </Link>
              </li>
              <li>
                <Link to="/clinics" className="hover:text-brand-400 transition-colors">
                  Browse Clinics
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-brand-400 transition-colors">
                  Advanced Search
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-400 transition-colors">
                  Join as Doctor
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency & Support */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">
              Care Support
            </h3>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Partner clinics across India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+91 90000 24724 (24×7)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>support@doctor24x7.in</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs leading-relaxed">
                <strong className="block text-rose-200 mb-0.5">Medical Emergency?</strong>
                If you are experiencing a medical emergency, call 112 or 108 (ambulance) immediately.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {CURRENT_YEAR} Doctor 24x7. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Verified Healthcare Discovery
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              Patient-First Care
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
