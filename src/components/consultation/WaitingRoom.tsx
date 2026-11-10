import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CameraOff, Loader2, Lock, Mic, MicOff, RefreshCw, Video } from 'lucide-react';

import { mediaErrorMessage, type JoinOptions } from '../../video/callSession';

interface Props {
  title: string;
  subtitle: string;
  joinLabel: string;
  /** Who else is in the room, for the privacy notice. */
  counterpart: 'doctor' | 'patient';
  canJoin: boolean;
  blockedReason?: string | null;
  joining: boolean;
  joinError?: string | null;
  onJoin: (opts: JoinOptions) => void;
}

type PermissionState = 'checking' | 'granted' | 'denied' | 'unsupported';

/**
 * Pre-call screen: camera/microphone preview, device choice, permission problems and the
 * privacy notice. The preview stream is released before the call starts.
 */
export const WaitingRoom: React.FC<Props> = ({ title, subtitle, joinLabel, counterpart, canJoin, blockedReason, joining, joinError, onJoin }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const [access, setAccess] = useState<PermissionState>('checking');
  const permission: PermissionState = supported ? access : 'unsupported';
  const [mediaError, setMediaError] = useState<string | null>(null);
  /** Bumped by "Try again" to re-request devices. */
  const [attempt, setAttempt] = useState(0);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState<string>('');
  const [micId, setMicId] = useState<string>('');
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Camera/microphone preview: an external resource, so it lives in an effect that releases it.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    const adopt = (stream: MediaStream) => {
      // Unmounted (or devices changed) while the browser was asking: release immediately.
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      return true;
    };
    const audio = micId ? { deviceId: { exact: micId } } : true;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio,
          video: cameraId ? { deviceId: { exact: cameraId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!adopt(stream)) return;
        setHasVideo(stream.getVideoTracks().length > 0);
        setMediaError(null);
        setAccess('granted');
      } catch (err) {
        // The camera may be missing or blocked while the microphone works: fall back to audio only.
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio });
          if (!adopt(audioOnly)) return;
          setHasVideo(false);
          setCameraOn(false);
          setAccess('granted');
          setMediaError(`Camera unavailable: ${mediaErrorMessage(err)} You can still join with audio.`);
        } catch (audioErr) {
          if (cancelled) return;
          setAccess('denied');
          setMediaError(mediaErrorMessage(audioErr));
        }
      }
      // Device labels are only available once permission is granted.
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setCameras(devices.filter((d) => d.kind === 'videoinput' && d.deviceId));
        setMics(devices.filter((d) => d.kind === 'audioinput' && d.deviceId));
      } catch {
        // Device lists are a convenience; defaults still work.
      }
    })();
    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [supported, cameraId, micId, attempt, stopPreview]);

  const retry = () => {
    setMediaError(null);
    setAccess('checking');
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
  }, [cameraOn, hasVideo]);
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn, permission]);

  const blocked = permission === 'denied' || permission === 'unsupported';

  const join = () => {
    stopPreview();
    onJoin({
      micEnabled: micOn && !blocked,
      cameraEnabled: cameraOn && hasVideo && !blocked,
      audioDeviceId: micId || undefined,
      videoDeviceId: cameraId || undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-3">
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-card">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover -scale-x-100 ${cameraOn && hasVideo ? '' : 'invisible'}`} />
          {!(cameraOn && hasVideo) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
              {permission === 'checking' ? <Loader2 className="w-8 h-8 animate-spin" /> : <CameraOff className="w-10 h-10" />}
              <span className="text-xs font-semibold">
                {permission === 'checking' ? 'Starting camera…' : hasVideo ? 'Camera is off' : 'No camera'}
              </span>
            </div>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMicOn((v) => !v)}
              disabled={blocked}
              aria-pressed={!micOn}
              aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50 ${micOn ? 'bg-white/90 text-slate-900 hover:bg-white' : 'bg-rose-600 text-white'}`}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setCameraOn((v) => !v)}
              disabled={blocked || !hasVideo}
              aria-pressed={!cameraOn}
              aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50 ${cameraOn && hasVideo ? 'bg-white/90 text-slate-900 hover:bg-white' : 'bg-rose-600 text-white'}`}
            >
              {cameraOn && hasVideo ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mediaError && (
          <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{mediaError}</span>
            <button type="button" onClick={retry} className="inline-flex items-center gap-1 font-bold hover:underline shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}
        {permission === 'unsupported' && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            This browser can’t access a camera or microphone. Use a current version of Chrome, Edge, Firefox or Safari, over HTTPS.
          </div>
        )}

        {(cameras.length > 1 || mics.length > 1) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cameras.length > 1 && (
              <label className="text-xs font-semibold text-slate-700">
                Camera
                <select
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-brand-500"
                >
                  <option value="">Default camera</option>
                  {cameras.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mics.length > 1 && (
              <label className="text-xs font-semibold text-slate-700">
                Microphone
                <select
                  value={micId}
                  onChange={(e) => setMicId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-brand-500"
                >
                  <option value="">Default microphone</option>
                  {mics.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-5 self-start">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
            <Video className="w-3 h-3" /> Video consultation
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-800">Find a private, quiet place.</strong> Only you and your {counterpart} can
            join this room. The call is not recorded.
          </span>
        </div>

        {joinError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {joinError}
          </div>
        )}
        {!canJoin && blockedReason && <p className="text-xs font-semibold text-amber-700">{blockedReason}</p>}

        <button
          type="button"
          onClick={join}
          disabled={!canJoin || joining || permission === 'checking'}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
        >
          {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
          <span>{joining ? 'Connecting…' : joinLabel}</span>
        </button>
        {blocked && canJoin && (
          <p className="text-[11px] text-slate-500 text-center">
            You can still join without camera or microphone and fix permissions during the call.
          </p>
        )}
      </div>
    </div>
  );
};
