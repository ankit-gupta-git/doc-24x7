import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarClock, CheckCircle2, FileText, PhoneOff, RotateCcw, Video, XCircle } from 'lucide-react';

import { ApiError, errorMessage } from '../api/client';
import type { Appointment, Consultation, Prescription, PrescriptionInput } from '../api/contract';
import { qk, useAppointment, useConsultation, useEndConsultation, useJoinConsultation, useSavePrescription } from '../api/hooks';
import { ErrorState, LoadingState } from '../components/common/QueryState';
import { formatDateKey } from '../components/common/format';
import { ConfirmModal } from '../components/portal/PortalUI';
import { ConsultationStatus } from '../components/consultation/ConsultationStatus';
import { VideoConsultationRoom } from '../components/consultation/VideoConsultationRoom';
import { WaitingRoom } from '../components/consultation/WaitingRoom';
import { formatCountdown, useServerCountdown } from '../components/consultation/useServerCountdown';
import { LivePrescription } from '../components/prescription/LivePrescription';
import { PrescriptionPad } from '../components/prescription/PrescriptionPad';
import { PrescriptionView } from '../components/prescription/PrescriptionView';
import { RX_TOPIC, cleanPrescription, emptyPrescription, isBlank, parseLiveMessage, type LiveRxMessage } from '../components/prescription/rx';
import { useAuth } from '../context/auth';
import { DEMO_MODE } from '../demo/config';
import { CallSession, type JoinOptions } from '../video/callSession';

export const ConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appointmentQuery = useAppointment(id);
  const appointment = appointmentQuery.data;
  const consultationQuery = useConsultation(id, appointment?.consultationMode === 'online');

  const back = (
    <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600">
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </Link>
  );

  let body: React.ReactNode;
  if (appointmentQuery.isPending || (appointment?.consultationMode === 'online' && consultationQuery.isPending)) {
    body = <LoadingState label="Loading consultation…" />;
  } else if (appointmentQuery.isError) {
    const notFound = appointmentQuery.error instanceof ApiError && appointmentQuery.error.status === 404;
    body = notFound ? (
      <Notice icon={<XCircle className="w-8 h-8 text-rose-500" />} title="Consultation not found" message="It doesn’t exist, or it belongs to another account." />
    ) : (
      <ErrorState error={appointmentQuery.error} onRetry={() => void appointmentQuery.refetch()} />
    );
  } else if (appointment && appointment.consultationMode !== 'online') {
    body = <Notice icon={<CalendarClock className="w-8 h-8 text-slate-500" />} title="This is a clinic visit" message="It takes place in person, so there’s no video room." />;
  } else if (consultationQuery.isError) {
    body = <ErrorState error={consultationQuery.error} onRetry={() => void consultationQuery.refetch()} />;
  } else if (appointment && consultationQuery.data) {
    // Keyed so a new appointment id never reuses a call session.
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        <BackLink />
        <Consult key={appointment.id} appointment={appointment} consultation={consultationQuery.data} fetchedAt={consultationQuery.dataUpdatedAt} />
      </div>
    );
  }

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">{back}{body}</div>;
};

const BackLink: React.FC = () => {
  const { role } = useAuth();
  return (
    <Link
      to={role === 'doctor' ? '/doctor/appointments' : '/patient/appointments'}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to appointments</span>
    </Link>
  );
};

const Notice: React.FC<{ icon: React.ReactNode; title: string; message?: string; children?: React.ReactNode }> = ({ icon, title, message, children }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-8 text-center max-w-lg mx-auto space-y-3">
    <div className="flex justify-center">{icon}</div>
    <h2 className="text-lg font-black text-slate-900">{title}</h2>
    {message && <p className="text-sm text-slate-600">{message}</p>}
    {children && <div className="pt-2 flex flex-wrap gap-3 justify-center">{children}</div>}
  </div>
);

type Stage = 'lobby' | 'call' | 'done';

const Consult: React.FC<{ appointment: Appointment; consultation: Consultation; fetchedAt: number }> = ({ appointment, consultation, fetchedAt }) => {
  const { role } = useAuth();
  const isDoctor = role === 'doctor';
  const join = useJoinConsultation();
  const end = useEndConsultation();
  const [stage, setStage] = useState<Stage>('lobby');
  const [session, setSession] = useState<CallSession | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const remaining = useServerCountdown(consultation, fetchedAt);
  const qc = useQueryClient();
  const issue = useSavePrescription();
  // Doctor: the prescription being written, and the issued one. Patient: what the doctor last sent.
  const [draft, setDraft] = useState<PrescriptionInput>(emptyPrescription);
  const [issued, setIssued] = useState<Prescription | null>(null);
  const [liveRx, setLiveRx] = useState<LiveRxMessage | null>(null);

  // Leave the room when navigating away or closing the tab.
  useEffect(() => {
    if (!session) return;
    return () => void session.leave();
  }, [session]);

  // Patient: follow the prescription as the doctor writes it.
  useEffect(() => {
    if (!session || isDoctor) return;
    return session.onMessage(RX_TOPIC, (raw) => {
      const msg = parseLiveMessage(raw);
      if (!msg || (msg.type === 'issued' && msg.prescription.appointmentId !== appointment.id)) return;
      setLiveRx(msg);
      if (msg.type === 'issued') {
        // The real API already saved it. The demo has no server, so this browser keeps its own copy.
        const kept = DEMO_MODE ? import('../demo/mockApi').then((m) => m.demoReceivePrescription(msg.prescription)) : Promise.resolve();
        void kept.then(() => qc.invalidateQueries({ queryKey: qk.prescription(appointment.id) }));
      }
    });
  }, [session, isDoctor, appointment.id, qc]);

  const counterpart = isDoctor ? appointment.patientName : appointment.doctorName;
  const when = `${formatDateKey(appointment.appointmentDate)} at ${appointment.timeSlot} (${appointment.timezone.replace(/_/g, ' ')})`;

  const handleJoin = async (opts: JoinOptions) => {
    try {
      const credentials = await join.mutateAsync(appointment.id);
      const next = new CallSession(credentials);
      setSession(next);
      setStage('call');
      await next.connect(opts);
    } catch {
      // Shown by the waiting room via join.error.
    }
  };

  const handleEnd = async () => {
    if (!session) return;
    if (isDoctor) {
      try {
        // Issue the prescription first, so it's saved before the visit closes.
        if (!issued && !isBlank(draft)) {
          const rx = await issue.mutateAsync({ appointmentId: appointment.id, ...cleanPrescription(draft), issue: true });
          setIssued(rx);
          const message: LiveRxMessage = { type: 'issued', prescription: rx };
          await session.sendMessage(RX_TOPIC, message);
        }
        await end.mutateAsync(appointment.id);
      } catch {
        return; // Error shown in the dialog; the call continues.
      }
    }
    setConfirmEnd(false);
    await session.leave(isDoctor);
    setStage('done');
  };

  if (stage === 'call' && session) {
    return (
      <>
        <CallWatcher session={session} onEnded={() => setStage('done')} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
          <VideoConsultationRoom
            session={session}
            remoteLabel={counterpart}
            endLabel={isDoctor ? 'End consultation' : 'Leave call'}
            onEnd={() => (isDoctor ? setConfirmEnd(true) : void handleEnd())}
            ending={issue.isPending || end.isPending}
          />
          <aside
            aria-label="Prescription"
            className="rounded-3xl bg-white border border-slate-200 shadow-card overflow-y-auto lg:h-[calc(100dvh-9rem)] lg:min-h-[28rem]"
          >
            {isDoctor ? (
              <PrescriptionPad session={session} appointment={appointment} draft={draft} onChange={setDraft} issued={issued} onIssuedFound={setIssued} />
            ) : (
              <LivePrescription appointment={appointment} live={liveRx} />
            )}
          </aside>
        </div>
        <ConfirmModal
          open={confirmEnd}
          title="End the consultation for both of you?"
          message={`${
            issued || isBlank(draft)
              ? ''
              : 'The prescription is issued to the patient and saved to this visit. '
          }The patient is disconnected and the visit is marked as completed. To step away briefly instead, close this tab: you can rejoin while the room is open.`}
          tone="danger"
          confirmLabel="End consultation"
          pending={issue.isPending || end.isPending}
          error={issue.error ?? end.error}
          onClose={() => setConfirmEnd(false)}
          onConfirm={() => void handleEnd()}
        />
      </>
    );
  }

  if (stage === 'done' && session) {
    const rx = isDoctor ? issued : liveRx?.type === 'issued' ? liveRx.prescription : null;
    return <AfterCall session={session} isDoctor={isDoctor} counterpart={counterpart} rx={rx} onRejoin={() => setStage('lobby')} />;
  }

  // Lobby: anything other than an open room explains itself here.
  if (consultation.status === 'cancelled' || consultation.status === 'ended' || consultation.status === 'missed') {
    const icon =
      consultation.status === 'ended' ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-rose-500" />;
    return (
      <Notice icon={icon} title={consultation.joinBlockedReason ?? 'This consultation is closed.'} message={`${counterpart} · ${when}`}>
        <ConsultationStatus status={consultation.status} />
      </Notice>
    );
  }

  const blocked =
    remaining !== null && remaining > 0 ? `The room opens in ${formatCountdown(remaining)}. You can test your camera and microphone now.` : consultation.joinBlockedReason;
  return (
    <WaitingRoom
      title={isDoctor ? `Consultation with ${appointment.patientName}` : `Consultation with ${appointment.doctorName}`}
      subtitle={`${when}${isDoctor ? ` · Reason: ${appointment.reason}` : ` · ${appointment.doctorSpecialty}`}`}
      joinLabel={isDoctor && consultation.status === 'open' ? 'Start consultation' : 'Join consultation'}
      counterpart={isDoctor ? 'patient' : 'doctor'}
      canJoin={consultation.canJoin}
      blockedReason={blocked}
      joining={join.isPending}
      joinError={join.error ? errorMessage(join.error) : null}
      onJoin={(opts) => void handleJoin(opts)}
    />
  );
};

/** Moves to the summary when the call ends on its own (doctor ended it, connection lost, joined elsewhere). */
const CallWatcher: React.FC<{ session: CallSession; onEnded: () => void }> = ({ session, onEnded }) => {
  const s = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const finished = s.phase === 'ended' || s.phase === 'failed';
  useEffect(() => {
    if (finished) onEnded();
  }, [finished, onEnded]);
  return null;
};

const AfterCall: React.FC<{ session: CallSession; isDoctor: boolean; counterpart: string; rx: Prescription | null; onRejoin: () => void }> = ({
  session,
  isDoctor,
  counterpart,
  rx,
  onRejoin,
}) => {
  const s = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const list = isDoctor ? '/doctor/appointments' : '/patient/appointments';

  if (s.endReason === 'closed' || (isDoctor && s.endReason === 'left')) {
    const saved = rx ? (isDoctor ? ' The prescription was issued and saved to the visit.' : ' Your prescription is saved to this visit.') : '';
    return (
      <div className="space-y-4">
        <Notice
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-600" />}
          title="Consultation ended"
          message={(isDoctor ? 'The visit has been marked as completed.' : `${counterpart} ended the consultation. Thank you for using Doctor 24x7.`) + saved}
        >
          {rx && (
            <Link
              to={`/prescription/${rx.appointmentId}`}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Open prescription
            </Link>
          )}
          <Link to={list} className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold">
            Back to appointments
          </Link>
        </Notice>
        {rx && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-5 sm:p-6 max-w-lg mx-auto">
            <PrescriptionView rx={rx} meta={rx} status="issued" issuedAt={rx.issuedAt} />
          </div>
        )}
      </div>
    );
  }

  const title =
    s.phase === 'failed'
      ? 'The call was disconnected'
      : s.endReason === 'replaced'
        ? 'You joined from another tab or device'
        : s.endReason === 'removed'
          ? 'You were removed from the call'
          : 'You left the consultation';
  return (
    <Notice
      icon={s.phase === 'failed' ? <PhoneOff className="w-8 h-8 text-rose-500" /> : <Video className="w-8 h-8 text-slate-500" />}
      title={title}
      message={s.error ?? 'You can rejoin while the consultation room is open.'}
    >
      <button type="button" onClick={onRejoin} className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5">
        <RotateCcw className="w-4 h-4" /> Rejoin
      </button>
      <Link to={list} className="py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold">
        Back to appointments
      </Link>
    </Notice>
  );
};
