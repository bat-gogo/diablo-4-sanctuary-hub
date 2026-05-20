/** Build a Set-Cookie header value for the auth token. */
export function buildAuthCookie(token: string, maxAgeSeconds: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `token=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Build a Set-Cookie header value that clears the token cookie. */
export function buildClearAuthCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    'token=',
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

/** Attach a Set-Cookie header to an existing Response without copying the body. */
export function withCookie(response: Response, cookie: string): Response {
  response.headers.append('Set-Cookie', cookie);
  return response;
}
