import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { signToken } from '@/lib/auth';
import {
  AUTH_COOKIE_MAX_AGE,
  buildAuthCookie,
  withCookie,
} from '@/lib/cookies';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? 'Validation failed';
    return err(message, 400);
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select({
      id: schema.users.id,
      battletag: schema.users.battletag,
      email: schema.users.email,
      role: schema.users.role,
      passwordHash: schema.users.passwordHash,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user) {
    return err('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return err('Invalid credentials', 401);
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const { passwordHash: _unused, ...publicUser } = user;
  void _unused;

  return withCookie(
    ok({ user: publicUser, token }),
    buildAuthCookie(token, AUTH_COOKIE_MAX_AGE),
  );
}
