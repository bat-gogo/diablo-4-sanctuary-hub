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

const TOKEN_KEY = 'sanctuary_hub_token';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface AuthUser {
  id: string;
  battletag: string;
  email: string;
  role: string;
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

async function jsonRequest<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
  const json = (await res.json()) as { data: T; error: string | null };
  if (!res.ok || json.error) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json.data;
}

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
        const data = await jsonRequest<{ user: AuthUser }>(
          '/api/auth/me',
          { token },
        );
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
    const data = await jsonRequest<{ user: AuthUser; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setState({ user: data.user, token: data.token, isLoading: false });
  }, []);

  const register = useCallback(
    async (battletag: string, email: string, password: string) => {
      const data = await jsonRequest<{ user: AuthUser; token: string }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ battletag, email, password }),
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
