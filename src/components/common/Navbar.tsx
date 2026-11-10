import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Calendar,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { roleHome, useAuth } from '../../context/auth';
import { avatarFor } from './format';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardPath = () => roleHome(role);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="print:hidden sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="group" aria-label="Doctor 24x7 home">
            <BrandLogo />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/doctors"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/doctors')
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Find Doctors
            </Link>
            <Link
              to="/specialties"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/specialties')
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Specialties
            </Link>
            <Link
              to="/clinics"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/clinics')
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Clinics
            </Link>
          </nav>

          {/* Right Action Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* If Authenticated */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors flex items-center gap-1.5 border border-brand-200"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Profile menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <img
                      src={user.avatarUrl || avatarFor(user.name, 150)}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                    />
                  </button>

                  {profileDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-600 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                          {role} role
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Calendar className="w-4 h-4 text-slate-600" />
                          <span>My Dashboard</span>
                        </Link>
                        {role === 'patient' && (
                          <>
                            <Link
                              to="/patient/appointments"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Calendar className="w-4 h-4 text-slate-600" />
                              <span>My Appointments</span>
                            </Link>
                          </>
                        )}
                        {role === 'doctor' && (
                          <>
                            <Link
                              to="/doctor/appointments"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Stethoscope className="w-4 h-4 text-slate-600" />
                              <span>Doctor Appointments</span>
                            </Link>
                            <Link
                              to="/doctor/availability"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Calendar className="w-4 h-4 text-slate-600" />
                              <span>Manage Schedule</span>
                            </Link>
                          </>
                        )}
                        {role === 'admin' && (
                          <>
                            <Link
                              to="/admin/doctors"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Stethoscope className="w-4 h-4 text-slate-600" />
                              <span>Doctor Directory</span>
                            </Link>
                            <Link
                              to="/admin/appointments"
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Calendar className="w-4 h-4 text-slate-600" />
                              <span>Appointments</span>
                            </Link>
                          </>
                        )}
                        <Link
                          to="/patient/profile"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <UserIcon className="w-4 h-4 text-slate-600" />
                          <span>Account Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => void handleSignOut()}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all hover:shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            <Link
              to="/doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              Find Doctors
            </Link>
            <Link
              to="/specialties"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              Specialties
            </Link>
            <Link
              to="/clinics"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              Clinics
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-600" />
              <span>Search Database</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2">
                  <img
                    src={user.avatarUrl || avatarFor(user.name, 150)}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-600 capitalize">{role} Account</div>
                  </div>
                </div>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-sm font-semibold text-white bg-brand-600 rounded-lg"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => void handleSignOut()}
                  className="block w-full py-2 text-center text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-sm font-semibold text-white bg-brand-600 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
