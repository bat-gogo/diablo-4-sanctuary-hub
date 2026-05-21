import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq, sql } from 'drizzle-orm';
import {
  builds as buildsTable,
  comments,
  skills as skillsTable,
  users,
  votes,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { classImage, skillIcon } from '@sanctuary-hub/types';
import { ClassBadge } from '@/components/ClassBadge';
import { BuildCard } from '@/components/BuildCard';
import {
  CLASS_LORE,
  CLASS_ORDER,
  CLASS_TAGLINE,
  type ClassSlug,
} from '@/lib/classLore';

interface Params {
  params: Promise<{ className: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { className } = await params;
  const valid = (CLASS_ORDER as readonly string[]).includes(className);
  const title = valid
    ? `${className.charAt(0).toUpperCase() + className.slice(1)} — Sanctuary Hub`
    : 'Class not found — Sanctuary Hub';
  return { title };
}

export default async function ClassPage({ params }: Params) {
  const { className } = await params;
  if (!(CLASS_ORDER as readonly string[]).includes(className)) notFound();
  const slug = className as ClassSlug;

  const [topBuildsRaw, allSkills, [counts]] = await Promise.all([
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
        voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
        commentCount: sql<number>`COUNT(DISTINCT ${comments.id})::int`,
      })
      .from(buildsTable)
      .innerJoin(users, eq(buildsTable.userId, users.id))
      .leftJoin(votes, eq(votes.buildId, buildsTable.id))
      .leftJoin(comments, eq(comments.buildId, buildsTable.id))
      .where(eq(buildsTable.class, slug))
      .groupBy(buildsTable.id, users.id)
      .orderBy(desc(sql`COALESCE(SUM(${votes.value}), 0)`), desc(buildsTable.views))
      .limit(6),
    db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        type: skillsTable.type,
        iconSlug: skillsTable.iconSlug,
        maxRank: skillsTable.maxRank,
      })
      .from(skillsTable)
      .where(eq(skillsTable.class, slug)),
    db
      .select({
        buildCount: sql<number>`COUNT(*)::int`,
      })
      .from(buildsTable)
      .where(eq(buildsTable.class, slug)),
  ]);

  const topBuilds = topBuildsRaw.map((b) => ({
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
    voteScore: b.voteScore,
    commentCount: b.commentCount,
  }));

  const active   = allSkills.filter((s) => s.type === 'active');
  const passive  = allSkills.filter((s) => s.type === 'passive');
  const ultimate = allSkills.filter((s) => s.type === 'ultimate');

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src={classImage(slug)}
          alt={slug}
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/60 to-zinc-950" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-4xl text-center px-4 flex flex-col items-center gap-4">
          <p className="text-amber-400 text-base italic tracking-wide">
            {CLASS_TAGLINE[slug]}
          </p>
          <h1 className="text-white text-6xl md:text-9xl font-black capitalize leading-none tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)]">
            {slug}
          </h1>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <ClassBadge d4Class={slug} size="md" />
            <span className="text-xs font-bold px-2 py-1 rounded bg-zinc-900/80 text-zinc-300 border border-zinc-700">
              {counts?.buildCount ?? 0} builds
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded bg-zinc-900/80 text-zinc-300 border border-zinc-700">
              {allSkills.length} skills
            </span>
          </div>
          <Link
            href={`/builds?class=${slug}`}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-amber-600/30 mt-4 transition-all hover:scale-105"
          >
            Browse builds →
          </Link>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden>
          <svg className="w-6 h-6 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* LORE */}
      <section className="bg-zinc-900/60 border-y border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-14 prose prose-invert prose-p:text-zinc-300 prose-p:leading-relaxed">
          {CLASS_LORE[slug].map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <header className="mb-6">
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
            Toolkit
          </p>
          <h2 className="text-white text-3xl font-black mt-1 capitalize">
            {slug} skills
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkillColumn label="Active"   skills={active}   d4Class={slug} />
          <SkillColumn label="Passive"  skills={passive}  d4Class={slug} />
          <SkillColumn label="Ultimate" skills={ultimate} d4Class={slug} />
        </div>
      </section>

      {/* TOP BUILDS */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <header className="flex items-end justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-white text-3xl font-black capitalize">
            Top {slug} builds
          </h2>
          <Link
            href={`/builds?class=${slug}`}
            className="text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            View all {counts?.buildCount ?? 0} →
          </Link>
        </header>
        {topBuilds.length === 0 ? (
          <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-10 text-center text-zinc-500">
            No published builds yet for this class.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topBuilds.map((b) => (
              <BuildCard key={b.id} build={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SkillColumn({
  label,
  skills,
  d4Class,
}: {
  label: string;
  skills: Array<{ id: string; name: string; type: string; iconSlug: string | null; maxRank: number }>;
  d4Class: string;
}) {
  return (
    <div>
      <h3 className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-bold mb-3">
        {label}{' '}
        <span className="text-zinc-600 font-normal normal-case">({skills.length})</span>
      </h3>
      <ul className="flex flex-col gap-1.5">
        {skills.length === 0 && (
          <li className="text-zinc-600 text-sm italic">No {label.toLowerCase()} skills.</li>
        )}
        {skills.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2.5 bg-zinc-800/60 border border-zinc-800 rounded-lg px-2.5 py-1.5 hover:border-amber-500/40 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={skillIcon(s.iconSlug, d4Class, s.type)}
              alt=""
              width={28}
              height={28}
              className="rounded shrink-0"
            />
            <span className="text-white text-sm font-medium flex-1 truncate">{s.name}</span>
            <span className="text-[10px] text-zinc-500 uppercase">{s.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
