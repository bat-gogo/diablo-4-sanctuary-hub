import { desc, eq, ilike, sql } from 'drizzle-orm';
import { builds, users } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ok } from '@/lib/api';

export async function GET(request: Request) {
  try {
    await requireRole(request, 'admin');
  } catch (res) {
    return res as Response;
  }
  const url = new URL(request.url);
  const search = url.searchParams.get('search');

  const rows = await db
    .select({
      id: users.id,
      battletag: users.battletag,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      buildCount: sql<number>`COUNT(${builds.id})::int`,
    })
    .from(users)
    .leftJoin(builds, eq(builds.userId, users.id))
    .where(search ? ilike(users.battletag, `%${search}%`) : undefined)
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(50);

  return ok({ users: rows });
}
