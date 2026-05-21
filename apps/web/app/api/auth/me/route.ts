import { eq, sql } from 'drizzle-orm';
import {
  builds,
  comments,
  partyRequests,
  users,
  votes,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { ok, err } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { calculateScore, getRank } from '@/lib/ranks';

export async function GET(request: Request) {
  let payload;
  try {
    payload = await requireAuth(request);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const [user, [buildStats], [commentStat], [partyStat]] = await Promise.all([
    db
      .select({
        id: users.id,
        battletag: users.battletag,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select({
        buildCount: sql<number>`COUNT(DISTINCT ${builds.id})::int`,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(builds)
      .leftJoin(votes, eq(votes.buildId, builds.id))
      .where(eq(builds.userId, payload.userId)),
    db
      .select({ commentCount: sql<number>`COUNT(*)::int` })
      .from(comments)
      .where(eq(comments.userId, payload.userId)),
    db
      .select({ partyCount: sql<number>`COUNT(*)::int` })
      .from(partyRequests)
      .where(eq(partyRequests.userId, payload.userId)),
  ]);

  if (!user) return err('User not found', 404);

  const score = calculateScore({
    buildCount: buildStats?.buildCount ?? 0,
    totalVotesReceived: buildStats?.voteScore ?? 0,
    commentCount: commentStat?.commentCount ?? 0,
    partyRequestCount: partyStat?.partyCount ?? 0,
  });
  const rank = getRank(score);

  return ok({
    user,
    stats: {
      buildCount: buildStats?.buildCount ?? 0,
      voteScore: buildStats?.voteScore ?? 0,
      commentCount: commentStat?.commentCount ?? 0,
      partyRequestCount: partyStat?.partyCount ?? 0,
      score,
    },
    rank: {
      name: rank.name,
      nameEn: rank.nameEn,
      icon: rank.icon,
    },
  });
}
