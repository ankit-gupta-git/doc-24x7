import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  Building,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  LogIn,
  Video,
} from 'lucide-react';
import { Doctor, Appointment, ConsultationMode } from '../../types';
import { ApiError, errorMessage } from '../../api/client';
import { useBookAppointment } from '../../api/hooks';
import { useAuth } from '../../context/auth';
import { SlotPicker } from './SlotPicker';
import { avatarFor, formatDateKey } from '../common/format';

interface BookingModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (appointment: Appointment) => void;
  initialDate?: string;
  initialSlot?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BookingModal: React.FC<BookingModalProps> = (props) => {
  if (!props.isOpen || !props.doctor) return null;
  // Keyed by doctor so the form resets when a different doctor is opened.
  return <BookingModalContent key={props.doctor.id} {...props} doctor={props.doctor} />;
};

const BookingModalContent: React.FC<BookingModalProps & { doctor: Doctor }> = ({
  doctor,
  onClose,
  onBookingSuccess,
  initialDate,
  initialSlot,
}) => {
  const { user, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const book = useBookAppointment();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Date & Time, 2: Patient Info, 3: Review, 4: Success
  const [selectedDate, setSelectedDate] = useState<string>(initialDate ?? '');
  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot ?? '');
  const [mode, setMode] = useState<ConsultationMode>('in_person');
  const online = mode === 'online';
  const [patientName, setPatientName] = useState<string>(user?.name ?? '');
  const [patientEmail, setPatientEmail] = useState<string>(user?.email ?? '');
  const [patientPhone, setPatientPhone] = useState<string>(user?.phone ?? '');
  const [reason, setReason] = useState<string>('General consultation and checkup');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  const isPatient = role === 'patient';

  const handleStep1Next = () => {
    if (!selectedDate) return setErrorMsg('Please select an appointment date.');
    if (!selectedSlot) return setErrorMsg('Please select a time slot.');
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!patientName.trim()) return setErrorMsg('Please enter the patient’s full name.');
    if (!EMAIL_RE.test(patientEmail.trim())) return setErrorMsg('Please enter a valid email address.');
    if (patientPhone.replace(/\D/g, '').length < 7) return setErrorMsg('Please provide a contact phone number.');
    if (reason.trim().length < 5) return setErrorMsg('Please describe the reason for the visit (at least 5 characters).');
    setErrorMsg(null);
    setStep(3);
  };

  const handleConfirmBooking = async () => {
    setErrorMsg(null);
    try {
      const appointment = await book.mutateAsync({
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: patientPhone.trim(),
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        consultationMode: mode,
      });
      setConfirmedBooking(appointment);
      setStep(4);
      onBookingSuccess?.(appointment);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#0284c7', '#0d9488', '#f59e0b', '#10b981'] });
      } catch {
        // Confetti is decorative only.
      }
    } catch (err) {
      setErrorMsg(errorMessage(err, 'We couldn’t complete the booking. Please try again.'));
      // Slot taken (409) or no longer bookable (422): back to the refreshed slot grid.
      if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        setSelectedSlot('');
        setStep(1);
      }
    }
  };

  const loginState = { from: location };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-brand-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={doctor.profileImageUrl || avatarFor(doctor.name)}
              alt={doctor.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = avatarFor(doctor.name);
              }}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/80 shadow-md"
            />
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Book Visit with {doctor.name}</h2>
              <p className="text-xs text-brand-100">
                {doctor.specialty} • {doctor.clinicName}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Indicators */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-500">
          {(['Date & Slot', 'Patient Info', 'Review'] as const).map((label, i) => (
            <React.Fragment key={label}>
              <span className={`flex items-center gap-1.5 ${step >= i + 1 ? 'text-brand-600' : ''}`}>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                    step >= i + 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {i + 1}
                </span>
                {label}
              </span>
              <span className="text-slate-300">──</span>
            </React.Fragment>
          ))}
          <span className={`flex items-center gap-1.5 ${step === 4 ? 'text-emerald-600' : ''}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              ✓
            </span>
            Confirmed
          </span>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: DATE & TIME SLOT SELECTION */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            {doctor.offersOnlineConsultation && (
              <fieldset>
                <legend className="text-xs font-bold text-slate-700 mb-2">How would you like to consult?</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { value: 'in_person', label: 'Clinic visit', hint: doctor.clinicName, Icon: Building },
                      { value: 'online', label: 'Video consultation', hint: 'Join from home on any device', Icon: Video },
                    ] as const
                  ).map(({ value, label, hint, Icon }) => (
                    <label
                      key={value}
                      className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                        mode === value ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input type="radio" name="consultation-mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="sr-only" />
                      <Icon className={`w-5 h-5 shrink-0 ${mode === value ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span>
                        <span className="block text-sm font-bold text-slate-900">{label}</span>
                        <span className="block text-[11px] text-slate-500">{hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <SlotPicker
              doctorId={doctor.id}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onSelectDate={setSelectedDate}
              onSelectSlot={(slot) => {
                setSelectedSlot(slot);
                if (slot) setErrorMsg(null);
              }}
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-600 block">Consultation Fee</span>
                <span className="text-lg font-bold text-slate-900">₹{doctor.consultationFee}</span>
              </div>
              <button
                type="button"
                onClick={handleStep1Next}
                disabled={!selectedSlot}
                className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold shadow-md flex items-center gap-2"
              >
                <span>Continue to Patient Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PATIENT DETAILS (or sign-in gate) */}
        {step === 2 && !isAuthenticated && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
              <LogIn className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sign in to book</h3>
              <p className="text-sm text-slate-600 mt-1">
                Your {selectedSlot} slot on {formatDateKey(selectedDate)} isn’t reserved until you confirm. Sign in or create a free patient account to
                continue.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                state={loginState}
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md"
              >
                Sign in to book
              </Link>
              <Link
                to="/register"
                state={loginState}
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
              >
                Create an account
              </Link>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              Back to Date & Slot
            </button>
          </div>
        )}

        {step === 2 && isAuthenticated && !isPatient && (
          <div className="p-6 space-y-4 text-center">
            <p className="text-sm text-slate-700">
              Appointments can only be booked from a <strong>patient</strong> account. You’re signed in as a {role}.
            </p>
            <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              Back to Date & Slot
            </button>
          </div>
        )}

        {step === 2 && isAuthenticated && isPatient && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bk-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="bk-name"
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    autoComplete="name"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bk-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="bk-email"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bk-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="bk-phone"
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bk-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Reason for Visit *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="bk-reason"
                    type="text"
                    value={reason}
                    maxLength={500}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Health checkup, symptom review"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="bk-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Notes / Past Medical History (Optional)
              </label>
              <textarea
                id="bk-notes"
                value={notes}
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any existing allergies or current medications..."
                rows={2}
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Back to Date & Slot
              </button>
              <button
                type="button"
                onClick={handleStep2Next}
                className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md flex items-center gap-2"
              >
                <span>Review Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Appointment Summary</h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-600 block">Doctor & Specialty</span>
                  <span className="font-bold text-slate-900">{doctor.name}</span>
                  <span className="text-xs text-brand-600 block">{doctor.specialty}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 block">Date & Time</span>
                  <span className="font-bold text-slate-900">{formatDateKey(selectedDate)}</span>
                  <span className="text-xs text-emerald-700 font-semibold block">{selectedSlot} (clinic time)</span>
                </div>
                {online ? (
                  <div>
                    <span className="text-xs text-slate-600 block">Consultation</span>
                    <span className="font-bold text-slate-900">Online video call</span>
                    <span className="text-xs text-slate-600 block">Join from My Appointments shortly before the start</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-slate-600 block">Clinic Location</span>
                    <span className="font-bold text-slate-900">{doctor.clinicName}</span>
                    <span className="text-xs text-slate-600 block">{doctor.clinicAddress}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-600 block">Patient Name</span>
                  <span className="font-bold text-slate-900">{patientName}</span>
                  <span className="text-xs text-slate-600 block">{patientPhone}</span>
                </div>
              </div>
            </div>

            {online ? (
              <div className="p-3 rounded-xl border border-slate-200 flex items-start gap-3">
                <Video className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Video consultation</div>
                  <div className="text-[11px] text-slate-500">
                    You’ll need a camera, a microphone and a private, quiet place. The fee is settled with {doctor.clinicName}; no payment is taken online.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-slate-200 flex items-start gap-3">
                <Building className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Pay the clinic at your visit</div>
                  <div className="text-[11px] text-slate-500">No payment is taken online. Settle the consultation fee at reception when you arrive.</div>
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Your slot is reserved the moment you confirm
              </span>
              <span className="text-sm font-bold text-emerald-900">Fee: ₹{doctor.consultationFee}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button type="button" onClick={() => setStep(2)} className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Back
              </button>
              <button
                type="button"
                disabled={book.isPending}
                onClick={() => void handleConfirmBooking()}
                className="py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                {book.isPending ? (
                  <span>Reserving Slot...</span>
                ) : (
                  <>
                    <span>Confirm & Book Appointment</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && confirmedBooking && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Booking Confirmed</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">You're All Set!</h3>
              <p className="text-xs text-slate-500 mt-1">Your consultation has been scheduled with {doctor.name}.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">Booking Reference</span>
                <span className="text-base font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                  {confirmedBooking.bookingRef}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">Date & Slot</span>
                <span className="font-semibold text-slate-800">
                  {formatDateKey(confirmedBooking.appointmentDate)} at {confirmedBooking.timeSlot}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">{confirmedBooking.consultationMode === 'online' ? 'Consultation' : 'Clinic'}</span>
                <span className="font-semibold text-slate-800">
                  {confirmedBooking.consultationMode === 'online' ? 'Online video call' : confirmedBooking.clinicName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold text-slate-800">₹{confirmedBooking.consultationFee} at the clinic</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/patient/appointments');
                }}
                className="py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md"
              >
                View My Appointments
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
