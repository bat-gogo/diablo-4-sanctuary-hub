import { desc, eq, sql } from 'drizzle-orm';
import { builds, users, votes } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { MetaDashboard } from '@/components/MetaDashboard';

export const metadata = { title: 'Meta — Sanctuary Hub' };

export default async function MetaPage() {
  const [
    classDist,
    playstyleDist,
    seasonDist,
    topBuilds,
    activity,
    voteDist,
    [totals],
  ] = await Promise.all([
    db
      .select({ class: builds.class, count: sql<number>`COUNT(*)::int` })
      .from(builds)
      .groupBy(builds.class)
      .orderBy(desc(sql`COUNT(*)`)),
    db
      .select({ playstyle: builds.playstyle, count: sql<number>`COUNT(*)::int` })
      .from(builds)
      .groupBy(builds.playstyle)
      .orderBy(desc(sql`COUNT(*)`)),
    db
      .select({ season: builds.season, count: sql<number>`COUNT(*)::int` })
      .from(builds)
      .groupBy(builds.season)
      .orderBy(builds.season),
    db
      .select({
        id: builds.id,
        title: builds.title,
        class: builds.class,
        views: builds.views,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(builds)
      .leftJoin(votes, eq(votes.buildId, builds.id))
      .groupBy(builds.id)
      .orderBy(desc(sql`COALESCE(SUM(${votes.value}), 0)`))
      .limit(10),
    // Builds per day across the seeded window — gives a 11-month bar chart.
    db.execute(sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM builds
      GROUP BY 1
      ORDER BY 1
    `),
    db
      .select({ value: votes.value, count: sql<number>`COUNT(*)::int` })
      .from(votes)
      .groupBy(votes.value),
    db
      .select({
        users: sql<number>`(SELECT COUNT(*) FROM ${users})::int`,
        builds: sql<number>`(SELECT COUNT(*) FROM ${builds})::int`,
        votes: sql<number>`(SELECT COUNT(*) FROM ${votes})::int`,
      })
      .from(builds)
      .limit(1),
  ]);

  return (
    <MetaDashboard
      data={{
        classDist,
        playstyleDist,
        seasonDist,
        topBuilds: topBuilds.map((b) => ({
          ...b,
          voteScore: Number(b.voteScore),
        })),
        activity: (activity.rows as Array<{ date: string; count: number }>).map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
        voteDist: voteDist.map((v) => ({ value: Number(v.value), count: Number(v.count) })),
        totals: {
          users: Number(totals?.users ?? 0),
          builds: Number(totals?.builds ?? 0),
          votes: Number(totals?.votes ?? 0),
        },
      }}
    />
  );
}
