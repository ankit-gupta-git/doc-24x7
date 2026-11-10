import {
  ConnectionState,
  DisconnectReason,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
} from 'livekit-client';

import type { ConsultationJoin } from '../api/contract';
import { DEMO_END_SIGNAL, DEMO_MODE } from '../demo/config';

/**
 * The one place the web app talks to the video SDK (LiveKit). Components see a small,
 * provider-neutral snapshot and a handful of commands, so swapping providers stays local.
 */

export type CallPhase =
  | 'connecting' // signalling + media negotiation
  | 'waiting' // in the room, the other participant isn't
  | 'in_call'
  | 'reconnecting'
  | 'ended' // left, or closed by the doctor / server
  | 'failed';

export type EndReason = 'left' | 'closed' | 'replaced' | 'removed' | 'network';

export interface CallSnapshot {
  phase: CallPhase;
  micEnabled: boolean;
  cameraEnabled: boolean;
  remotePresent: boolean;
  remoteName: string | null;
  remoteCameraOn: boolean;
  remoteMicOn: boolean;
  /** The other participant was here and dropped out (they may come back). */
  remoteLeft: boolean;
  endReason: EndReason | null;
  /** User-facing message for failures and device problems. */
  error: string | null;
}

export interface JoinOptions {
  audioDeviceId?: string;
  videoDeviceId?: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

const INITIAL: CallSnapshot = {
  phase: 'connecting',
  micEnabled: false,
  cameraEnabled: false,
  remotePresent: false,
  remoteName: null,
  remoteCameraOn: false,
  remoteMicOn: false,
  remoteLeft: false,
  endReason: null,
  error: null,
};

/** Maps getUserMedia / SDK device errors to something a patient can act on. */
export function mediaErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return 'Camera or microphone access was blocked. Allow access in your browser’s site settings (the icon next to the address bar), then try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'No camera or microphone was found. Connect one, or choose a different device.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera or microphone is being used by another app. Close it and try again.';
  }
  return 'We couldn’t start your camera or microphone.';
}

export class CallSession {
  private room: Room;
  private snapshot: CallSnapshot = INITIAL;
  private listeners = new Set<() => void>();
  private remoteVideoEl: HTMLVideoElement | null = null;
  private localVideoEl: HTMLVideoElement | null = null;
  private audioEls = new Map<string, HTMLMediaElement>();
  private leaving = false;
  private messageListeners = new Map<string, Set<(message: unknown) => void>>();
  private readonly remoteIdentity: string;
  private readonly credentials: ConsultationJoin;

  constructor(credentials: ConsultationJoin) {
    this.credentials = credentials;
    this.remoteIdentity = credentials.remoteIdentity;
    this.room = new Room({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true });
    this.bindEvents();
  }

  // ---------- Store (for useSyncExternalStore) ----------

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  private set(patch: Partial<CallSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((l) => l());
  }

  // ---------- Commands ----------

  async connect(opts: JoinOptions) {
    this.set({ ...INITIAL, phase: 'connecting' });
    try {
      await this.room.connect(this.credentials.serverUrl, this.credentials.token, { autoSubscribe: true });
    } catch {
      this.set({ phase: 'failed', error: 'We couldn’t connect to the consultation. Check your internet connection and try again.' });
      return;
    }
    // Media failures shouldn't end the call: the other side can still hear or see what works.
    await this.applyDevice('microphone', opts.micEnabled, opts.audioDeviceId);
    await this.applyDevice('camera', opts.cameraEnabled, opts.videoDeviceId);
    this.syncRemote();
  }

  private async applyDevice(kind: 'microphone' | 'camera', enabled: boolean, deviceId?: string) {
    try {
      if (kind === 'microphone') await this.room.localParticipant.setMicrophoneEnabled(enabled, deviceId ? { deviceId } : undefined);
      else await this.room.localParticipant.setCameraEnabled(enabled, deviceId ? { deviceId } : undefined);
    } catch (err) {
      this.set({ error: mediaErrorMessage(err) });
    }
    this.syncLocal();
  }

  async setMicEnabled(enabled: boolean) {
    await this.applyDevice('microphone', enabled);
  }

  async setCameraEnabled(enabled: boolean) {
    await this.applyDevice('camera', enabled);
  }

  async switchDevice(kind: 'audioinput' | 'videoinput', deviceId: string) {
    try {
      await this.room.switchActiveDevice(kind, deviceId);
    } catch (err) {
      this.set({ error: mediaErrorMessage(err) });
    }
  }

  /** `endForEveryone`: the doctor ended the consultation. The server closes the room; the demo has no server, so it tells the patient. */
  async leave(endForEveryone = false) {
    this.leaving = true;
    if (endForEveryone && DEMO_MODE && this.room.state === ConnectionState.Connected) {
      await this.room.localParticipant.publishData(new TextEncoder().encode(DEMO_END_SIGNAL), { reliable: true }).catch(() => undefined);
      // Give the video server a moment to forward it: disconnecting at once can drop it.
      await new Promise((r) => setTimeout(r, 600));
    }
    await this.room.disconnect(true);
    this.detachAll();
    this.set({ phase: 'ended', endReason: 'left' });
  }

  /**
   * Sends a small JSON message to the other participant over the call's encrypted data channel
   * (reliable and ordered). Messages are not stored by the video service. Returns false if it wasn't sent.
   */
  async sendMessage(topic: string, message: unknown): Promise<boolean> {
    if (this.room.state !== ConnectionState.Connected) return false;
    try {
      await this.room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(message)), { reliable: true, topic });
      return true;
    } catch {
      return false;
    }
  }

  /** Messages on `topic` from the other participant only (never from anyone else in the room). */
  onMessage(topic: string, listener: (message: unknown) => void): () => void {
    let set = this.messageListeners.get(topic);
    if (!set) this.messageListeners.set(topic, (set = new Set()));
    set.add(listener);
    return () => set.delete(listener);
  }

  clearError() {
    this.set({ error: null });
  }

  /** Where to render video. Passing null detaches (on unmount). */
  setLocalVideoElement(el: HTMLVideoElement | null) {
    this.localVideoEl = el;
    this.syncLocal();
  }

  setRemoteVideoElement(el: HTMLVideoElement | null) {
    this.remoteVideoEl = el;
    this.syncRemote();
  }

  // ---------- Internals ----------

  private remote(): RemoteParticipant | undefined {
    // Demo mode ('*'): whoever else is in the room is the counterpart.
    if (this.remoteIdentity === '*') return this.room.remoteParticipants.values().next().value;
    // Only the expected participant is rendered, even if the server ever let someone else in.
    return this.room.remoteParticipants.get(this.remoteIdentity);
  }

  private isRemote(p: RemoteParticipant) {
    return this.remoteIdentity === '*' || p.identity === this.remoteIdentity;
  }

  private syncLocal() {
    const lp = this.room.localParticipant;
    const cam = lp.getTrackPublication(Track.Source.Camera)?.videoTrack;
    if (this.localVideoEl && cam && !cam.isMuted) cam.attach(this.localVideoEl);
    else if (this.localVideoEl) this.localVideoEl.srcObject = null;
    this.set({ micEnabled: lp.isMicrophoneEnabled, cameraEnabled: lp.isCameraEnabled });
  }

  private syncRemote() {
    const p = this.remote();
    const camPub = p?.getTrackPublication(Track.Source.Camera);
    const micPub = p?.getTrackPublication(Track.Source.Microphone);
    const cam = camPub?.videoTrack;
    if (this.remoteVideoEl) {
      if (cam && !camPub?.isMuted) cam.attach(this.remoteVideoEl);
      else this.remoteVideoEl.srcObject = null;
    }
    const connected = this.room.state === ConnectionState.Connected;
    this.set({
      remotePresent: !!p,
      remoteName: p?.name || null,
      remoteCameraOn: !!cam && !camPub?.isMuted,
      remoteMicOn: !!micPub?.track && !micPub.isMuted,
      ...(p ? { remoteLeft: false } : {}),
      ...(connected ? { phase: p ? 'in_call' : 'waiting' } : {}),
    });
  }

  private attachAudio(track: RemoteTrack, participant: RemoteParticipant) {
    if (track.kind !== Track.Kind.Audio || !this.isRemote(participant)) return;
    const el = track.attach();
    el.style.display = 'none';
    document.body.appendChild(el);
    this.audioEls.set(track.sid ?? String(Math.random()), el);
  }

  private detachAll() {
    for (const el of this.audioEls.values()) el.remove();
    this.audioEls.clear();
    if (this.remoteVideoEl) this.remoteVideoEl.srcObject = null;
    if (this.localVideoEl) this.localVideoEl.srcObject = null;
  }

  private bindEvents() {
    const r = this.room;
    r.on(RoomEvent.Connected, () => this.syncRemote())
      .on(RoomEvent.ParticipantConnected, () => this.syncRemote())
      .on(RoomEvent.ParticipantDisconnected, (p) => {
        if (this.isRemote(p)) this.set({ remoteLeft: true });
        this.syncRemote();
      })
      .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        this.attachAudio(track, participant);
        this.syncRemote();
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
        if (track.sid) this.audioEls.delete(track.sid);
        this.syncRemote();
      })
      .on(RoomEvent.TrackMuted, () => {
        this.syncRemote();
        this.syncLocal();
      })
      .on(RoomEvent.TrackUnmuted, () => {
        this.syncRemote();
        this.syncLocal();
      })
      .on(RoomEvent.LocalTrackPublished, () => this.syncLocal())
      .on(RoomEvent.LocalTrackUnpublished, () => this.syncLocal())
      .on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
        if (!participant || !this.isRemote(participant)) return;
        if (topic) {
          const listeners = this.messageListeners.get(topic);
          if (!listeners?.size) return;
          let message: unknown;
          try {
            message = JSON.parse(new TextDecoder().decode(payload));
          } catch {
            return;
          }
          listeners.forEach((l) => l(message));
          return;
        }
        if (!DEMO_MODE) return;
        if (new TextDecoder().decode(payload) !== DEMO_END_SIGNAL) return;
        this.leaving = true;
        void this.room.disconnect(true);
        this.detachAll();
        this.set({ phase: 'ended', endReason: 'closed' });
      })
      .on(RoomEvent.MediaDevicesError, (err) => this.set({ error: mediaErrorMessage(err) }))
      .on(RoomEvent.Reconnecting, () => this.set({ phase: 'reconnecting' }))
      .on(RoomEvent.Reconnected, () => this.syncRemote())
      .on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        this.detachAll();
        if (this.leaving) return;
        const endReason: EndReason =
          reason === DisconnectReason.ROOM_DELETED
            ? 'closed'
            : reason === DisconnectReason.DUPLICATE_IDENTITY
              ? 'replaced'
              : reason === DisconnectReason.PARTICIPANT_REMOVED
                ? 'removed'
                : reason === DisconnectReason.CLIENT_INITIATED
                  ? 'left'
                  : 'network';
        this.set({ phase: endReason === 'network' ? 'failed' : 'ended', endReason, ...(endReason === 'network' ? { error: 'The connection was lost.' } : {}) });
      });
  }
}
