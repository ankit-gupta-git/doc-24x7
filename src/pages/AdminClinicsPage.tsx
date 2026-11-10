import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Plus, Edit2, Trash2, ArrowLeft, X, MapPin, Clock, Phone, Star, Loader2, Globe } from 'lucide-react';

import { errorMessage } from '../api/client';
import type { Clinic, ClinicInput } from '../api/contract';
import { useClinics, useDeleteClinic, useSaveClinic } from '../api/hooks';
import { ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState } from '../components/portal/PortalUI';
import { useFeedback } from '../components/portal/hooks';
import { TIMEZONES } from '../components/portal/format';

const currentYear = new Date().getFullYear();

/** Clinic photo with a neutral placeholder when the URL is missing or broken. */
const ClinicImage: React.FC<{ src: string | null; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-300">
        <Building className="w-10 h-10" />
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover" />;
};

export const AdminClinicsPage: React.FC = () => {
  const clinics = useClinics();
  const remove = useDeleteClinic();
  const feedback = useFeedback();
  const [editing, setEditing] = useState<Clinic | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Clinic | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Dashboard</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Clinic Facility Management</h1>
          <p className="text-xs text-slate-500 mt-1">Register and manage medical facilities, addresses, time zones and operating hours.</p>
        </div>

        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Clinic Facility</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      {clinics.isPending ? (
        <LoadingState label="Loading clinics…" />
      ) : clinics.isError ? (
        <ErrorState error={clinics.error} onRetry={() => void clinics.refetch()} title="Couldn’t load clinics" />
      ) : clinics.data.length === 0 ? (
        <EmptyState title="No clinics yet" message="Add a clinic so doctors can be affiliated with it." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.data.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card flex flex-col justify-between">
              <div>
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <ClinicImage src={c.imageUrl} alt={c.name} />
                  {c.reviewCount > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-white/95 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-800 shadow-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{c.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                        title="Edit clinic"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          remove.reset();
                          setDeleting(c);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="Delete clinic"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {c.address}, {c.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.openHours}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.timezone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-brand-700 font-semibold">
                <span>
                  {c.doctorCount} listed doctor{c.doctorCount === 1 ? '' : 's'}
                </span>
                {c.establishedYear && <span className="text-slate-400 font-normal">Est. {c.establishedYear}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ClinicFormModal
          clinic={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(c, created) => {
            setEditing(null);
            feedback.success(created ? `${c.name} was added.` : `${c.name} was updated.`);
          }}
        />
      )}

      <ConfirmModal
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'clinic'}?`}
        message="It will be removed from the clinic directory. Clinics with affiliated doctors (including inactive or unverified ones) can’t be deleted until those doctors are reassigned."
        tone="danger"
        confirmLabel="Delete clinic"
        pending={remove.isPending}
        error={remove.error}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          const name = deleting.name;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              feedback.success(`${name} was deleted.`);
            },
          });
        }}
      />
    </div>
  );
};

const ClinicFormModal: React.FC<{ clinic: Clinic | null; onClose: () => void; onSaved: (c: Clinic, created: boolean) => void }> = ({
  clinic,
  onClose,
  onSaved,
}) => {
  const save = useSaveClinic();
  const [name, setName] = useState(clinic?.name ?? '');
  const [address, setAddress] = useState(clinic?.address ?? '');
  const [city, setCity] = useState(clinic?.city ?? '');
  const [timezone, setTimezone] = useState(clinic?.timezone ?? 'Asia/Kolkata');
  const [phone, setPhone] = useState(clinic?.phone ?? '');
  const [email, setEmail] = useState(clinic?.email ?? '');
  const [openHours, setOpenHours] = useState(clinic?.openHours ?? 'Mon - Fri: 8:00 AM - 6:00 PM');
  const [establishedYear, setEstablishedYear] = useState(clinic?.establishedYear ? String(clinic.establishedYear) : '');
  const [services, setServices] = useState(clinic?.services.join(', ') ?? '');
  const [imageUrl, setImageUrl] = useState(clinic?.imageUrl ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const zones = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 2) return setFormError('Enter the clinic name.');
    if (address.trim().length < 3) return setFormError('Enter the street address.');
    if (city.trim().length < 2) return setFormError('Enter the city.');
    if (phone.trim().length < 5) return setFormError('Enter a contact phone number.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setFormError('Enter a valid contact email.');
    if (openHours.trim().length < 3) return setFormError('Enter the operating hours.');
    let year: number | null = null;
    if (establishedYear.trim()) {
      year = Number(establishedYear);
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) return setFormError(`Established year must be between 1900 and ${currentYear}.`);
    }
    const url = imageUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) return setFormError('Image must be an http(s) URL.');

    const body: ClinicInput = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      timezone,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      openHours: openHours.trim(),
      establishedYear: year,
      services: services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: url || null,
    };
    save.mutate({ id: clinic?.id, body }, { onSuccess: (c) => onSaved(c, !clinic), onError: (err) => setFormError(errorMessage(err)) });
  };

  const field = 'w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 bg-white';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">{clinic ? 'Edit Clinic Facility' : 'Register New Clinic Facility'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinic Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} maxLength={160} className={field} />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
            <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time Zone *</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={field}>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating Hours *</label>
              <input type="text" required value={openHours} onChange={(e) => setOpenHours(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Established Year</label>
              <input type="number" min={1900} max={currentYear} value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Services (comma-separated)</label>
            <input type="text" value={services} onChange={(e) => setServices(e.target.value)} placeholder="Diagnostic Lab, Pharmacy, X-Ray" className={field} />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Image URL (optional)</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className={field} />
          </div>
          <p className="text-[11px] text-slate-400">Appointment dates and slots at this clinic are shown in its time zone.</p>

          {formError && (
            <p className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700" role="alert">
              {formError}
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md disabled:opacity-60 flex items-center gap-1.5"
            >
              {save.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{clinic ? 'Save Changes' : 'Create Clinic'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
