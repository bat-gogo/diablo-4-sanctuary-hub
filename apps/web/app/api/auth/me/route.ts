import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  let payload;
  try {
    payload = await requireAuth(request);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const [user] = await db
    .select({
      id: schema.users.id,
      battletag: schema.users.battletag,
      email: schema.users.email,
      role: schema.users.role,
      avatarUrl: schema.users.avatarUrl,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, payload.userId))
    .limit(1);

  if (!user) {
    return err('User not found', 404);
  }
  return ok({ user });
}
