import React, { useEffect, useState } from 'react';
import { Camera, CameraOff, Loader2, Mic, MicOff, PhoneOff, Settings2 } from 'lucide-react';

interface Props {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchDevice: (kind: 'audioinput' | 'videoinput', deviceId: string) => void;
  /** Patients leave; doctors end the consultation for both. */
  endLabel: string;
  onEnd: () => void;
  ending?: boolean;
  disabled?: boolean;
}

const roundBtn = 'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50';

export const ConsultationControls: React.FC<Props> = ({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onSwitchDevice,
  endLabel,
  onEnd,
  ending,
  disabled,
}) => {
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!showDevices || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((list) => setDevices(list.filter((d) => d.deviceId && (d.kind === 'audioinput' || d.kind === 'videoinput'))))
      .catch(() => setDevices([]));
  }, [showDevices]);

  return (
    <div className="relative flex items-center justify-center gap-3 sm:gap-4">
      <button
        type="button"
        onClick={onToggleMic}
        disabled={disabled}
        aria-pressed={!micEnabled}
        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        title={micEnabled ? 'Mute' : 'Unmute'}
        className={`${roundBtn} ${micEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white text-rose-600 hover:bg-rose-50'}`}
      >
        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
      <button
        type="button"
        onClick={onToggleCamera}
        disabled={disabled}
        aria-pressed={!cameraEnabled}
        aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
        title={cameraEnabled ? 'Camera off' : 'Camera on'}
        className={`${roundBtn} ${cameraEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white text-rose-600 hover:bg-rose-50'}`}
      >
        {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
      </button>
      <button
        type="button"
        onClick={() => setShowDevices((v) => !v)}
        disabled={disabled}
        aria-expanded={showDevices}
        aria-label="Choose camera and microphone"
        title="Devices"
        className={`${roundBtn} bg-slate-700 hover:bg-slate-600 text-white`}
      >
        <Settings2 className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onEnd}
        disabled={ending}
        className="h-12 sm:h-14 px-5 sm:px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-colors disabled:opacity-60"
      >
        {ending ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
        <span className="hidden sm:inline">{endLabel}</span>
        <span className="sr-only sm:hidden">{endLabel}</span>
      </button>

      {showDevices && (
        <div className="absolute bottom-full mb-3 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3 text-left z-10">
          {(['videoinput', 'audioinput'] as const).map((kind) => {
            const list = devices.filter((d) => d.kind === kind);
            return (
              <label key={kind} className="block text-xs font-semibold text-slate-700">
                {kind === 'videoinput' ? 'Camera' : 'Microphone'}
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && onSwitchDevice(kind, e.target.value)}
                  disabled={list.length === 0}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">{list.length ? 'Choose…' : 'No devices found'}</option>
                  {list.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `${kind === 'videoinput' ? 'Camera' : 'Microphone'} ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
