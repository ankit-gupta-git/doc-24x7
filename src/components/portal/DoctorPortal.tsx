import React from 'react';
import { ShieldAlert } from 'lucide-react';

import { ApiError } from '../../api/client';
import type { Doctor, DoctorStats } from '../../api/contract';
import { useDoctorMe } from '../../api/hooks';
import { ErrorState, LoadingState } from './PortalUI';

export const PendingVerificationBanner: React.FC = () => (
  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3" role="status">
    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
    <div className="text-xs leading-relaxed">
      <p className="font-bold text-sm">Pending verification</p>
      <p>
        Your profile is hidden from patients until an administrator verifies it. You can set up your fee and schedule in the
        meantime.
      </p>
    </div>
  </div>
);

/**
 * Loads the signed-in doctor's profile and stats, handling the loading, error
 * and "no linked profile" states, and shows the pending-verification banner.
 */
export const DoctorPortal: React.FC<{ children: (data: { doctor: Doctor; stats: DoctorStats }) => React.ReactNode }> = ({ children }) => {
  const me = useDoctorMe();

  if (me.isPending) return <LoadingState label="Loading your practice…" />;
  if (me.isError) {
    const noProfile = me.error instanceof ApiError && (me.error.status === 403 || me.error.status === 404);
    return (
      <div className="max-w-4xl mx-auto px-4">
        <ErrorState
          error={me.error}
          title={noProfile ? 'No doctor profile is linked to this account' : 'Couldn’t load your practice'}
          onRetry={noProfile ? undefined : () => void me.refetch()}
        />
      </div>
    );
  }

  return (
    <>
      {!me.data.doctor.isVerified && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <PendingVerificationBanner />
        </div>
      )}
      {children(me.data)}
    </>
  );
};
