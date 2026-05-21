import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { classImage, skillIcon } from '@sanctuary-hub/types';
import {
  getBuildById,
  getComments,
  incrementViews,
} from '@/lib/services/builds.service';
import { verifyToken } from '@/lib/auth';
import { ClassBadge } from '@/components/ClassBadge';
import { PlaystyleBadge } from '@/components/PlaystyleBadge';
import { CommentsSection } from '@/components/CommentsSection';

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const build = await getBuildById(id);
  if (!build) notFound();
  incrementViews(id).catch(() => {});

  const heroBg = classImage(build.class);

  // First page of comments + current viewer (for the compose form gate).
  const [commentsPage, viewer] = await Promise.all([
    getComments(id, { limit: 10 }),
    (async () => {
      const token = (await cookies()).get('token')?.value ?? null;
      return token ? await verifyToken(token) : null;
    })(),
  ]);

  const active = build.buildSkills.filter((bs) => bs.skill.type === 'active');
  const passive = build.buildSkills.filter((bs) => bs.skill.type === 'passive');
  const ultimate = build.buildSkills.filter((bs) => bs.skill.type === 'ultimate');

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div
          className="absolute inset-0 bg-cover bg-top opacity-25"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/85 to-zinc-950" aria-hidden />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 flex flex-col gap-4">
          <Link
            href="/builds"
            className="text-zinc-500 hover:text-amber-300 text-sm w-fit"
          >
            ← Back to builds
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <ClassBadge d4Class={build.class} size="md" />
            <PlaystyleBadge playstyle={build.playstyle} />
            <span className="text-xs px-2 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-800/50 font-bold">
              S{build.season}
            </span>
            {build.isFeatured && (
              <span className="text-xs px-2 py-1 rounded bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-900 font-bold">
                ★ FEATURED
              </span>
            )}
          </div>

          <h1 className="text-white text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {build.title}
          </h1>

          <div className="flex items-center gap-6 text-sm text-zinc-400 mt-2 flex-wrap">
            <span>
              by{' '}
              <span className="text-zinc-200 font-medium">
                {build.user.battletag.split('#')[0]}
              </span>
              <span className="text-zinc-600 font-mono ml-1">
                #{build.user.battletag.split('#')[1]}
              </span>
            </span>
            <span title="Views">👁 {build.views.toLocaleString()} views</span>
            <span title="Score">▲ {build.voteScore > 0 ? '+' : ''}{build.voteScore}</span>
            <span title="Comments">💬 {build.commentCount}</span>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-6">
          <h2 className="text-white text-xl font-bold">Description</h2>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-zinc-300 leading-relaxed whitespace-pre-line">
            {build.description ?? <span className="text-zinc-600">No description.</span>}
          </div>

          {/* Skills */}
          {build.buildSkills.length > 0 && (
            <>
              <h2 className="text-white text-xl font-bold mt-4">
                Skill kit{' '}
                <span className="text-zinc-500 text-sm font-normal">
                  ({build.buildSkills.length})
                </span>
              </h2>
              <div className="flex flex-col gap-5">
                <SkillGroup
                  label="Active"
                  skills={active}
                  d4Class={build.class}
                />
                <SkillGroup
                  label="Passive"
                  skills={passive}
                  d4Class={build.class}
                />
                <SkillGroup
                  label="Ultimate"
                  skills={ultimate}
                  d4Class={build.class}
                />
              </div>
            </>
          )}
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2 font-semibold">
              Class
            </p>
            <Image
              src={classImage(build.class)}
              alt={build.class}
              width={300}
              height={400}
              className="rounded-lg w-full h-auto object-cover"
            />
            <p className="text-white capitalize text-lg font-bold mt-2 text-center">
              {build.class}
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2 font-semibold">
              Activity
            </p>
            <p className="text-white">
              <span className="capitalize">{build.playstyle}</span> · Season {build.season}
            </p>
            <p className="text-zinc-500 text-xs mt-3">
              Posted {new Date(build.createdAt).toLocaleDateString()}
            </p>
          </div>
        </aside>
      </section>

      {/* Comments */}
      <section className="max-w-5xl mx-auto px-4 pb-16 -mt-4">
        <CommentsSection
          buildId={build.id}
          initialComments={commentsPage.comments}
          initialNextCursor={commentsPage.nextCursor}
          currentUserId={viewer?.userId ?? null}
          currentUserRole={viewer?.role ?? null}
          totalCount={build.commentCount}
        />
      </section>
    </div>
  );
}

function SkillGroup({
  label,
  skills,
  d4Class,
}: {
  label: string;
  skills: Array<{
    slot: number;
    rank: number;
    skill: {
      id: string;
      name: string;
      type: string;
      iconSlug: string | null;
      description: string | null;
    };
  }>;
  d4Class: string;
}) {
  if (skills.length === 0) return null;
  return (
    <div>
      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2 font-semibold">
        {label}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {skills.map(({ skill, rank }) => (
          <li
            key={skill.id}
            className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-800 rounded-lg px-3 py-2 hover:border-amber-500/40 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={skillIcon(skill.iconSlug, d4Class, skill.type)}
              alt=""
              width={32}
              height={32}
              className="rounded shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{skill.name}</p>
              <p className="text-zinc-500 text-xs">
                Rank {rank} · {skill.type}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
