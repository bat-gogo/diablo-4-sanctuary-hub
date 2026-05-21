import { desc } from 'drizzle-orm';
import { worldBossHistory } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { EventTracker } from '@/components/EventTracker';
import { timeAgo } from '@/lib/timeAgo';

export const metadata = { title: 'Events — Sanctuary Hub' };

const HELLTIDE_ZONES = [
  { name: 'Fractured Peaks', biome: 'Frozen north',           hint: 'Highland forges + ridge demons' },
  { name: 'Scosglen',        biome: 'Druidic coastline',      hint: 'Werewolves + Khazra hordes' },
  { name: 'Dry Steppes',     biome: 'Burnt badlands',         hint: 'Cannibal cookpits + Khazra raids' },
  { name: 'Kehjistan',       biome: 'Sun-scorched desert',    hint: 'Snake cultists + sand wraiths' },
  { name: 'Hawezar',         biome: 'Toxic swamp',            hint: 'Spider cult + drowned souls' },
  { name: 'Nahantu',         biome: 'Jungle of Vessel',       hint: 'Spiritborn ancestral grounds' },
];

export default async function EventsPage() {
  const reports = await db
    .select({
      id: worldBossHistory.id,
      bossName: worldBossHistory.bossName,
      location: worldBossHistory.location,
      spawnedAt: worldBossHistory.spawnedAt,
      reportedBy: worldBossHistory.reportedBy,
      tier: worldBossHistory.tier,
    })
    .from(worldBossHistory)
    .orderBy(desc(worldBossHistory.spawnedAt))
    .limit(20);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(245,158,11,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(24,24,27,0.5), rgba(9,9,11,1))',
          }}
          aria-hidden
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
            Sanctuary Schedule
          </p>
          <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
            Live Events
          </h1>
          <p className="text-zinc-500 mt-2 max-w-2xl">
            Helltide, World Boss and Legion timers, mirrored every minute from
            the community-run diablo4.life tracker — with a calculated fallback
            if their API ever goes dark.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-14">
        {/* TIMERS */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-amber-500">⚡</span> Now
            </h2>
            <p className="text-zinc-500 text-xs">Refreshes every 5 minutes</p>
          </div>
          <EventTracker />
        </section>

        {/* WORLD BOSS HISTORY */}
        <section>
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-amber-500">👹</span> Recent World Boss spawns
            </h2>
            <p className="text-zinc-500 text-xs">Source: diablo4.life community reports</p>
          </div>

          {reports.length === 0 ? (
            <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-10 text-center text-zinc-500">
              No reports yet. Run <code className="text-amber-400">tsx scripts/seed-boss-history.ts</code>{' '}
              to import them.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-800 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/60 text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">Boss</th>
                    <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">Location</th>
                    <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">When</th>
                    <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">Reported by</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                      <td className="px-4 py-2.5 text-white font-medium">
                        {r.bossName}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">{r.location}</td>
                      <td className="px-4 py-2.5 text-zinc-300 text-xs">
                        <span title={new Date(r.spawnedAt).toISOString()}>
                          {timeAgo(r.spawnedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 text-xs">
                        {r.reportedBy?.split('#')[0] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* HELLTIDE ZONES */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-amber-500">🔥</span> Helltide zones
            </h2>
            <p className="text-zinc-500 text-xs">Rotation per cycle</p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HELLTIDE_ZONES.map((z) => (
              <li
                key={z.name}
                className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 hover:border-rose-500/40 transition-colors"
              >
                <p className="text-white font-bold text-lg">{z.name}</p>
                <p className="text-rose-400/80 text-xs uppercase tracking-wide mt-1">
                  {z.biome}
                </p>
                <p className="text-zinc-500 text-sm mt-2">{z.hint}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
