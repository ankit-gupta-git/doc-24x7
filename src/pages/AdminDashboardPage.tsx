import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Calendar,
  Building,
  Activity,
  ShieldAlert,
} from 'lucide-react';

import { useAdminStats, useAppointments } from '../api/hooks';
import { EmptyState, ErrorState, LoadingState } from '../components/portal/PortalUI';
import { formatDateKey, money } from '../components/portal/format';

export const AdminDashboardPage: React.FC = () => {
  const statsQuery = useAdminStats();
  const recent = useAppointments({ pageSize: 5 });

  if (statsQuery.isPending) return <LoadingState label="Loading platform statistics…" />;
  if (statsQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <ErrorState error={statsQuery.error} onRetry={() => void statsQuery.refetch()} title="Couldn’t load platform statistics" />
      </div>
    );
  }
  const stats = statsQuery.data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Platform Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Platform Control Center</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Platform statistics and management for doctors, patients, clinics and bookings.
          </p>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/doctors"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
          >
            Manage Doctors
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/appointments"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
          >
            Appointments
          </Link>
        </div>
      </div>

      {/* Real Platform Calculated Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Doctors
          </span>
          <div className="text-2xl font-black text-brand-600 mt-1">
            {stats.totalDoctors}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {stats.activeDoctors} active
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Patients
          </span>
          <div className="text-2xl font-black text-teal-600 mt-1">
            {stats.totalPatients}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Registered patient accounts
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Platform Bookings
          </span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {stats.totalAppointments}
          </div>
          <span className="text-[11px] text-brand-600 font-semibold mt-1 block">
            {stats.upcomingAppointments} Upcoming Visits
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Completed Visit Revenue
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {money(stats.completedRevenue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Fees of {stats.completedAppointments} completed visits
          </span>
        </div>
      </div>

      {stats.pendingDoctors > 0 && (
        <Link
          to="/admin/doctors?status=unverified"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-3 hover:bg-amber-100 transition-colors"
        >
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-xs flex-1">
            <strong className="text-sm">
              {stats.pendingDoctors} doctor{stats.pendingDoctors === 1 ? '' : 's'} awaiting verification.
            </strong>{' '}
            They are hidden from patients until verified.
          </span>
          <span className="text-xs font-bold">Review →</span>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft text-center">
          <div className="text-xl font-black text-emerald-600">{stats.upcomingAppointments}</div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Upcoming</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft text-center">
          <div className="text-xl font-black text-blue-600">{stats.completedAppointments}</div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft text-center">
          <div className="text-xl font-black text-rose-600">{stats.cancelledAppointments}</div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Cancelled</span>
        </div>
      </div>

      {/* Admin Modules Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link
          to="/admin/doctors"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-card hover:border-brand-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600">Doctors Directory</h3>
          <p className="text-[11px] text-slate-500 mt-1">Verify, edit, or deactivate doctor profiles.</p>
        </Link>

        <Link
          to="/admin/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-card hover:border-teal-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-600">Users & Patients</h3>
          <p className="text-[11px] text-slate-500 mt-1">Manage accounts, toggle roles and active status.</p>
        </Link>

        <Link
          to="/admin/appointments"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-card hover:border-purple-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600">Appointments</h3>
          <p className="text-[11px] text-slate-500 mt-1">Monitor bookings, resolve disputes, status oversight.</p>
        </Link>

        <Link
          to="/admin/specialties"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-card hover:border-amber-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600">Specialties ({stats.totalSpecialties})</h3>
          <p className="text-[11px] text-slate-500 mt-1">Add, edit, or delete medical specialties.</p>
        </Link>

        <Link
          to="/admin/clinics"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-card hover:border-emerald-300 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600">Clinics ({stats.totalClinics})</h3>
          <p className="text-[11px] text-slate-500 mt-1">Add, edit, or remove healthcare facilities.</p>
        </Link>
      </div>

      {/* Recent Platform Appointments Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Platform Bookings</h2>
            <p className="text-xs text-slate-500">Latest consultations across all clinics.</p>
          </div>
          <Link
            to="/admin/appointments"
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            View All {stats.totalAppointments} Bookings →
          </Link>
        </div>

        {recent.isPending ? (
          <LoadingState label="Loading bookings…" />
        ) : recent.isError ? (
          <ErrorState error={recent.error} onRetry={() => void recent.refetch()} title="Couldn’t load bookings" />
        ) : recent.data.items.length === 0 ? (
          <EmptyState title="No bookings yet" message="Appointments booked by patients will show up here." />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-2.5">Ref</th>
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Doctor</th>
                <th className="px-4 py-2.5">Specialty</th>
                <th className="px-4 py-2.5">Date & Time</th>
                <th className="px-4 py-2.5">Fee</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recent.data.items.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-brand-700">{apt.bookingRef}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{apt.patientName}</td>
                  <td className="px-4 py-3">{apt.doctorName}</td>
                  <td className="px-4 py-3 text-slate-500">{apt.doctorSpecialty}</td>
                  <td className="px-4 py-3">{formatDateKey(apt.appointmentDate)} ({apt.timeSlot})</td>
                  <td className="px-4 py-3 font-bold">₹{apt.consultationFee}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        apt.status === 'upcoming'
                          ? 'bg-emerald-50 text-emerald-700'
                          : apt.status === 'completed'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};
