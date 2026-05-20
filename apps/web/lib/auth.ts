import { SignJWT, jwtVerify } from 'jose';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  iat?: number;
  exp?: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

const JWT_ALG = 'HS256';
const JWT_EXPIRES_IN = '7d';

/**
 * Sign a JWT for the given payload. Uses `jose` so the same helpers work in
 * Next.js Route Handlers (Node runtime) and middleware (Edge runtime).
 */
export async function signToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecret());
}

/**
 * Verify a JWT and return the payload. Returns null on any error — never throws.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALG],
    });
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }
    const role = payload.role as JwtPayload['role'];
    if (role !== 'guest' && role !== 'user' && role !== 'admin') {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      role,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/** Read Authorization: Bearer <token> header OR the `token` cookie. */
export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    if (token.length > 0) return token;
  }
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === 'token') {
        return decodeURIComponent(rest.join('='));
      }
    }
  }
  return null;
}

/** Get the authenticated user, or null. */
export async function getAuthUser(
  request: Request,
): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Returns the authenticated payload, or throws a Response with 401 JSON.
 * Use inside a try/catch in route handlers that rethrow `Response` instances.
 */
export async function requireAuth(request: Request): Promise<JwtPayload> {
  const payload = await getAuthUser(request);
  if (!payload) {
    throw Response.json(
      { data: null, error: 'Unauthorized' },
      { status: 401 },
    );
  }
  return payload;
}

/** Like requireAuth, plus a role check. Throws 403 on mismatch. */
export async function requireRole(
  request: Request,
  role: 'admin',
): Promise<JwtPayload> {
  const payload = await requireAuth(request);
  if (payload.role !== role) {
    throw Response.json(
      { data: null, error: 'Forbidden' },
      { status: 403 },
    );
  }
  return payload;
}
