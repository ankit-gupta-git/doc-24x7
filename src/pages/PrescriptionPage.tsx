import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileX2, Printer } from 'lucide-react';

import { ApiError } from '../api/client';
import { usePrescription } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { PrescriptionView } from '../components/prescription/PrescriptionView';
import { useAuth } from '../context/auth';

/** A visit's prescription, ready to print or save as PDF from the browser. */
export const PrescriptionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const query = usePrescription(id);
  const list = role === 'doctor' ? '/doctor/appointments' : role === 'admin' ? '/admin/appointments' : '/patient/appointments';

  let body: React.ReactNode;
  if (query.isPending) body = <LoadingState label="Loading prescription…" />;
  else if (query.isError) {
    body =
      query.error instanceof ApiError && query.error.status === 404 ? (
        <Empty title="Prescription not found" message="This visit doesn’t exist, or it belongs to another account." />
      ) : (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      );
  } else if (!query.data) {
    body = <Empty title="No prescription for this visit" message="The doctor didn’t issue a prescription during this consultation." />;
  } else {
    const rx = query.data;
    body = (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
        <PrescriptionView rx={rx} meta={rx} status={rx.status} issuedAt={rx.issuedAt} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4 print:max-w-none print:p-0">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link to={list} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to appointments
        </Link>
        {query.data && (
          <button
            type="button"
            onClick={() => window.print()}
            className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print or save as PDF
          </button>
        )}
      </div>
      {body}
    </div>
  );
};

const Empty: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-8 text-center space-y-2">
    <FileX2 className="w-8 h-8 text-slate-400 mx-auto" />
    <h1 className="text-lg font-black text-slate-900">{title}</h1>
    <p className="text-sm text-slate-600">{message}</p>
  </div>
);
