import { DEMO_MODE } from '../demo/config';
import type { ApiErrorBody, ApiErrorCode, AuthSession } from './contract';

/** Base URL of the DocPulse API. Override with VITE_API_URL in frontend/.env. */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, string>;

  constructor(status: number, code: ApiErrorCode, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Human-readable message for any thrown value (for toasts and inline errors). */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return 'Can’t reach the Doctor 24x7 server. Check your connection and try again.';
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ---------- Token storage ----------

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
}

const TOKENS_KEY = 'docpulse_auth_v1';

/**
 * Tokens live in localStorage so a session survives reloads. Access tokens are
 * short-lived (minutes) and refresh tokens rotate on every use and can be
 * revoked server-side, which limits the impact of a leaked token.
 */
const tokenStore = {
  read(): StoredTokens | null {
    try {
      const raw = localStorage.getItem(TOKENS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredTokens;
      return parsed.accessToken && parsed.refreshToken ? parsed : null;
    } catch {
      return null;
    }
  },
  write(t: StoredTokens | null) {
    try {
      if (t) localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
      else localStorage.removeItem(TOKENS_KEY);
    } catch {
      // Storage unavailable (private mode): the session lasts for this tab only.
    }
  },
};

let memoryTokens: StoredTokens | null = tokenStore.read();
const sessionListeners = new Set<() => void>();

export function setSession(session: AuthSession | null) {
  memoryTokens = session
    ? {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: Date.now() + session.expiresIn * 1000,
      }
    : null;
  tokenStore.write(memoryTokens);
}

export function hasStoredSession(): boolean {
  return memoryTokens !== null;
}

export function getRefreshToken(): string | null {
  return memoryTokens?.refreshToken ?? null;
}

/** Called when the session can't be refreshed any more (expired, revoked, account deactivated). */
export function onSessionExpired(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

// ---------- Requests ----------

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Send the access token. Defaults to true whenever a session exists. */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  // The base allows a same-origin API path such as "/api/v1" (demo mode behind the Vite proxy).
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function parseError(res: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // Non-JSON error (proxy, crash): fall through to a generic message.
  }
  const e = body?.error;
  return new ApiError(res.status, e?.code ?? 'INTERNAL', e?.message ?? `Request failed (${res.status})`, e?.details);
}

let refreshInFlight: Promise<boolean> | null = null;

/** Exchanges the refresh token for a new pair. Concurrent callers share one request. */
async function refreshSession(): Promise<boolean> {
  if (!memoryTokens) return false;
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: memoryTokens?.refreshToken }),
      });
      if (!res.ok) {
        setSession(null);
        sessionListeners.forEach((l) => l());
        return false;
      }
      setSession((await res.json()) as AuthSession);
      return true;
    } catch {
      // Network failure: keep the tokens so a later retry can succeed.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  // Frontend-only demo (VITE_DEMO_MODE=true): answered in the browser, nothing is sent to a server.
  if (DEMO_MODE) {
    const { demoRequest } = await import('../demo/mockApi');
    return demoRequest<T>(path, opts, memoryTokens?.accessToken);
  }
  const useAuth = opts.auth ?? true;

  // Refresh proactively when the access token is about to expire.
  if (useAuth && memoryTokens && memoryTokens.expiresAt - Date.now() < 15_000) await refreshSession();

  const send = () => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (useAuth && memoryTokens) headers.Authorization = `Bearer ${memoryTokens.accessToken}`;
    return fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  };

  let res = await send();
  if (res.status === 401 && useAuth && memoryTokens && (await refreshSession())) {
    res = await send();
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204 || res.status === 202) return undefined as T;
  return (await res.json()) as T;
}
