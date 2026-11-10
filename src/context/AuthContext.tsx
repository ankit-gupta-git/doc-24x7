import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getRefreshToken, hasStoredSession, onSessionExpired, setSession } from '../api/client';
import type { RegisterRequest, UpdateProfileRequest, User } from '../api/contract';
import { authApi } from '../api/endpoints';
import { AuthContext, type AuthContextType } from './auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>(hasStoredSession() ? 'loading' : 'ready');

  // Restore a stored session on load.
  useEffect(() => {
    if (!hasStoredSession()) return;
    let cancelled = false;
    authApi
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      })
      .finally(() => !cancelled && setStatus('ready'));
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client signals when a refresh fails (expired, revoked or deactivated account).
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        queryClient.clear();
      }),
    [queryClient],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login({ email, password });
      setSession(session);
      queryClient.clear();
      setUser(session.user);
      return session.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const session = await authApi.register(data);
      setSession(session);
      queryClient.clear();
      setUser(session.user);
      return session.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    setSession(null);
    setUser(null);
    queryClient.clear();
    // Revoke server-side; signing out locally must not depend on the network.
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
  }, [queryClient]);

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    const updated = await authApi.updateMe(data);
    setUser(updated);
    return updated;
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await authApi.me());
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      status,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, status, login, register, logout, updateProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
