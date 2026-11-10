import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, X, Users, Loader2 } from 'lucide-react';

import { errorMessage } from '../api/client';
import type { Specialty } from '../api/contract';
import { useDeleteSpecialty, useSaveSpecialty, useSpecialties } from '../api/hooks';
import { SpecialtyIcon } from '../components/common/IconHelper';
import { ConfirmModal, EmptyState, ErrorState, FeedbackBanner, LoadingState } from '../components/portal/PortalUI';
import { useFeedback } from '../components/portal/hooks';

const ICONS = ['HeartPulse', 'Sparkles', 'Baby', 'Bone', 'Stethoscope', 'Brain', 'Activity', 'Eye', 'Smile', 'UserCheck'];

export const AdminSpecialtiesPage: React.FC = () => {
  const specialties = useSpecialties();
  const remove = useDeleteSpecialty();
  const feedback = useFeedback();
  const [editing, setEditing] = useState<Specialty | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Specialty | null>(null);

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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Specialty Catalog Operations</h1>
          <p className="text-xs text-slate-500 mt-1">Create, edit and organize the healthcare categories used across search and booking.</p>
        </div>

        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Specialty</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback.feedback} onClose={feedback.clear} />

      {specialties.isPending ? (
        <LoadingState label="Loading specialties…" />
      ) : specialties.isError ? (
        <ErrorState error={specialties.error} onRetry={() => void specialties.refetch()} title="Couldn’t load specialties" />
      ) : specialties.data.length === 0 ? (
        <EmptyState title="No specialties yet" message="Add the first medical specialty so doctors can be listed under it." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {specialties.data.map((spec) => (
            <div key={spec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <SpecialtyIcon name={spec.iconName} className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(spec)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                      title="Edit"
                      aria-label={`Edit ${spec.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        remove.reset();
                        setDeleting(spec);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      title="Delete"
                      aria-label={`Delete ${spec.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-slate-900">{spec.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 block">slug: {spec.slug}</span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{spec.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-brand-600" />
                  {spec.doctorCount} listed doctor{spec.doctorCount === 1 ? '' : 's'}
                </span>
                {spec.popular && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">Featured</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SpecialtyFormModal
          specialty={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(s, created) => {
            setEditing(null);
            feedback.success(created ? `${s.name} was added.` : `${s.name} was updated.`);
          }}
        />
      )}

      <ConfirmModal
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'specialty'}?`}
        message="It will be removed from search, filters and the home page. Specialties that doctors are still listed under can’t be deleted until those doctors are moved."
        tone="danger"
        confirmLabel="Delete specialty"
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

const SpecialtyFormModal: React.FC<{ specialty: Specialty | null; onClose: () => void; onSaved: (s: Specialty, created: boolean) => void }> = ({
  specialty,
  onClose,
  onSaved,
}) => {
  const save = useSaveSpecialty();
  const [name, setName] = useState(specialty?.name ?? '');
  const [description, setDescription] = useState(specialty?.description ?? '');
  const [iconName, setIconName] = useState(specialty?.iconName ?? 'Stethoscope');
  const [popular, setPopular] = useState(specialty?.popular ?? false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (name.trim().length < 2) return setFormError('Enter a specialty name.');
    if (description.trim().length < 10) return setFormError('The description should be at least 10 characters.');
    save.mutate(
      { id: specialty?.id, body: { name: name.trim(), description: description.trim(), iconName, popular } },
      { onSuccess: (s) => onSaved(s, !specialty), onError: (err) => setFormError(errorMessage(err)) },
    );
  };

  const field = 'w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 bg-white';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">{specialty ? 'Edit Specialty' : 'Add New Medical Specialty'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Specialty Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Endocrinology" maxLength={80} className={field} />
            {specialty && <p className="text-[11px] text-slate-400 mt-1">The URL slug ({specialty.slug}) stays the same when renaming.</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description *</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Clinical domain focus..." className={field} />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setIconName(icon)}
                  aria-pressed={iconName === icon}
                  title={icon}
                  className={`h-10 rounded-xl border flex items-center justify-center transition-colors ${
                    iconName === icon ? 'bg-brand-600 border-brand-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <SpecialtyIcon name={icon} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="popCheck" checked={popular} onChange={(e) => setPopular(e.target.checked)} className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="popCheck" className="font-semibold text-slate-700">
              Feature on Homepage
            </label>
          </div>

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
              <span>{specialty ? 'Save Changes' : 'Create Specialty'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
