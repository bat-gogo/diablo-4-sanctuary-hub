import { getPartyRequests } from '@/lib/services/party.service';
import { PartyCard } from '@/components/PartyCard';

export const metadata = { title: 'Party Finder — Sanctuary Hub' };

const ACTIVITY_TABS = [
  { key: '',                  label: 'All' },
  { key: 'helltide',          label: 'Helltide' },
  { key: 'world_boss',        label: 'World Boss' },
  { key: 'nightmare_dungeon', label: 'Nightmare Dungeon' },
  { key: 'uber_boss',         label: 'Uber Boss' },
  { key: 'pit',               label: 'Pit' },
  { key: 'pvp',               label: 'PvP' },
  { key: 'leveling',          label: 'Leveling' },
];

export default async function PartyFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const activity = sp.activity ?? '';
  const status = sp.status ?? 'open';

  const { requests } = await getPartyRequests({
    activity: activity || undefined,
    status: status || undefined,
    limit: 48,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
          Looking for Group
        </p>
        <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
          Party Finder
        </h1>
        <p className="text-zinc-500 mt-2">
          Find Sanctuary's wanderers gathering for endgame activities.
        </p>
      </header>

      {/* Activity tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-4 px-4">
        {ACTIVITY_TABS.map((t) => {
          const active = activity === t.key;
          return (
            <a
              key={t.key}
              href={`/party${t.key ? `?activity=${t.key}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="flex gap-3 mb-6 text-xs">
        {['open', 'full', 'closed', ''].map((s) => (
          <a
            key={s}
            href={`/party${activity ? `?activity=${activity}` : '?'}${
              activity ? `&` : ''
            }${s ? `status=${s}` : ''}`}
            className={`uppercase tracking-wide font-semibold ${
              status === s ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {s || 'all'}
          </a>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
          No party requests match these filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((r) => (
            <PartyCard key={r.id} request={r} />
          ))}
        </div>
      )}

      <p className="text-zinc-600 text-xs text-center mt-10">
        Showing {requests.length} request{requests.length === 1 ? '' : 's'} ·
        {' '}post creation coming soon.
      </p>
    </div>
  );
}
