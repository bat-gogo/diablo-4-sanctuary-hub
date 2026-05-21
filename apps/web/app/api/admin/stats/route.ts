import { sql } from 'drizzle-orm';
import { builds, comments, partyRequests, users } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ok } from '@/lib/api';

export async function GET(request: Request) {
  try {
    await requireRole(request, 'admin');
  } catch (res) {
    return res as Response;
  }

  const [
    [{ users: userCount }],
    [{ builds: buildCount }],
    [{ open }],
    [{ comments: commentCount }],
    [{ views }],
  ] = await Promise.all([
    db.select({ users: sql<number>`COUNT(*)::int` }).from(users),
    db.select({ builds: sql<number>`COUNT(*)::int` }).from(builds),
    db
      .select({ open: sql<number>`COUNT(*)::int` })
      .from(partyRequests)
      .where(sql`${partyRequests.status} = 'open'`),
    db.select({ comments: sql<number>`COUNT(*)::int` }).from(comments),
    db.select({ views: sql<number>`COALESCE(SUM(${builds.views}), 0)::int` }).from(builds),
  ]);

  return ok({
    users: userCount,
    builds: buildCount,
    openParties: open,
    comments: commentCount,
    totalViews: views,
  });
}
