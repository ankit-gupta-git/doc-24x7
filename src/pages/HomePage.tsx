import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  ArrowRight,
  Stethoscope,
  Building,
  ChevronRight,
  ChevronLeft,
  Video,
  CalendarCheck,
  Layers,
  Quote,
  Flower2,
  Droplet,
  Sparkles,
  ScanFace,
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  Baby,
  Smile,
  Brain,
  Plus,
} from 'lucide-react';
import { useCities, useClinics, useDoctorReviews, useDoctors, useSpecialties } from '../api/hooks';
import { CardSkeletonGrid, ErrorState } from '../components/common/QueryState';
import { DoctorCard } from '../components/common/DoctorCard';
import { SPECIALTY_COLORS } from '../components/common/specialtyColors';
import { SpecialtyIcon } from '../components/common/IconHelper';
import { BookingModal } from '../components/booking/BookingModal';
import { AppDownloadSection } from '../components/home/AppDownloadSection';
import { FaqSection, ForDoctorsSection, LivePrescriptionSpotlight, PlatformStats } from '../components/home/HomeExtras';
import { ConsultJourney, DoctorSpotlightCarousel, Reveal, SpecialtyMarquee } from '../components/home/AnimatedSections';
import { Doctor } from '../types';
import { CLINIC_PLACEHOLDER_IMAGE } from '../components/common/format';

const DEFAULT_THEME = { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100', hoverBorder: 'hover:border-brand-300' };
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=600`;
const themeOf = (slug: string) => SPECIALTY_COLORS[slug] ?? DEFAULT_THEME;

/**
 * In-clinic carousel cards. Shown even when the API is unreachable; specialties added later by an
 * admin are appended from the API with their icon and description.
 */
const SPECIALTY_CARDS: { slug: string; name: string; photo: string; tagline: string }[] = [
  { slug: 'dental-care', name: 'Dentist', photo: 'photo-1606811971618-4486d14f3f99', tagline: 'Toothache or due for a check-up? See a dentist' },
  { slug: 'gynecology', name: 'Gynecologist/Obstetrician', photo: 'photo-1493894473891-10fc1e5dbd22', tagline: 'Women’s health, pregnancy and fertility care' },
  { slug: 'cardiology', name: 'Cardiologist', photo: 'photo-1633488781325-d36e6818d0c8', tagline: 'Chest pain or high BP? Get your heart checked' },
  { slug: 'orthopedics', name: 'Orthopedist', photo: 'photo-1597764690523-15bea4c581c9', tagline: 'Joint pain or a sports injury? Get back on your feet' },
  { slug: 'dermatology', name: 'Dermatologist', photo: 'photo-1570172619644-dfd03ed5d881', tagline: 'Skin, hair or nail concerns treated by specialists' },
  { slug: 'pediatrics', name: 'Pediatrician', photo: 'photo-1555252333-9f8e92e65df9', tagline: 'Gentle, expert care from infancy to the teenage years' },
  { slug: 'general-medicine', name: 'General Physician', photo: 'photo-1659353887238-d6c8506a1b5b', tagline: 'Fever, infections or a routine health check-up' },
  { slug: 'neurology', name: 'Neurologist', photo: 'photo-1559757175-5700dde675bc', tagline: 'Headaches, dizziness or nerve problems' },
  { slug: 'ophthalmology', name: 'Eye Specialist', photo: 'photo-1574258495973-f010dfbb5371', tagline: 'Blurry vision? Book a complete eye examination' },
  { slug: 'psychiatry', name: 'Psychiatrist', photo: 'photo-1584515933487-779824d29309', tagline: 'Stress, anxiety or low mood? Talk to an expert' },
];

/** Common reasons to see a doctor online, each mapped to the specialty that handles it. */
const HEALTH_CONCERNS = [
  { label: 'Period doubts or Pregnancy', slug: 'gynecology', icon: Flower2, accent: Droplet, circle: 'bg-gradient-to-br from-indigo-50 to-pink-50', iconColor: 'text-pink-400', accentBg: 'bg-rose-400' },
  { label: 'Acne, pimple or skin issues', slug: 'dermatology', icon: Sparkles, accent: ScanFace, circle: 'bg-gradient-to-br from-sky-50 to-indigo-50', iconColor: 'text-sky-500', accentBg: 'bg-orange-400' },
  { label: 'Chest pain or high BP', slug: 'cardiology', icon: HeartPulse, accent: Activity, circle: 'bg-gradient-to-br from-slate-200 to-rose-50', iconColor: 'text-rose-500', accentBg: 'bg-violet-400' },
  { label: 'Cold, cough or fever', slug: 'general-medicine', icon: Thermometer, accent: Wind, circle: 'bg-gradient-to-br from-indigo-50 to-sky-50', iconColor: 'text-slate-500', accentBg: 'bg-sky-400' },
  { label: 'Child not feeling well', slug: 'pediatrics', icon: Baby, accent: Smile, circle: 'bg-gradient-to-br from-slate-200 to-violet-100', iconColor: 'text-amber-500', accentBg: 'bg-violet-400' },
  { label: 'Depression or anxiety', slug: 'psychiatry', icon: Brain, accent: Plus, circle: 'bg-gradient-to-br from-rose-50 to-slate-200', iconColor: 'text-violet-500', accentBg: 'bg-rose-400' },
];

/** Section heading row: title + subtitle on the left, "view all" link on the right. */
const SectionHeader: React.FC<{ title: string; subtitle: string; to?: string; linkLabel?: string; children?: React.ReactNode }> = ({
  title,
  subtitle,
  to,
  linkLabel,
  children,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
    <div>
      <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      {children}
      {to && linkLabel && (
        <Link
          to={to}
          className="px-4 py-2 rounded-lg border border-brand-200 text-brand-600 hover:bg-brand-50 font-semibold text-sm transition-colors"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  </div>
);

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Live data from the DocPulse API
  const specialtiesQuery = useSpecialties();
  const clinicsQuery = useClinics();
  const citiesQuery = useCities();
  const topDoctorsQuery = useDoctors({ sortBy: 'recommended', pageSize: 4 });
  const onlineDoctorsQuery = useDoctors({ online: true, pageSize: 1 });
  const featuredQuery = useDoctors({ sortBy: 'recommended', pageSize: 4, specialty: specialtyFilter === 'all' ? undefined : specialtyFilter });

  const allSpecialties = specialtiesQuery.data ?? [];
  const carouselCards = [
    ...SPECIALTY_CARDS.map((c) => ({ ...c, iconName: allSpecialties.find((sp) => sp.slug === c.slug)?.iconName ?? 'Stethoscope' })),
    ...allSpecialties
      .filter((sp) => !SPECIALTY_CARDS.some((c) => c.slug === sp.slug))
      .map((sp) => ({ slug: sp.slug, name: sp.name, photo: null, tagline: sp.description, iconName: sp.iconName })),
  ];
  const popularSpecialties = (allSpecialties.some((sp) => sp.popular) ? allSpecialties.filter((sp) => sp.popular) : allSpecialties).slice(0, 5);
  const filteredDoctors = featuredQuery.data?.items ?? [];
  const topDoctor = topDoctorsQuery.data?.items[0];
  const clinics = (clinicsQuery.data ?? []).slice(0, 3);
  const totalDoctors = topDoctorsQuery.data?.total ?? 0;
  const totalOnlineDoctors = onlineDoctorsQuery.data?.total ?? 0;
  const totalClinics = clinicsQuery.data?.length ?? 0;
  const totalSpecialties = allSpecialties.length;
  const reviewsQuery = useDoctorReviews(topDoctor?.id);
  const reviews = (reviewsQuery.data ?? []).slice(0, 5);
  const activeReview = reviews[Math.min(reviewIndex, reviews.length - 1)];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('q', searchTerm.trim());
    if (selectedCity && selectedCity !== 'all') params.append('city', selectedCity);
    navigate(`/doctors?${params.toString()}`);
  };

  const scrollCarousel = (direction: 1 | -1) => {
    const el = carouselRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const services = [
    {
      title: 'Instant Video Consultation',
      tagline: totalOnlineDoctors ? `${totalOnlineDoctors} doctors available online` : 'Consult a doctor from home',
      to: '/doctors?online=1',
      icon: Video,
      image: photo('photo-1659353886868-753b0c5c5772'),
      tone: 'bg-sky-200 text-sky-700',
    },
    {
      title: 'Find Doctors Near You',
      tagline: 'Book confirmed clinic appointments',
      to: '/doctors',
      icon: Stethoscope,
      image: photo('photo-1622253692010-333f2da6031d'),
      tone: 'bg-cyan-200 text-teal-700',
    },
    {
      title: 'Partner Clinics',
      tagline: totalClinics ? `${totalClinics} clinics with live schedules` : 'Explore trusted clinics',
      to: '/clinics',
      icon: Building,
      image: photo('photo-1519494026892-80bbd2d6fd0d'),
      tone: 'bg-indigo-200 text-indigo-700',
    },
    {
      title: 'Browse Specialties',
      tagline: totalSpecialties ? `${totalSpecialties} areas of care` : 'Find the right specialist',
      to: '/specialties',
      icon: Layers,
      image: photo('photo-1612531386530-97286d97c2d2'),
      tone: 'bg-slate-300 text-slate-700',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-20 font-sans text-slate-900">
      {/* 1. SEARCH HERO */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24 sm:pt-20 sm:pb-28 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Your home for health</h1>
          <p className="mt-3 text-brand-100 text-sm sm:text-lg">Find and book verified doctors, in clinic or by video.</p>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 mx-auto max-w-4xl bg-white rounded-xl shadow-lg flex flex-col sm:flex-row items-stretch overflow-hidden text-left"
          >
            <label className="relative sm:w-64 border-b sm:border-b-0 sm:border-r border-slate-200">
              <span className="sr-only">City</span>
              <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-full min-h-[52px] pl-10 pr-4 text-sm font-medium text-slate-800 bg-white focus:outline-hidden cursor-pointer"
              >
                <option value="">All cities</option>
                {(citiesQuery.data ?? []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative flex-1">
              <span className="sr-only">Search doctors, specialties or clinics</span>
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctors, specialties, conditions…"
                className="w-full min-h-[52px] pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
              />
            </label>
            <button
              type="submit"
              className="px-8 min-h-[52px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {popularSpecialties.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-brand-200 font-medium">Popular searches:</span>
              {popularSpecialties.map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => navigate(`/doctors?specialty=${tag.slug}`)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-colors cursor-pointer"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. SERVICE TILES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-28 sm:-mt-32 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {services.map(({ title, tagline, to, icon: Icon, tone, image }) => (
            <Link
              key={title}
              to={to}
              className="bg-white rounded-[26px] shadow-[0_6px_20px_rgba(15,23,42,0.10)] hover:shadow-[0_10px_28px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all overflow-hidden group flex flex-col"
            >
              <div className={`relative h-36 sm:h-[212px] ${tone} flex items-center justify-center overflow-hidden`}>
                <Icon className="w-12 h-12" strokeWidth={1.5} />
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 px-4 pt-4 pb-6 sm:px-5 sm:pt-5 sm:pb-9">
                <h3 className="font-bold text-slate-800 text-lg sm:text-[23px] leading-tight">{title}</h3>
                <p className="text-sm sm:text-base text-slate-500 mt-1.5 leading-snug">{tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Platform in numbers (live counts) */}
      <Reveal>
        <PlatformStats
          doctors={totalDoctors}
          onlineDoctors={totalOnlineDoctors}
          specialties={totalSpecialties}
          clinics={totalClinics}
          cities={citiesQuery.data?.length ?? 0}
        />
      </Reveal>

      {/* 3. CONSULT DOCTORS ONLINE: by health concern */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-[30px] font-bold text-slate-700 tracking-tight">Consult top doctors online for any health concern</h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Private online consultations with verified doctors in all specialties</p>
          </div>
          <Link
            to="/specialties"
            className="shrink-0 self-start px-5 py-3 rounded-md border border-sky-500 text-sky-600 hover:bg-sky-50 text-sm font-medium transition-colors"
          >
            View All Specialities
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-10">
          {HEALTH_CONCERNS.map(({ label, slug, icon: Icon, accent: Accent, circle, iconColor, accentBg }) => (
            <Link key={label} to={`/doctors?specialty=${slug}&online=1`} className="flex flex-col items-center text-center group">
              <div className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full ${circle} flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                <Icon className={`w-16 h-16 sm:w-[72px] sm:h-[72px] ${iconColor}`} strokeWidth={1.4} />
                <span className={`absolute bottom-5 right-5 w-9 h-9 rounded-full ${accentBg} text-white flex items-center justify-center shadow-sm`}>
                  <Accent className="w-5 h-5" strokeWidth={2} />
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-700 leading-snug max-w-[150px]">{label}</h3>
              <span className="mt-2 text-sm font-semibold uppercase tracking-wide text-sky-500 group-hover:text-sky-600">Consult now</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. IN-CLINIC SPECIALTY CAROUSEL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-[30px] font-bold text-slate-700 tracking-tight">Book an appointment for an in-clinic consultation</h2>
        <p className="text-sm sm:text-base text-slate-600 mt-1 mb-6">Find experienced doctors across all specialties</p>
        <div className="relative">
          <div ref={carouselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none">
            {carouselCards.map((card) => (
              <Link
                key={card.slug}
                to={`/doctors?specialty=${card.slug}`}
                className="snap-start shrink-0 w-[78%] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)] group"
              >
                <div className={`relative aspect-[7/5] rounded-lg overflow-hidden ${themeOf(card.slug).bg} ${themeOf(card.slug).text} flex items-center justify-center`}>
                  <SpecialtyIcon name={card.iconName} className="w-14 h-14" strokeWidth={1.25} />
                  {card.photo && (
                    <img
                      src={photo(card.photo)}
                      alt=""
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{card.name}</h3>
                <p className="text-sm text-slate-600 mt-0.5 leading-snug line-clamp-2">{card.tagline}</p>
              </Link>
            ))}
          </div>
          {carouselCards.length > 4 && (
            <>
              <button
                type="button"
                aria-label="Previous specialties"
                onClick={() => scrollCarousel(-1)}
                className="hidden sm:flex absolute -left-5 top-[34%] -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next specialties"
                onClick={() => scrollCarousel(1)}
                className="hidden sm:flex absolute -right-5 top-[34%] -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-md border border-slate-100 items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* Specialty marquee (animated) */}
      <SpecialtyMarquee specialties={allSpecialties} />

      {/* 5. FEATURED DOCTORS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Top-rated doctors"
          subtitle="Verified doctors with open appointments this week."
          to="/doctors"
          linkLabel={totalDoctors ? `View all ${totalDoctors} doctors` : 'View all doctors'}
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-4 text-xs font-medium scrollbar-none">
          {[{ label: 'All', value: 'all' }, ...popularSpecialties.slice(0, 4).map((sp) => ({ label: sp.name, value: sp.slug }))].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSpecialtyFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                specialtyFilter === tab.value ? 'bg-brand-600 text-white font-semibold' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDoctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} onBookClick={(doctor) => setSelectedDoctorForBooking(doctor)} />
          ))}
        </div>
        {featuredQuery.isLoading && <CardSkeletonGrid count={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" height="h-80" />}
        {featuredQuery.isError && <ErrorState error={featuredQuery.error} onRetry={() => void featuredQuery.refetch()} />}
        {featuredQuery.isSuccess && filteredDoctors.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-10">No verified doctors are listed in this specialty yet.</p>
        )}
      </section>

      {/* Doctor spotlight carousel (animated) */}
      <DoctorSpotlightCarousel />

      {/* 6. PARTNER CLINICS */}
      {clinics.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Partner clinics"
            subtitle="Clinics with live schedules and on-site care."
            to="/clinics"
            linkLabel={`View all ${totalClinics} clinics`}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clinics.map((clinic) => (
              <Link
                key={clinic.id}
                to={`/clinics/${clinic.id}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-card transition-shadow group"
              >
                <div className="h-40 overflow-hidden bg-slate-100 relative">
                  <img
                    src={clinic.imageUrl || CLINIC_PLACEHOLDER_IMAGE}
                    alt={clinic.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = CLINIC_PLACEHOLDER_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-800 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {clinic.rating}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{clinic.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {clinic.address}, {clinic.city}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-2">{clinic.doctorCount} doctors</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 text-center">How Doctor 24x7 works</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Find a doctor', text: 'Filter by specialty, city, fee, rating or video availability.' },
              { icon: CalendarCheck, title: 'Pick a slot', text: 'See live availability. Each slot can only be booked once.' },
              { icon: ShieldCheck, title: 'Visit or video call', text: 'Go to the clinic, or join a private video room from your dashboard.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-white border border-slate-200 text-brand-600 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-3 font-bold text-slate-900">
                  {i + 1}. {title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live prescription spotlight */}
      <Reveal>
        <LivePrescriptionSpotlight />
      </Reveal>

      {/* Video visit journey (scroll-animated) */}
      <ConsultJourney />

      {/* 8. TESTIMONIALS (real reviews; hidden until there are some) */}
      {activeReview && topDoctor && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-bold text-slate-900 text-center">What our patients say</h2>
          <div className="mt-8 max-w-3xl mx-auto text-center">
            <Quote className="w-8 h-8 text-brand-200 mx-auto" />
            <div className="mt-3 flex items-center justify-center gap-1" aria-label={`${activeReview.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < activeReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">“{activeReview.comment}”</p>
            <p className="mt-4 text-sm font-semibold text-slate-900">{activeReview.patientName}</p>
            <p className="text-xs text-slate-400">
              {activeReview.verifiedVisit ? 'Verified visit' : 'Patient review'} with {topDoctor.name}
            </p>
            {reviews.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {reviews.map((review, i) => (
                  <button
                    key={review.id}
                    type="button"
                    aria-label={`Show review ${i + 1}`}
                    aria-current={review.id === activeReview.id}
                    onClick={() => setReviewIndex(i)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      review.id === activeReview.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* For doctors */}
      <Reveal>
        <ForDoctorsSection />
      </Reveal>

      {/* 9. DOWNLOAD THE APP */}
      <AppDownloadSection />

      {/* FAQ */}
      <Reveal>
        <FaqSection />
      </Reveal>

      {/* 10. CLOSING CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Talk to a doctor today</h2>
            <p className="mt-2 text-brand-100 text-sm sm:text-base">Book a clinic visit or a video consultation in a few clicks.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/doctors?online=1"
              className="px-6 py-3 rounded-lg bg-white text-brand-800 hover:bg-slate-50 font-semibold text-sm flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Consult online
            </Link>
            <Link to="/doctors" className="px-6 py-3 rounded-lg border border-white/40 hover:bg-white/10 font-semibold text-sm">
              Book clinic visit
            </Link>
          </div>
        </div>
      </section>

      <BookingModal doctor={selectedDoctorForBooking} isOpen={!!selectedDoctorForBooking} onClose={() => setSelectedDoctorForBooking(null)} />
    </div>
  );
};
