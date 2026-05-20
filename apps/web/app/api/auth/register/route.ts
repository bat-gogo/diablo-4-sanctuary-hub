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
import { registerSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? 'Validation failed';
    return err(message, 400);
  }
  const { battletag, email, password } = parsed.data;

  const existingByEmail = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existingByEmail.length > 0) {
    return err('Email already in use', 409);
  }

  const existingByTag = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.battletag, battletag))
    .limit(1);
  if (existingByTag.length > 0) {
    return err('Battletag already taken', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({
      battletag,
      email,
      passwordHash,
      role: 'user',
    })
    .returning({
      id: schema.users.id,
      battletag: schema.users.battletag,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return withCookie(
    ok({ user, token }, 201),
    buildAuthCookie(token, AUTH_COOKIE_MAX_AGE),
  );
}
