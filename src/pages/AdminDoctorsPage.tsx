import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Edit2, ArrowLeft, X, Loader2, ShieldCheck } from 'lucide-react';

import type { AdminDoctorQuery, Doctor, DoctorInput } from '../api/contract';
import { useAdminDoctors, useClinics, useSaveDoctor, useSetDoctorFlags, useSpecialties } from '../api/hooks';
import { errorMessage } from '../api/client';
import { AvatarImg, ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState, Pager } from '../components/portal/PortalUI';
import { useDebouncedValue, useFeedback } from '../components/portal/hooks';
import { money } from '../components/portal/format';

type StatusFilter = NonNullable<AdminDoctorQuery['status']>;
const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'unverified', label: 'Awaiting verification' },
];
const isStatus = (v: string | null): v is StatusFilter => STATUS_TABS.some((t) => t.value === v);

const PAGE_SIZE = 20;

type FlagAction = { doctor: Doctor; flag: 'isVerified' | 'isActive'; value: boolean };

export const AdminDoctorsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const status: StatusFilter = isStatus(params.get('status')) ? (params.get('status') as StatusFilter) : 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchTerm.trim());

  const list = useAdminDoctors({ search: search || undefined, status, page, pageSize: PAGE_SIZE });
  const counts: Record<StatusFilter, number | undefined> = {
    all: useAdminDoctors({ search: search || undefined, status: 'all', pageSize: 1 }).data?.total,
    active: useAdminDoctors({ search: search || undefined, status: 'active', pageSize: 1 }).data?.total,
    inactive: useAdminDoctors({ search: search || undefined, status: 'inactive', pageSize: 1 }).data?.total,
    unverified: useAdminDoctors({ search: search || undefined, status: 'unverified', pageSize: 1 }).data?.total,
  };

  const setFlags = useSetDoctorFlags();
  const feedback = useFeedback();
  const [flagAction, setFlagAction] = useState<FlagAction | null>(null);
  const [editing, setEditing] = useState<Doctor | 'new' | null>(null);

  const setStatus = (v: StatusFilter) => {
    setPage(1);
    setParams(v === 'all' ? {} : { status: v });
  };

  const confirmFlag = () => {
    if (!flagAction) return;
    const { doctor, flag, value } = flagAction;
    setFlags.mutate(
      { id: doctor.id, [flag]: value },
      {
        onSuccess: () => {
          setFlagAction(null);
          feedback.success(
            flag === 'isVerified'
              ? `${doctor.name} is now ${value ? 'verified and visible to patients' : 'unverified and hidden from patients'}.`
              : `${doctor.name} has been ${value ? 'activated' : 'deactivated'}.`,
          );
        },
      },
    );
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Doctor Directory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify new sign-ups, edit profiles and fees, and activate or deactivate doctors. Only active, verified doctors are shown to
            patients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                status === tab.value ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {counts[tab.value] !== undefined ? ` (${counts[tab.value]})` : ''}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, specialty, city or email..."
            aria-label="Search doctors"
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500"
          />
        </div>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      {list.isPending ? (
        <LoadingState label="Loading doctors…" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} title="Couldn’t load doctors" />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title={status === 'unverified' ? 'No doctors are awaiting verification' : 'No doctors found'}
          message={search ? 'Try a different search.' : 'Add a doctor or wait for new sign-ups.'}
        />
      ) : (
        <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card ${list.isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Doctor</th>
                  <th className="px-5 py-3.5">Specialty</th>
                  <th className="px-5 py-3.5">Clinic & City</th>
                  <th className="px-5 py-3.5">Experience</th>
                  <th className="px-5 py-3.5">Fee</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {list.data.items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AvatarImg src={doc.profileImageUrl} name={doc.name} className="w-9 h-9 rounded-xl border border-slate-200" />
                        <div>
                          {doc.isActive && doc.isVerified ? (
                            <Link to={`/doctors/${doc.id}`} className="font-bold text-slate-900 hover:text-brand-600 block">
                              {doc.name}
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-900 block">{doc.name}</span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {doc.email}
                            {doc.userId ? ' · has login' : ' · directory only'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        {doc.specialty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-800 block">{doc.clinicName}</span>
                      <span className="text-slate-400 text-[10px]">{doc.city}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{doc.experienceYears} Years</td>
                    <td className="px-5 py-3.5 font-black text-slate-900">{money(doc.consultationFee)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            doc.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {doc.isActive ? 'Active' : 'Deactivated'}
                        </span>
                        {!doc.isVerified && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(doc)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                          title="Edit doctor"
                          aria-label={`Edit ${doc.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFlags.reset();
                            setFlagAction({ doctor: doc, flag: 'isVerified', value: !doc.isVerified });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                            doc.isVerified ? 'text-slate-600 hover:bg-slate-100 border-slate-200' : 'text-amber-700 hover:bg-amber-50 border-amber-300'
                          }`}
                        >
                          {doc.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFlags.reset();
                            setFlagAction({ doctor: doc, flag: 'isActive', value: !doc.isActive });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            doc.isActive ? 'text-rose-600 hover:bg-rose-50 border border-rose-200' : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {doc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4">
            <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />
          </div>
        </div>
      )}

      {editing && (
        <DoctorFormModal
          doctor={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(d, created) => {
            setEditing(null);
            feedback.success(created ? `${d.name} was added to the directory.` : `${d.name} was updated.`);
          }}
        />
      )}

      <ConfirmModal
        open={flagAction !== null}
        title={
          flagAction
            ? flagAction.flag === 'isVerified'
              ? `${flagAction.value ? 'Verify' : 'Unverify'} ${flagAction.doctor.name}?`
              : `${flagAction.value ? 'Activate' : 'Deactivate'} ${flagAction.doctor.name}?`
            : ''
        }
        message={
          flagAction?.flag === 'isVerified'
            ? flagAction.value
              ? 'Confirm you have checked this doctor’s credentials. Their profile becomes visible to patients and bookable.'
              : 'Their profile will be hidden from patients and new bookings blocked. Existing appointments are not changed.'
            : flagAction?.value
              ? 'The doctor will be visible to patients again (if verified).'
              : 'The doctor will be hidden from patients and new bookings blocked. Existing appointments are not changed.'
        }
        tone={flagAction && !flagAction.value ? 'danger' : 'default'}
        confirmLabel={
          flagAction ? (flagAction.flag === 'isVerified' ? (flagAction.value ? 'Verify' : 'Unverify') : flagAction.value ? 'Activate' : 'Deactivate') : 'Confirm'
        }
        pending={setFlags.isPending}
        error={setFlags.error}
        onClose={() => setFlagAction(null)}
        onConfirm={confirmFlag}
      />
    </div>
  );
};

// ---------- Create / edit form ----------

const splitList = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const DoctorFormModal: React.FC<{ doctor: Doctor | null; onClose: () => void; onSaved: (d: Doctor, created: boolean) => void }> = ({
  doctor,
  onClose,
  onSaved,
}) => {
  const specialties = useSpecialties();
  const clinics = useClinics();
  const save = useSaveDoctor();

  const [name, setName] = useState(doctor?.name ?? '');
  const [email, setEmail] = useState(doctor?.email ?? '');
  const [phone, setPhone] = useState(doctor?.phone ?? '');
  const [specialtyId, setSpecialtyId] = useState(doctor?.specialtyId ?? '');
  const [clinicId, setClinicId] = useState(doctor?.clinicId ?? '');
  const [experienceYears, setExperienceYears] = useState(String(doctor?.experienceYears ?? 5));
  const [consultationFee, setConsultationFee] = useState(String(doctor?.consultationFee ?? 100));
  const [qualifications, setQualifications] = useState(doctor?.qualifications.join(', ') ?? '');
  const [languages, setLanguages] = useState(doctor?.languages.join(', ') ?? 'English');
  const [about, setAbout] = useState(doctor?.about ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(doctor?.profileImageUrl ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSpecialty = specialtyId || specialties.data?.[0]?.id || '';
  const effectiveClinic = clinicId || clinics.data?.[0]?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const exp = Number(experienceYears);
    const fee = Number(consultationFee);
    if (name.trim().length < 2) return setFormError('Enter the doctor’s full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setFormError('Enter a valid email address.');
    if (!effectiveSpecialty || !effectiveClinic) return setFormError('Choose a specialty and a clinic.');
    if (!Number.isInteger(exp) || exp < 0 || exp > 60) return setFormError('Experience must be between 0 and 60 years.');
    if (!Number.isInteger(fee) || fee < 10 || fee > 1000) return setFormError('Fee must be a whole-rupee amount between ₹10 and ₹1,000.');
    const url = profileImageUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) return setFormError('Profile image must be an http(s) URL.');

    const body: DoctorInput = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      specialtyId: effectiveSpecialty,
      clinicId: effectiveClinic,
      experienceYears: exp,
      consultationFee: fee,
      qualifications: splitList(qualifications),
      languages: splitList(languages),
      about: about.trim(),
      profileImageUrl: url || null,
    };
    save.mutate({ id: doctor?.id, body }, { onSuccess: (d) => onSaved(d, !doctor), onError: (err) => setFormError(errorMessage(err)) });
  };

  const field = 'w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 bg-white';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">{doctor ? 'Edit Doctor Record' : 'Add New Doctor to Network'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!doctor && (
          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            Creates a verified directory profile without a login. Doctors who sign up themselves appear under “Awaiting verification”.
          </p>
        )}

        {specialties.isError || clinics.isError ? (
          <ErrorState
            error={specialties.error ?? clinics.error}
            onRetry={() => {
              void specialties.refetch();
              void clinics.refetch();
            }}
            title="Couldn’t load specialties or clinics"
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Doctor Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Jordan Hayes" className={field} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={field} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialty *</label>
                <select value={effectiveSpecialty} onChange={(e) => setSpecialtyId(e.target.value)} disabled={specialties.isPending} className={field}>
                  {specialties.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinic *</label>
                <select value={effectiveClinic} onChange={(e) => setClinicId(e.target.value)} disabled={clinics.isPending} className={field}>
                  {clinics.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
                <input type="number" min={0} max={60} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className={field} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Consultation Fee ($)</label>
                <input type="number" min={10} max={1000} step={5} value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualifications (comma-separated)</label>
              <input type="text" value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="MD (Cardiology), FACC" className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Languages (comma-separated)</label>
              <input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">About</label>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} maxLength={2000} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Profile image URL (optional)</label>
              <input type="url" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://…" className={field} />
            </div>
            <p className="text-[11px] text-slate-400">The city follows the selected clinic.</p>

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
                <span>{doctor ? 'Save Changes' : 'Create Doctor Record'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
