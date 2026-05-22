import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

const TOKEN_KEY = 'sanctuary_hub_token';

export interface AuthUser {
  id: string;
  battletag: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    battletag: string,
    email: string,
    password: string,
  ) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // Restore session on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) {
          if (!cancelled)
            setState({ user: null, token: null, isLoading: false });
          return;
        }
        const data = await api<{ user: AuthUser }>('/api/auth/me', { token });
        if (!cancelled) {
          setState({ user: data.user, token, isLoading: false });
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        if (!cancelled)
          setState({ user: null, token: null, isLoading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: AuthUser; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: { email, password },
      },
    );
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setState({ user: data.user, token: data.token, isLoading: false });
  }, []);

  const register = useCallback(
    async (battletag: string, email: string, password: string) => {
      const data = await api<{ user: AuthUser; token: string }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: { battletag, email, password },
        },
      );
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      setState({ user: data.user, token: data.token, isLoading: false });
    },
    [],
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setState({ user: null, token: null, isLoading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, logout, register }),
    [state, login, logout, register],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
