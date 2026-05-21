'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { classImage } from '@sanctuary-hub/types';
import { ClassBadge } from './ClassBadge';
import { PlaystyleBadge } from './PlaystyleBadge';
import type { BuildWithMeta } from '@/lib/services/builds.service';

function formatScore(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}

export function BuildCard({ build }: { build: BuildWithMeta }) {
  const router = useRouter();
  const bg = classImage(build.class);
  const author = build.user.battletag.split('#')[0];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      onClick={() => router.push(`/builds/${build.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/builds/${build.id}`);
      }}
      className="group relative overflow-hidden rounded-xl bg-zinc-800/80 border border-zinc-700 hover:border-amber-500/50 transition-colors duration-200 hover:shadow-lg hover:shadow-amber-500/10 p-4 flex flex-col gap-2 min-h-[180px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/60"
    >
      <div
        className="absolute inset-0 bg-cover bg-top opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-2 h-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ClassBadge d4Class={build.class} size="sm" />
            <PlaystyleBadge playstyle={build.playstyle} />
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-800/50">
            S{build.season}
          </span>
        </div>

        {build.isFeatured && (
          <span className="self-start inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-600 to-yellow-500 text-zinc-900">
            ★ FEATURED
          </span>
        )}

        <h3 className="text-white font-semibold text-base line-clamp-2 mt-1 group-hover:text-amber-200 transition-colors">
          {build.title}
        </h3>

        <div className="mt-auto flex items-center justify-between text-xs text-zinc-400 pt-2">
          <span className="truncate">
            by{' '}
            <Link
              href={`/players/${encodeURIComponent(build.user.battletag)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-300 hover:text-amber-300 underline-offset-2 hover:underline transition-colors"
            >
              {author}
            </Link>
          </span>
          <div className="flex items-center gap-3 text-zinc-500 shrink-0">
            <span title="Views" className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M10 4C5 4 1.7 7.6 1 10c.7 2.4 4 6 9 6s8.3-3.6 9-6c-.7-2.4-4-6-9-6Zm0 9.5A3.5 3.5 0 1 1 10 6.5a3.5 3.5 0 0 1 0 7Z" />
              </svg>
              {build.views.toLocaleString()}
            </span>
            <span title="Score" className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M10 3 4 11h4v6h4v-6h4z" />
              </svg>
              {formatScore(build.voteScore)}
            </span>
            <span title="Comments" className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M2 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8l-4 3v-3a3 3 0 0 1-2-3z" />
              </svg>
              {build.commentCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
