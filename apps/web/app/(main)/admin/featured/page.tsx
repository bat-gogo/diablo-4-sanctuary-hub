import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { builds, users, votes } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { ClassBadge } from '@/components/ClassBadge';
import { FeatureToggleButton } from '@/components/admin/FeatureToggleButton';

export const metadata = { title: 'Featured — Admin' };

const FEATURED_CAP = 12;

export default async function AdminFeaturedPage() {
  const [featured, candidates] = await Promise.all([
    db
      .select({
        id: builds.id,
        title: builds.title,
        class: builds.class,
        season: builds.season,
        views: builds.views,
        author: users.battletag,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(builds)
      .innerJoin(users, eq(builds.userId, users.id))
      .leftJoin(votes, eq(votes.buildId, builds.id))
      .where(eq(builds.isFeatured, true))
      .groupBy(builds.id, users.id)
      .orderBy(desc(builds.views))
      .limit(50),
    db
      .select({
        id: builds.id,
        title: builds.title,
        class: builds.class,
        season: builds.season,
        views: builds.views,
        author: users.battletag,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(builds)
      .innerJoin(users, eq(builds.userId, users.id))
      .leftJoin(votes, eq(votes.buildId, builds.id))
      .where(eq(builds.isFeatured, false))
      .groupBy(builds.id, users.id)
      .orderBy(desc(sql`COALESCE(SUM(${votes.value}), 0)`))
      .limit(30),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current featured */}
      <section>
        <header className="flex items-end justify-between mb-3">
          <h2 className="text-white text-xl font-bold">Currently featured</h2>
          <span className="text-zinc-500 text-xs">
            {featured.length}/{FEATURED_CAP}
          </span>
        </header>

        {featured.length === 0 ? (
          <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
            No featured builds yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {featured.map((b) => (
              <Row key={b.id} b={b} mode="featured" />
            ))}
          </ul>
        )}
        {featured.length >= FEATURED_CAP && (
          <p className="text-amber-500 text-xs mt-2">
            ⚠ At the {FEATURED_CAP} build cap. Unfeature one to add another.
          </p>
        )}
      </section>

      {/* Candidates */}
      <section>
        <h2 className="text-white text-xl font-bold mb-3">
          Add to featured
        </h2>
        <p className="text-zinc-500 text-xs mb-3">
          Top builds by score that aren't yet featured.
        </p>
        <ul className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
          {candidates.map((b) => (
            <Row key={b.id} b={b} mode="candidate" />
          ))}
        </ul>
      </section>
    </div>
  );
}

interface Row {
  id: string;
  title: string;
  class: string;
  season: number;
  views: number;
  author: string;
  voteScore: number;
}

function Row({ b, mode }: { b: Row; mode: 'featured' | 'candidate' }) {
  return (
    <li className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-colors">
      <div className="min-w-0 flex-1">
        <Link
          href={`/builds/${b.id}`}
          className="text-white text-sm font-semibold hover:text-amber-300 truncate block"
        >
          {b.title}
        </Link>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-500 flex-wrap">
          <ClassBadge d4Class={b.class} size="sm" />
          <span className="text-amber-400">S{b.season}</span>
          <span>· {b.author.split('#')[0]}</span>
          <span className="text-zinc-600">·</span>
          <span>{b.views.toLocaleString()} views</span>
          <span className={b.voteScore > 0 ? 'text-green-400' : b.voteScore < 0 ? 'text-red-400' : 'text-zinc-500'}>
            {b.voteScore > 0 ? '+' : ''}{b.voteScore}
          </span>
        </div>
      </div>
      <FeatureToggleButton id={b.id} initialFeatured={mode === 'featured'} />
    </li>
  );
}
