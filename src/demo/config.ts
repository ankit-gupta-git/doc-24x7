/**
 * Frontend-only demo mode, for showing DocPulse without the API server.
 * Enable with VITE_DEMO_MODE=true (see frontend/.env.example and DEMO.md).
 *
 * Everything here is public: Vite inlines VITE_* values into the JavaScript bundle.
 * Never put a server secret (such as a LiveKit API secret) in a VITE_* variable.
 */
const env = import.meta.env;

export const DEMO_MODE = env.VITE_DEMO_MODE === 'true';

/** Password shared by the demo accounts. Not a security boundary: demo data lives in the visitor's browser. */
export const DEMO_PASSWORD = (env.VITE_DEMO_PASSWORD as string | undefined) || 'Demo@1234';

/**
 * LiveKit Cloud "development token server" id (project Settings → Development token server).
 * It issues room tokens without a backend; LiveKit marks it for development and demos only.
 */
export const DEMO_TOKEN_SERVER_ID = (env.VITE_LIVEKIT_TOKEN_SERVER_ID as string | undefined) || '';

/** Prefix for demo room names; change it to give your demo its own rooms. */
export const DEMO_ROOM_PREFIX = (env.VITE_DEMO_ROOM_PREFIX as string | undefined) || 'docpulse-demo';

/** Data message the doctor sends so the patient's call ends too (no server to close the room). */
export const DEMO_END_SIGNAL = 'docpulse:consultation-ended';
