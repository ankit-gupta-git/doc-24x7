import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoadingState } from './components/common/QueryState';

// Public Pages
import { HomePage } from './pages/HomePage';
import { DoctorSearchPage } from './pages/DoctorSearchPage';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { SpecialtiesPage } from './pages/SpecialtiesPage';
import { SpecialtyDetailPage } from './pages/SpecialtyDetailPage';
import { ClinicsPage } from './pages/ClinicsPage';
import { ClinicDetailPage } from './pages/ClinicDetailPage';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Patient Pages
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { PatientAppointmentsPage } from './pages/PatientAppointmentsPage';

// Doctor Pages
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { DoctorAvailabilityPage } from './pages/DoctorAvailabilityPage';
import { DoctorAppointmentsPage } from './pages/DoctorAppointmentsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminDoctorsPage } from './pages/AdminDoctorsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAppointmentsPage } from './pages/AdminAppointmentsPage';
import { AdminSpecialtiesPage } from './pages/AdminSpecialtiesPage';
import { AdminClinicsPage } from './pages/AdminClinicsPage';

// Online consultation (patient or assigned doctor). Lazy so the video SDK only loads for calls.
const ConsultationPage = lazy(() => import('./pages/ConsultationPage').then((m) => ({ default: m.ConsultationPage })));
const PrescriptionPage = lazy(() => import('./pages/PrescriptionPage').then((m) => ({ default: m.PrescriptionPage })));

// Utility Pages
import { SearchResultsPage } from './pages/SearchResultsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* 1. Public Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/doctors" element={<DoctorSearchPage />} />
              <Route path="/doctors/:id" element={<DoctorProfilePage />} />
              <Route path="/specialties" element={<SpecialtiesPage />} />
              <Route path="/specialties/:slug" element={<SpecialtyDetailPage />} />
              <Route path="/clinics" element={<ClinicsPage />} />
              <Route path="/clinics/:id" element={<ClinicDetailPage />} />

              {/* 2. Authentication Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* 3. Patient Pages (Protected). Account settings are shared by every role. */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'admin', 'doctor']}>
                    <PatientProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* 4. Doctor Pages (Protected) */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <DoctorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/availability"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <DoctorAvailabilityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <DoctorAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Video consultation room. The API decides who may join; admins are refused there too. */}
              <Route
                path="/consultation/:id"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                    <Suspense fallback={<LoadingState label="Loading consultation…" />}>
                      <ConsultationPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Prescription of a visit (printable). The API decides who may see it. */}
              <Route
                path="/prescription/:id"
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
                    <Suspense fallback={<LoadingState label="Loading prescription…" />}>
                      <PrescriptionPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* 5. Admin Pages (Protected) */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDoctorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/appointments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/specialties"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSpecialtiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/clinics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminClinicsPage />
                  </ProtectedRoute>
                }
              />

              {/* 6. Utility Pages */}
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
