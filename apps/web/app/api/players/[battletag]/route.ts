import { desc, eq, ilike, sql } from 'drizzle-orm';
import {
  builds,
  characters,
  users,
  votes,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/api';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ battletag: string }> },
) {
  const { battletag: raw } = await params;
  const battletag = decodeURIComponent(raw);

  const [user] = await db
    .select({
      id: users.id,
      battletag: users.battletag,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(ilike(users.battletag, battletag))
    .limit(1);

  if (!user) return err('Player not found', 404);

  const [chars, [stats]] = await Promise.all([
    db
      .select()
      .from(characters)
      .where(eq(characters.userId, user.id))
      .orderBy(desc(characters.createdAt)),
    db
      .select({
        buildCount: sql<number>`COUNT(DISTINCT ${builds.id})::int`,
        totalViews: sql<number>`COALESCE(SUM(${builds.views}), 0)::int`,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(builds)
      .leftJoin(votes, eq(votes.buildId, builds.id))
      .where(eq(builds.userId, user.id)),
  ]);

  return ok({
    user,
    characters: chars,
    stats: {
      buildCount: stats?.buildCount ?? 0,
      totalViews: stats?.totalViews ?? 0,
      voteScore: stats?.voteScore ?? 0,
    },
  });
}
