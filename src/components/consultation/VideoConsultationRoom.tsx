import React, { useCallback, useSyncExternalStore } from 'react';
import { AlertTriangle, Loader2, MicOff, UserRound, WifiOff, X } from 'lucide-react';

import type { CallSession } from '../../video/callSession';
import { ConsultationControls } from './ConsultationControls';

interface Props {
  session: CallSession;
  /** Shown before the other person's name arrives from the room. */
  remoteLabel: string;
  endLabel: string;
  onEnd: () => void;
  ending?: boolean;
}

/** The live call: remote video, local picture-in-picture, connection states and controls. */
export const VideoConsultationRoom: React.FC<Props> = ({ session, remoteLabel, endLabel, onEnd, ending }) => {
  const s = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const remoteRef = useCallback((el: HTMLVideoElement | null) => session.setRemoteVideoElement(el), [session]);
  const localRef = useCallback((el: HTMLVideoElement | null) => session.setLocalVideoElement(el), [session]);
  const name = s.remoteName ?? remoteLabel;

  let overlay: React.ReactNode = null;
  if (s.phase === 'connecting') {
    overlay = (
      <>
        <Loader2 className="w-9 h-9 animate-spin" />
        <p className="text-sm font-semibold">Connecting securely…</p>
      </>
    );
  } else if (s.phase === 'reconnecting') {
    overlay = (
      <>
        <WifiOff className="w-9 h-9" />
        <p className="text-sm font-semibold">Connection lost. Reconnecting…</p>
      </>
    );
  } else if (s.phase === 'waiting') {
    overlay = (
      <>
        <span className="relative flex w-16 h-16 items-center justify-center rounded-full bg-white/10">
          <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
          <UserRound className="w-8 h-8" />
        </span>
        <p className="text-sm font-semibold">{s.remoteLeft ? `${name} left the call` : `Waiting for ${name} to join…`}</p>
        <p className="text-xs text-slate-400 max-w-xs text-center">
          {s.remoteLeft ? 'They may have lost their connection. Stay here and they can rejoin.' : 'Stay on this page. The call starts as soon as they arrive.'}
        </p>
      </>
    );
  } else if (s.phase === 'in_call' && !s.remoteCameraOn) {
    overlay = (
      <>
        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-black">{name.replace(/^Dr\.\s*/, '').charAt(0)}</div>
        <p className="text-sm font-semibold">{name}’s camera is off</p>
      </>
    );
  }

  return (
    <div className="relative w-full h-[calc(100dvh-9rem)] min-h-[28rem] rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl">
      <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain bg-slate-950" />
      {overlay && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 px-6">{overlay}</div>}

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${s.phase === 'in_call' ? 'bg-emerald-400' : s.phase === 'reconnecting' ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
          <span>{name}</span>
          {s.phase === 'in_call' && !s.remoteMicOn && <MicOff className="w-3.5 h-3.5 text-rose-300" aria-label="Muted" />}
        </div>
      </div>

      {/* Local picture-in-picture */}
      <div className="absolute right-3 bottom-24 sm:bottom-28 w-28 sm:w-44 aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-white/20 shadow-xl">
        <video ref={localRef} autoPlay playsInline muted className={`w-full h-full object-cover -scale-x-100 ${s.cameraEnabled ? '' : 'hidden'}`} />
        {!s.cameraEnabled && <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-300">Camera off</div>}
        {!s.micEnabled && (
          <span className="absolute bottom-1.5 left-1.5 p-1 rounded-full bg-rose-600">
            <MicOff className="w-3 h-3" />
          </span>
        )}
      </div>

      {s.error && (
        <div role="alert" className="absolute top-14 left-3 right-3 sm:left-auto sm:w-96 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs flex items-start gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{s.error}</span>
          <button type="button" onClick={() => session.clearError()} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <ConsultationControls
          micEnabled={s.micEnabled}
          cameraEnabled={s.cameraEnabled}
          onToggleMic={() => void session.setMicEnabled(!s.micEnabled)}
          onToggleCamera={() => void session.setCameraEnabled(!s.cameraEnabled)}
          onSwitchDevice={(kind, id) => void session.switchDevice(kind, id)}
          endLabel={endLabel}
          onEnd={onEnd}
          ending={ending}
          disabled={s.phase === 'connecting'}
        />
      </div>
    </div>
  );
};
