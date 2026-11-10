import React from 'react';
import { CalendarCheck, Pill } from 'lucide-react';

import type { Prescription, PrescriptionInput } from '../../api/contract';
import { BrandMark } from '../common/BrandLogo';
import { formatDateKey } from '../common/format';

/** Header details, available on both an Appointment and a Prescription. */
export type RxMeta = Pick<Prescription, 'doctorName' | 'doctorSpecialty' | 'clinicName' | 'clinicAddress' | 'patientName' | 'appointmentDate' | 'bookingRef'>;

interface Props {
  rx: PrescriptionInput;
  meta: RxMeta;
  /** 'live': being written right now; 'draft': saved but not issued; 'issued': final. */
  status: 'live' | 'draft' | 'issued';
  issuedAt?: string | null;
}

const STATUS = {
  live: { label: 'Live · being written', className: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500 motion-safe:animate-pulse' },
  draft: { label: 'Draft', className: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  issued: { label: 'Issued', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

/** The prescription as the patient sees it: during the call, after it, and when printed. */
export const PrescriptionView: React.FC<Props> = ({ rx, meta, status, issuedAt }) => {
  const badge = STATUS[status];
  const medicines = rx.medicines.filter((m) => m.name.trim());
  return (
    <article className="bg-white text-slate-800 text-sm">
      <header className="flex items-start justify-between gap-3 pb-3 border-b-2 border-brand-600">
        <div className="min-w-0">
          <p className="font-black text-base text-slate-900 truncate">{meta.doctorName}</p>
          <p className="text-xs text-slate-600">{meta.doctorSpecialty}</p>
          <p className="text-[11px] text-slate-500 truncate">{meta.clinicName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="flex items-center gap-1 text-brand-700 font-extrabold text-xs">
            <BrandMark className="w-5 h-5" /> Doctor 24×7
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 py-3 text-xs border-b border-slate-100">
        <div>
          <dt className="text-slate-500">Patient</dt>
          <dd className="font-semibold text-slate-900">{meta.patientName}</dd>
        </div>
        <div className="text-right">
          <dt className="text-slate-500">Date · Ref</dt>
          <dd className="font-semibold text-slate-900">
            {formatDateKey(meta.appointmentDate)} · <span className="whitespace-nowrap">{meta.bookingRef}</span>
          </dd>
        </div>
      </dl>

      <section className="py-3 space-y-1">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Diagnosis</h3>
        <p className={rx.diagnosis.trim() ? 'font-semibold text-slate-900 whitespace-pre-wrap' : 'text-slate-400 italic'}>
          {rx.diagnosis.trim() || 'Not added yet'}
        </p>
      </section>

      <section className="py-3 space-y-2">
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <span className="font-serif text-2xl leading-none text-brand-700 normal-case" aria-hidden>
            ℞
          </span>
          Medicines
        </h3>
        {medicines.length === 0 ? (
          <p className="text-slate-400 italic">No medicines added yet</p>
        ) : (
          <ol className="space-y-2">
            {medicines.map((m, i) => (
              <li key={i} className="flex gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 break-inside-avoid">
                <span className="w-6 h-6 shrink-0 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 break-words">
                    {m.name} {m.dosage && <span className="font-semibold text-slate-600">{m.dosage}</span>}
                  </p>
                  {[m.frequency, m.duration, m.instructions].some(Boolean) && (
                    <p className="text-xs text-slate-600 break-words">{[m.frequency, m.duration, m.instructions].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {rx.advice.trim() && (
        <section className="py-3 space-y-1 border-t border-slate-100">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Advice</h3>
          <p className="whitespace-pre-wrap break-words">{rx.advice.trim()}</p>
        </section>
      )}

      {rx.followUpDate && (
        <p className="mt-1 flex items-center gap-2 p-2.5 rounded-xl bg-brand-50 text-brand-800 text-xs font-semibold">
          <CalendarCheck className="w-4 h-4 shrink-0" /> Follow-up on {formatDateKey(rx.followUpDate)}
        </p>
      )}

      <footer className="mt-4 pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
        <Pill className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {status === 'issued'
            ? `Issued by ${meta.doctorName} after an online consultation${issuedAt ? ` on ${new Date(issuedAt).toLocaleString()}` : ''}. Take medicines only as prescribed, and contact your doctor if symptoms get worse.`
            : 'This prescription isn’t final yet. It’s saved to your visit when the doctor ends the consultation.'}
        </span>
      </footer>
    </article>
  );
};
