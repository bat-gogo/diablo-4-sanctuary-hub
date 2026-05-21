import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { builds, users, votes } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { ClassBadge } from '@/components/ClassBadge';
import { FeatureToggleButton } from '@/components/admin/FeatureToggleButton';
import { DeleteBuildButton } from '@/components/admin/DeleteBuildButton';

export const metadata = { title: 'Builds — Admin' };

export default async function AdminBuildsPage() {
  const rows = await db
    .select({
      id: builds.id,
      title: builds.title,
      class: builds.class,
      season: builds.season,
      views: builds.views,
      isFeatured: builds.isFeatured,
      createdAt: builds.createdAt,
      author: users.battletag,
      voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
    })
    .from(builds)
    .innerJoin(users, eq(builds.userId, users.id))
    .leftJoin(votes, eq(votes.buildId, builds.id))
    .groupBy(builds.id, users.id)
    .orderBy(desc(builds.createdAt))
    .limit(100);

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-4">
        All builds <span className="text-zinc-500 text-sm font-normal">({rows.length})</span>
      </h2>

      <div className="overflow-x-auto border border-zinc-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-400">
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Title</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Class</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Author</th>
              <th className="px-3 py-2 text-center text-xs uppercase tracking-wide font-semibold">S</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold">Views</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold">Score</th>
              <th className="px-3 py-2 text-center text-xs uppercase tracking-wide font-semibold">★</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                <td className="px-3 py-2 max-w-[300px]">
                  <Link
                    href={`/builds/${b.id}`}
                    className="text-white hover:text-amber-300 font-medium truncate block"
                  >
                    {b.title}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <ClassBadge d4Class={b.class} size="sm" />
                </td>
                <td className="px-3 py-2 text-zinc-400 text-xs">
                  {b.author.split('#')[0]}
                </td>
                <td className="px-3 py-2 text-center text-amber-400 tabular-nums">{b.season}</td>
                <td className="px-3 py-2 text-right text-zinc-300 tabular-nums">
                  {b.views.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className={b.voteScore > 0 ? 'text-green-400' : b.voteScore < 0 ? 'text-red-400' : 'text-zinc-500'}>
                    {b.voteScore > 0 ? '+' : ''}{b.voteScore}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {b.isFeatured && <span className="text-amber-400">★</span>}
                </td>
                <td className="px-3 py-2 flex items-center gap-1.5">
                  <FeatureToggleButton id={b.id} initialFeatured={b.isFeatured} />
                  <DeleteBuildButton id={b.id} title={b.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
