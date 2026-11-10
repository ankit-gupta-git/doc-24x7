import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Plus, Radio, Trash2 } from 'lucide-react';

import { errorMessage } from '../../api/client';
import type { Appointment, Prescription, PrescriptionInput, PrescriptionMedicine } from '../../api/contract';
import { usePrescription, useSavePrescription } from '../../api/hooks';
import type { CallSession } from '../../video/callSession';
import { PrescriptionView } from './PrescriptionView';
import { LIMITS, RX_TOPIC, cleanPrescription, emptyMedicine, type LiveRxMessage } from './rx';

interface Props {
  session: CallSession;
  appointment: Appointment;
  draft: PrescriptionInput;
  onChange: (draft: PrescriptionInput) => void;
  /** Set once the prescription is issued (it's read-only from then on). */
  issued: Prescription | null;
  onIssuedFound: (rx: Prescription) => void;
}

const FREQUENCIES = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'Once a day', 'Twice a day', 'Every 8 hours', 'As needed'];
const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '2 weeks', '1 month', '3 months'];
const INSTRUCTIONS = ['After food', 'Before food', 'With water', 'At bedtime', 'On an empty stomach'];

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const label = 'block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1';

const localDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * The doctor's prescription pad during the call. Every change is shown live to the patient over the
 * call's data channel and autosaved as a draft; the draft is issued when the doctor ends the consultation.
 */
export const PrescriptionPad: React.FC<Props> = ({ session, appointment, draft, onChange, issued, onIssuedFound }) => {
  const call = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const existing = usePrescription(appointment.id);
  const save = useSavePrescription();
  const saveDraft = save.mutate; // stable across renders
  const edited = useRef(false);
  const restored = useRef(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const inCall = call.phase === 'in_call';

  // Rejoining: pick up the draft saved earlier (or the issued prescription).
  useEffect(() => {
    if (restored.current || existing.data === undefined) return;
    restored.current = true;
    const rx = existing.data;
    if (!rx) return;
    if (rx.status === 'issued') onIssuedFound(rx);
    else if (!edited.current) {
      onChange({ diagnosis: rx.diagnosis, medicines: rx.medicines, advice: rx.advice, followUpDate: rx.followUpDate });
      setSavedAt(rx.updatedAt);
    }
  }, [existing.data, onChange, onIssuedFound]);

  // Live: send the draft to the patient shortly after each change, and again when they (re)join.
  useEffect(() => {
    if (!inCall || issued) return;
    const t = setTimeout(() => {
      const message: LiveRxMessage = { type: 'draft', prescription: draft };
      void session.sendMessage(RX_TOPIC, message);
    }, 250);
    return () => clearTimeout(t);
  }, [draft, inCall, issued, session]);

  // Autosave the draft so nothing is lost if the tab closes or the call drops.
  useEffect(() => {
    if (!edited.current || issued) return;
    const t = setTimeout(() => {
      saveDraft({ appointmentId: appointment.id, ...cleanPrescription(draft) }, { onSuccess: (rx) => setSavedAt(rx.updatedAt) });
    }, 1500);
    return () => clearTimeout(t);
  }, [draft, issued, appointment.id, saveDraft]);

  const edit = (patch: Partial<PrescriptionInput>) => {
    edited.current = true;
    onChange({ ...draft, ...patch });
  };
  const editMedicine = (index: number, patch: Partial<PrescriptionMedicine>) =>
    edit({ medicines: draft.medicines.map((m, i) => (i === index ? { ...m, ...patch } : m)) });

  if (issued) {
    return (
      <div className="p-4 sm:p-5 space-y-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> Issued and shared with the patient. It can’t be changed.
        </p>
        <PrescriptionView rx={issued} meta={issued} status="issued" issuedAt={issued.issuedAt} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-slate-900">Prescription</h2>
          <p className="text-xs text-slate-500">For {appointment.patientName}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            inCall ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}
          title={inCall ? 'The patient sees what you write as you type.' : 'The patient sees it as soon as they join.'}
        >
          <Radio className={`w-3 h-3 ${inCall ? 'motion-safe:animate-pulse' : ''}`} />
          {inCall ? 'Live to patient' : 'Patient not here'}
        </span>
      </div>

      <div>
        <label htmlFor="rx-diagnosis" className={label}>
          Diagnosis
        </label>
        <textarea
          id="rx-diagnosis"
          rows={2}
          maxLength={LIMITS.diagnosis}
          value={draft.diagnosis}
          onChange={(e) => edit({ diagnosis: e.target.value })}
          placeholder="e.g. Stage 1 hypertension"
          className={`${field} resize-y`}
        />
      </div>

      <div className="space-y-2">
        <p className={label}>Medicines</p>
        {draft.medicines.map((m, i) => (
          <fieldset key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <legend className="sr-only">Medicine {i + 1}</legend>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 shrink-0 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
              <input
                aria-label={`Medicine ${i + 1} name`}
                value={m.name}
                maxLength={LIMITS.name}
                onChange={(e) => editMedicine(i, { name: e.target.value })}
                placeholder="Medicine name"
                className={`${field} font-semibold`}
                autoFocus={i === draft.medicines.length - 1 && !m.name}
              />
              <button
                type="button"
                onClick={() => edit({ medicines: draft.medicines.filter((_, j) => j !== i) })}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                aria-label={`Remove medicine ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Dosage" value={m.dosage} maxLength={LIMITS.dosage} onChange={(e) => editMedicine(i, { dosage: e.target.value })} placeholder="Dosage, e.g. 500 mg" className={field} />
              <input aria-label="Frequency" list="rx-frequencies" value={m.frequency} maxLength={LIMITS.frequency} onChange={(e) => editMedicine(i, { frequency: e.target.value })} placeholder="Frequency" className={field} />
              <input aria-label="Duration" list="rx-durations" value={m.duration} maxLength={LIMITS.duration} onChange={(e) => editMedicine(i, { duration: e.target.value })} placeholder="Duration" className={field} />
              <input aria-label="Instructions" list="rx-instructions" value={m.instructions} maxLength={LIMITS.instructions} onChange={(e) => editMedicine(i, { instructions: e.target.value })} placeholder="Instructions" className={field} />
            </div>
          </fieldset>
        ))}
        {draft.medicines.length < LIMITS.medicines && (
          <button
            type="button"
            onClick={() => edit({ medicines: [...draft.medicines, emptyMedicine()] })}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-brand-200 text-brand-700 hover:bg-brand-50 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add medicine
          </button>
        )}
        <datalist id="rx-frequencies">{FREQUENCIES.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="rx-durations">{DURATIONS.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="rx-instructions">{INSTRUCTIONS.map((v) => <option key={v} value={v} />)}</datalist>
      </div>

      <div>
        <label htmlFor="rx-advice" className={label}>
          Advice
        </label>
        <textarea
          id="rx-advice"
          rows={3}
          maxLength={LIMITS.advice}
          value={draft.advice}
          onChange={(e) => edit({ advice: e.target.value })}
          placeholder="Diet, lifestyle, tests to do…"
          className={`${field} resize-y`}
        />
      </div>

      <div>
        <label htmlFor="rx-follow-up" className={label}>
          Follow-up
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="rx-follow-up"
            type="date"
            min={localDate(1)}
            value={draft.followUpDate ?? ''}
            onChange={(e) => edit({ followUpDate: e.target.value || null })}
            className={`${field} w-auto`}
          />
          {[
            ['1 week', 7],
            ['2 weeks', 14],
            ['1 month', 30],
          ].map(([text, days]) => (
            <button
              key={text}
              type="button"
              onClick={() => edit({ followUpDate: localDate(days as number) })}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1" aria-live="polite">
        {save.isPending ? (
          <p className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving draft…
          </p>
        ) : save.isError ? (
          <p className="flex items-start gap-1.5 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> Draft not saved: {errorMessage(save.error)} It’s retried when you edit again.
          </p>
        ) : savedAt ? (
          <p className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Draft saved at {new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
        ) : null}
        <p>It’s issued to the patient and saved to the visit when you end the consultation.</p>
      </div>
    </div>
  );
};
