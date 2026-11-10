import { createContext, useContext } from 'react';

import type { RegisterRequest, UpdateProfileRequest, User, UserRole } from '../api/contract';

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  /** 'loading' while a stored session is being restored on page load. */
  status: 'loading' | 'ready';
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  /** Re-fetch the signed-in user (e.g. after an admin changes something). */
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/** Landing page for each role after signing in. */
export function roleHome(role: UserRole | null): string {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/patient/dashboard';
}
