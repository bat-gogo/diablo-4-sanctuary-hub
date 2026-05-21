import Image from 'next/image';
import { classImage } from '@sanctuary-hub/types';
import { getTierListBuilds } from '@/lib/services/builds.service';
import { BuildCard } from '@/components/BuildCard';
import { ClassBadge } from '@/components/ClassBadge';
import type { BuildWithMeta } from '@/lib/services/builds.service';

export const metadata = { title: 'Tier List — Sanctuary Hub' };

const CLASSES = [
  'barbarian', 'druid', 'necromancer', 'rogue', 'sorcerer', 'spiritborn', 'paladin', 'warlock',
] as const;

const TIERS = [
  { key: 'S', min:  50, label: 'S — Meta defining', bg: 'bg-gradient-to-r from-amber-500 to-yellow-400', text: 'text-zinc-900' },
  { key: 'A', min:  20, label: 'A — Strong',         bg: 'bg-emerald-500',                                text: 'text-zinc-900' },
  { key: 'B', min:   5, label: 'B — Solid',          bg: 'bg-blue-500',                                   text: 'text-zinc-900' },
  { key: 'C', min:   0, label: 'C — Niche',          bg: 'bg-zinc-500',                                   text: 'text-zinc-900' },
  { key: 'D', min: -Infinity, label: 'D — Avoid',    bg: 'bg-red-700',                                    text: 'text-white'   },
] as const;

function tierForScore(score: number): (typeof TIERS)[number]['key'] {
  for (const t of TIERS) {
    if (score >= t.min) return t.key;
  }
  return 'D';
}

export default async function TierListPage() {
  const top = await getTierListBuilds(300);

  // Group by tier and by class.
  const byTier: Record<string, BuildWithMeta[]> = { S: [], A: [], B: [], C: [], D: [] };
  for (const b of top) byTier[tierForScore(b.voteScore)].push(b);

  const byClass: Record<string, BuildWithMeta[]> = {};
  for (const c of CLASSES) byClass[c] = [];
  for (const b of top) {
    if (byClass[b.class]) byClass[b.class].push(b);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-8 text-center">
        <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
          Sanctum of Power
        </p>
        <h1 className="text-white text-4xl md:text-6xl font-black mt-1">
          Season 7 Tier List
        </h1>
        <p className="text-zinc-500 mt-2 max-w-2xl mx-auto">
          Community-voted meta builds. Tiers are computed live from upvote scores
          across every season.
        </p>
      </header>

      {/* TIER ROWS */}
      <section className="mb-16">
        <h2 className="text-white text-xl font-bold mb-3">Overall ranking</h2>
        <div className="flex flex-col gap-3">
          {TIERS.map((t) => (
            <div
              key={t.key}
              className="grid grid-cols-[64px_1fr] gap-3 items-stretch"
            >
              <div
                className={`rounded-lg flex items-center justify-center text-3xl font-black ${t.bg} ${t.text}`}
                title={t.label}
              >
                {t.key}
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 min-h-[80px]">
                {byTier[t.key].length === 0 ? (
                  <p className="text-zinc-600 text-sm italic flex items-center h-full">
                    No builds in this tier.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {byTier[t.key].slice(0, 30).map((b) => (
                      <li
                        key={b.id}
                        className="inline-flex"
                      >
                        <a
                          href={`/builds/${b.id}`}
                          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white transition-colors"
                        >
                          <ClassBadge d4Class={b.class} size="sm" />
                          <span className="font-medium max-w-[180px] truncate">{b.title}</span>
                          <span className={`font-mono ${
                            b.voteScore > 0 ? 'text-green-400'
                            : b.voteScore < 0 ? 'text-red-400'
                            : 'text-zinc-500'
                          }`}>
                            {b.voteScore > 0 ? '+' : ''}{b.voteScore}
                          </span>
                        </a>
                      </li>
                    ))}
                    {byTier[t.key].length > 30 && (
                      <li className="text-zinc-500 text-xs self-center">
                        +{byTier[t.key].length - 30} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PER-CLASS SECTIONS */}
      <section className="flex flex-col gap-10">
        <h2 className="text-white text-xl font-bold">By class</h2>
        {CLASSES.map((c) => {
          const top6 = byClass[c].slice(0, 6);
          return (
            <div key={c} id={`class-${c}`}>
              {/* Class banner */}
              <div className="relative h-32 md:h-40 rounded-2xl overflow-hidden border border-zinc-800 mb-4">
                <Image
                  src={classImage(c)}
                  alt={c}
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute inset-0 flex items-center px-6">
                  <div>
                    <h3 className="text-white text-3xl md:text-5xl font-black capitalize">
                      {c}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                      {byClass[c].length} ranked build{byClass[c].length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </div>

              {top6.length === 0 ? (
                <p className="text-zinc-600 text-sm italic px-2 pb-4">
                  No ranked builds for this class yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {top6.map((b) => (
                    <BuildCard key={b.id} build={b} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
