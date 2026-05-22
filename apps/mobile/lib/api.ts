import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API base URL discovery:
 * 1. EXPO_PUBLIC_API_URL — production-style override (set at build time).
 * 2. Expo dev host — when running via Expo Go / dev client, derive the host
 *    machine's LAN IP from `expoConfig.hostUri` so a phone on the same WiFi
 *    can reach the Next.js dev server.
 * 3. Per-platform fallback: Android emulator can't see "localhost" (that's
 *    the emulator itself), but 10.0.2.2 is its alias for the host.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export const API_URL = resolveApiUrl();

export type ApiEnvelope<T> = { data: T; error: string | null };

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
}

/** Thin typed fetch wrapper. Throws on non-2xx or { error }. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, body, headers, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({ data: null, error: `HTTP ${res.status}` } as ApiEnvelope<T>);
  if (!res.ok || json.error) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json.data;
}
