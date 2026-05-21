import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { desc, eq, ilike, sql } from 'drizzle-orm';
import {
  assetUrl,
  ASSETS,
  classImage,
} from '@sanctuary-hub/types';
import {
  builds as buildsTable,
  characters as charactersTable,
  users,
  votes,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { ClassBadge } from '@/components/ClassBadge';
import { BuildCard } from '@/components/BuildCard';

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ battletag: string }>;
}) {
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

  if (!user) notFound();

  const [myBuilds, characters, [stats]] = await Promise.all([
    db
      .select({
        id: buildsTable.id,
        title: buildsTable.title,
        description: buildsTable.description,
        class: buildsTable.class,
        season: buildsTable.season,
        playstyle: buildsTable.playstyle,
        isFeatured: buildsTable.isFeatured,
        views: buildsTable.views,
        createdAt: buildsTable.createdAt,
        userId: users.id,
        userBattletag: users.battletag,
        userAvatar: users.avatarUrl,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`.as('vote_score'),
        commentCount: sql<number>`0::int`.as('comment_count'), // skip for profile speed
      })
      .from(buildsTable)
      .innerJoin(users, eq(buildsTable.userId, users.id))
      .leftJoin(votes, eq(votes.buildId, buildsTable.id))
      .where(eq(buildsTable.userId, user.id))
      .groupBy(buildsTable.id, users.id)
      .orderBy(desc(buildsTable.views))
      .limit(6),
    db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.userId, user.id))
      .orderBy(desc(charactersTable.createdAt))
      .limit(20),
    db
      .select({
        buildCount: sql<number>`COUNT(DISTINCT ${buildsTable.id})::int`,
        totalViews: sql<number>`COALESCE(SUM(${buildsTable.views}), 0)::int`,
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(buildsTable)
      .leftJoin(votes, eq(votes.buildId, buildsTable.id))
      .where(eq(buildsTable.userId, user.id)),
  ]);

  // Pick most-played class for hero backdrop, fall back to first build's
  // class, then barbarian.
  const heroClass =
    characters[0]?.class ?? myBuilds[0]?.class ?? 'barbarian';

  const avatarSrc = user.avatarUrl ?? assetUrl(ASSETS.ui.avatarPlaceholder);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-800 min-h-[300px] flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-top opacity-25"
          style={{ backgroundImage: `url(${classImage(heroClass)})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" aria-hidden />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 w-full flex items-end gap-6 flex-wrap">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-500/40 bg-zinc-800 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt={user.battletag}
              className="w-full h-full object-cover"
              style={
                avatarSrc.endsWith('.svg')
                  ? { filter: 'invert(70%) sepia(50%) saturate(500%) hue-rotate(5deg)' }
                  : undefined
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {user.role === 'admin' && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-800/50">
                  ADMIN
                </span>
              )}
              <span className="text-zinc-500 text-xs">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-white text-3xl md:text-5xl font-black truncate">
              {user.battletag.split('#')[0]}
              <span className="text-zinc-500 font-mono text-2xl md:text-3xl ml-2">
                #{user.battletag.split('#')[1]}
              </span>
            </h1>
            <div className="mt-3 flex gap-6 text-sm text-zinc-300 flex-wrap">
              <span><span className="text-white font-bold">{stats?.buildCount ?? 0}</span> builds</span>
              <span><span className="text-white font-bold">{(stats?.totalViews ?? 0).toLocaleString()}</span> views</span>
              <span>
                <span className={`font-bold ${
                  (stats?.voteScore ?? 0) > 0 ? 'text-green-400'
                  : (stats?.voteScore ?? 0) < 0 ? 'text-red-400'
                  : 'text-white'
                }`}>
                  {(stats?.voteScore ?? 0) > 0 ? '+' : ''}{stats?.voteScore ?? 0}
                </span>{' '}score
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* Sidebar — characters */}
        <aside>
          <h2 className="text-white text-lg font-bold mb-3">Characters</h2>
          {characters.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500 text-sm">
              No characters yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {characters.map((c) => (
                <li
                  key={c.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center gap-3"
                >
                  <Image
                    src={classImage(c.class)}
                    alt={c.class}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover object-top rounded shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <ClassBadge d4Class={c.class} size="sm" />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
                        Lvl {c.level}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
                        S{c.season}
                      </span>
                      {c.isHardcore && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/70 text-red-300 font-bold">
                          ⚠ HC
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main — builds */}
        <section>
          <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-white text-2xl font-bold">
              Builds by {user.battletag.split('#')[0]}
            </h2>
            {(stats?.buildCount ?? 0) > 6 && (
              <Link
                href={`/builds?author=${encodeURIComponent(user.battletag)}`}
                className="text-amber-400 hover:text-amber-300 text-sm font-medium"
              >
                View all {stats?.buildCount} builds →
              </Link>
            )}
          </div>

          {myBuilds.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-10 text-center text-zinc-500">
              {user.battletag.split('#')[0]} hasn't published any builds yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myBuilds.map((b) => (
                <BuildCard
                  key={b.id}
                  build={{
                    id: b.id,
                    title: b.title,
                    description: b.description,
                    class: b.class,
                    season: b.season,
                    playstyle: b.playstyle,
                    isFeatured: b.isFeatured,
                    views: b.views,
                    createdAt: b.createdAt,
                    user: {
                      id: b.userId,
                      battletag: b.userBattletag,
                      avatarUrl: b.userAvatar,
                    },
                    voteScore: Number(b.voteScore),
                    commentCount: Number(b.commentCount),
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
