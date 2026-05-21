import { desc, eq, ilike, sql } from 'drizzle-orm';
import {
  builds,
  characters,
  comments,
  partyRequests,
  users,
  votes,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/api';
import { calculateScore } from '@/lib/ranks';

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

  const [chars, [buildStats], [commentStat], [partyStat]] = await Promise.all([
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
    db
      .select({ commentCount: sql<number>`COUNT(*)::int` })
      .from(comments)
      .where(eq(comments.userId, user.id)),
    db
      .select({ partyCount: sql<number>`COUNT(*)::int` })
      .from(partyRequests)
      .where(eq(partyRequests.userId, user.id)),
  ]);

  const buildCount = buildStats?.buildCount ?? 0;
  const totalViews = buildStats?.totalViews ?? 0;
  const voteScore = buildStats?.voteScore ?? 0;
  const commentCount = commentStat?.commentCount ?? 0;
  const partyRequestCount = partyStat?.partyCount ?? 0;

  const score = calculateScore({
    buildCount,
    totalVotesReceived: voteScore,
    commentCount,
    partyRequestCount,
  });

  return ok({
    user,
    characters: chars,
    stats: {
      buildCount,
      totalViews,
      voteScore,
      commentCount,
      partyRequestCount,
      score,
    },
  });
}
