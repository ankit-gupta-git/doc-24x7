import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Star,
  MapPin,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Globe,
  Building,
  ShieldCheck,
  Phone,
  MessageSquare,
  ArrowRight,
  Send,
  Video,
} from 'lucide-react';
import { ApiError, errorMessage } from '../api/client';
import { useAddReview, useAvailability, useClinic, useDoctor, useDoctorReviews } from '../api/hooks';
import { BookingModal } from '../components/booking/BookingModal';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { useAuth } from '../context/auth';
import { CLINIC_PLACEHOLDER_IMAGE, avatarFor, formatDateKey } from '../components/common/format';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const location = useLocation();

  const doctorQuery = useDoctor(id);
  const doctor = doctorQuery.data;
  const clinicQuery = useClinic(doctor?.clinicId);
  const clinic = clinicQuery.data;
  const reviewsQuery = useDoctorReviews(doctor?.id);
  const reviews = reviewsQuery.data ?? [];
  const availabilityQuery = useAvailability(doctor?.id, { days: 7 });
  const addReview = useAddReview(id ?? '');

  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ date: string; slot: string } | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeDateTab, setActiveDateTab] = useState<string>('');

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  if (doctorQuery.isLoading) {
    return <LoadingState label="Loading doctor profile…" className="min-h-[60vh]" />;
  }

  if (doctorQuery.isError && !(doctorQuery.error instanceof ApiError && doctorQuery.error.status === 404)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <ErrorState error={doctorQuery.error} onRetry={() => void doctorQuery.refetch()} title="We couldn’t load this doctor" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Doctor Profile Not Found</h2>
        <p className="text-sm text-slate-500">This doctor isn’t listed on Doctor 24x7, or their profile is no longer public.</p>
        <Link to="/doctors" className="inline-block py-2.5 px-6 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-md">
          Return to Doctor Directory
        </Link>
      </div>
    );
  }

  const days = (availabilityQuery.data?.days ?? []).slice(0, 5);
  const activeDay = days.find((d) => d.date === activeDateTab) ?? days.find((d) => d.isWorkingDay) ?? days[0];
  const openSlots = activeDay?.slots.filter((s) => s.state === 'available').length ?? 0;

  const handleSlotClick = (slot: string) => {
    if (!activeDay) return;
    setSelectedSlotForBooking({ date: activeDay.date, slot });
    setBookingModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    const comment = reviewComment.trim();
    if (comment.length < 10) {
      setReviewError('Please write at least 10 characters about your visit.');
      return;
    }
    try {
      await addReview.mutateAsync({ rating: reviewRating, comment });
      setReviewComment('');
      setReviewSubmitted(true);
    } catch (err) {
      setReviewError(
        err instanceof ApiError && err.status === 409 ? 'You’ve already reviewed this doctor. Thank you for your feedback!' : errorMessage(err),
      );
    }
  };

  const fallbackAvatar = avatarFor(doctor.name, 300);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link to="/" className="hover:text-brand-600">
          Home
        </Link>
        <span>/</span>
        <Link to="/doctors" className="hover:text-brand-600">
          Doctors
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{doctor.name}</span>
      </nav>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          {/* Avatar */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <img
              src={doctor.profileImageUrl || fallbackAvatar}
              alt={doctor.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackAvatar;
              }}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover border-4 border-white shadow-lg ring-1 ring-slate-100"
            />
            {doctor.isVerified && (
              <span className="absolute bottom-1 right-1 bg-teal-500 text-white rounded-full p-1.5 shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-2.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">{doctor.specialty}</span>
              {doctor.isVerified && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Doctor
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                {doctor.experienceYears} Years Exp.
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{doctor.name}</h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">{doctor.qualifications.join(' • ')}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{doctor.rating.toFixed(1)}</span>
                <span className="text-amber-700 text-xs font-medium">({doctor.reviewCount} Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Speaks: {doctor.languages.join(', ')}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center md:justify-start gap-2 text-xs text-slate-600">
              <Building className="w-4 h-4 text-brand-500 shrink-0" />
              <span>
                Practicing at <strong className="text-slate-800">{doctor.clinicName}</strong> ({doctor.city})
              </span>
            </div>
          </div>

          {/* Pricing & Fast Book Card */}
          <div className="w-full md:w-64 bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center md:text-left space-y-3 shrink-0">
            <div>
              <span className="text-xs text-slate-500 font-medium">Consultation Fee</span>
              <div className="text-3xl font-black text-slate-900">₹{doctor.consultationFee}</div>
              <span className="text-[11px] text-emerald-700 font-medium block">✓ Paid at the clinic, no booking charges</span>
            </div>
            {doctor.offersOnlineConsultation && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-[11px] font-semibold">
                <Video className="w-4 h-4 shrink-0" />
                <span>Clinic visits and online video consultations</span>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedSlotForBooking(null);
                setBookingModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-slate-500 text-center">Live slots for the next 7 days</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {doctor.about && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-3">
              <h2 className="text-lg font-bold text-slate-900">About {doctor.name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{doctor.about}</p>
            </div>
          )}

          {doctor.services.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Specialized Medical Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctor.services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinic Details */}
          {clinic && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Clinic Location & Hours</h2>
                <Link to={`/clinics/${clinic.id}`} className="text-xs font-semibold text-brand-600 hover:underline">
                  View Full Clinic Profile →
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src={clinic.imageUrl || CLINIC_PLACEHOLDER_IMAGE}
                  alt={clinic.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = CLINIC_PLACEHOLDER_IMAGE;
                  }}
                  className="w-full sm:w-44 h-32 rounded-2xl object-cover border border-slate-100"
                />
                <div className="space-y-2 text-xs text-slate-600">
                  <h3 className="font-bold text-slate-900 text-base">{clinic.name}</h3>
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {clinic.address}, {clinic.city}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{clinic.openHours}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={`tel:${clinic.phone}`} className="hover:text-brand-600">
                      {clinic.phone}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Patient Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Patient Feedback & Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">Reviews marked “Verified visit” come from patients with a completed appointment.</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-black text-base border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{doctor.rating.toFixed(1)} / 5.0</span>
              </div>
            </div>

            <div className="space-y-4">
              {reviewsQuery.isLoading && <LoadingState label="Loading reviews…" className="py-6" />}
              {reviewsQuery.isError && <ErrorState error={reviewsQuery.error} onRetry={() => void reviewsQuery.refetch()} className="py-6" />}
              {reviewsQuery.isSuccess && reviews.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No written reviews yet.</p>}
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                        {rev.patientName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {rev.patientName}
                          {rev.verifiedVisit && (
                            <span className="ml-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Verified visit</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${rev.rating} out of 5 stars`}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>

            {/* Write a Review */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>Leave a Review for {doctor.name}</span>
              </h3>

              {!user ? (
                <p className="text-xs text-slate-600">
                  <Link to="/login" state={{ from: location }} className="font-semibold text-brand-600 hover:underline">
                    Sign in
                  </Link>{' '}
                  with your patient account to leave a review.
                </p>
              ) : role !== 'patient' ? (
                <p className="text-xs text-slate-500">Only patient accounts can leave reviews.</p>
              ) : reviewSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-center font-medium">
                  Thank you! Your review has been published.
                </div>
              ) : (
                <form onSubmit={(e) => void handleReviewSubmit(e)} className="space-y-3">
                  {reviewError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs" role="alert">
                      {reviewError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">Posting as</span>
                      <div className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                        {user.name.split(' ')[0]} {user.name.split(' ')[1]?.charAt(0) ?? ''}.
                      </div>
                    </div>
                    <div>
                      <label htmlFor="rv-rating" className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Rating (Stars)
                      </label>
                      <select
                        id="rv-rating"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 text-slate-700"
                      >
                        <option value={5}>5 Stars - Outstanding</option>
                        <option value={4}>4 Stars - Great Experience</option>
                        <option value={3}>3 Stars - Average</option>
                        <option value={2}>2 Stars - Below Expectation</option>
                        <option value={1}>1 Star - Poor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rv-comment" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Your Comments
                    </label>
                    <textarea
                      id="rv-comment"
                      required
                      minLength={10}
                      maxLength={1000}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your consultation experience, waiting time, and bedside manner..."
                      rows={2}
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addReview.isPending}
                    className="py-2 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{addReview.isPending ? 'Submitting…' : 'Submit Review'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live Slots */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-card sticky top-24 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-base">Select Available Slot</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Choose a day to see open consultation slots. Times are local to the clinic.</p>
            </div>

            {availabilityQuery.isLoading ? (
              <LoadingState label="Checking availability…" className="py-8" />
            ) : availabilityQuery.isError ? (
              <ErrorState error={availabilityQuery.error} onRetry={() => void availabilityQuery.refetch()} className="py-6" />
            ) : (
              <>
                <div className="grid grid-cols-5 gap-1.5">
                  {days.map((d, i) => (
                    <button
                      key={d.date}
                      type="button"
                      disabled={!d.isWorkingDay}
                      onClick={() => setActiveDateTab(d.date)}
                      title={d.isWorkingDay ? undefined : 'Not consulting'}
                      className={`py-2 px-1 text-center rounded-xl border text-xs transition-all ${
                        !d.isWorkingDay
                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                          : activeDay?.date === d.date
                            ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[10px] opacity-80 uppercase">{i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.weekday.slice(0, 3)}</div>
                      <div className="font-bold text-xs mt-0.5">{d.date.slice(8)}</div>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                    <span>{activeDay ? formatDateKey(activeDay.date) : ''}</span>
                    <span className="text-[11px] text-slate-400">{activeDay?.isWorkingDay ? `${openSlots} slots left` : 'Not consulting'}</span>
                  </div>

                  {activeDay?.isWorkingDay ? (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-0.5">
                      {activeDay.slots.map(({ slot, state }) => {
                        const unavailable = state !== 'available';
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={unavailable}
                            onClick={() => handleSlotClick(slot)}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              unavailable
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                : 'bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-800 border-brand-200 hover:border-brand-600 shadow-2xs'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 text-center">No consultations on this day.</p>
                  )}
                </div>
              </>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Manage it yourself</span>
              </div>
              <p className="text-[11px] text-slate-500">Reschedule or cancel upcoming visits any time from your patient dashboard.</p>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        doctor={doctor}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialDate={selectedSlotForBooking?.date ?? activeDay?.date}
        initialSlot={selectedSlotForBooking?.slot ?? ''}
      />
    </div>
  );
};
