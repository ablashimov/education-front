import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, ensureCsrfCookie } from '@/lib/api';

export interface BackendRole {
  id: number;
  name: string;
  title?: string | null;
}

export interface BackendOrganization {
  id: number;
  name: string;
  status_id: number;
}

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  rank?: string | null;
  status_id?: number | null;
  email_verified_at: string | null;
  last_login_at?: string | null;
  organization?: BackendOrganization | null;
  roles?: BackendRole[];
  created_at?: string;
  updated_at?: string;
}

export type AuthRole = 'admin' | 'user';

type ApiResource<T> = { data: T };

function unwrapResource<T>(payload: ApiResource<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResource<T>).data;
  }
  return payload as T;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  organizationId: number | null;
  raw: BackendUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  hasTriedRestore: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapBackendUser(user: BackendUser): AuthUser {
  const roles = user.roles ?? [];
  const normalizedRole: AuthRole = roles.some((role) => role.name?.toLowerCase().includes('admin'))
    ? 'admin'
    : 'user';

  const emailVerifiedAt = user.email_verified_at ?? null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizedRole,
    emailVerified: emailVerifiedAt !== null,
    emailVerifiedAt,
    organizationId: user.organization?.id ?? null,
    raw: user,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedRestore, setHasTriedRestore] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await apiClient.get<ApiResource<BackendUser>>('/user');
      setUser(mapBackendUser(unwrapResource(data)));
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchCurrentUser();
      } catch (error) {
        // Ignore 401 during bootstrap
      } finally {
        setHasTriedRestore(true);
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    await ensureCsrfCookie();
    const { data } = await apiClient.post<ApiResource<BackendUser>>('/login', { email, password });
    setUser(mapBackendUser(unwrapResource(data)));
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, hasTriedRestore, login, logout, refreshUser }),
    [user, isLoading, hasTriedRestore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
