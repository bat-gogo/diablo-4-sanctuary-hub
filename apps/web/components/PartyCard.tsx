import { ActivityBadge } from './ActivityBadge';
import { timeAgo } from '@/lib/timeAgo';
import type { PartyRequestWithUser } from '@/lib/services/party.service';

function spotsColor(filled: number, total: number): string {
  if (filled >= total) return 'text-red-400';
  if (total - filled === 1) return 'text-orange-400';
  return 'text-green-400';
}

export function PartyCard({ request: r }: { request: PartyRequestWithUser }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-zinc-500 transition-colors flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ActivityBadge activity={r.activity} />
        <span className="text-xs text-zinc-500">
          Lvl <span className="text-zinc-300 font-medium">{r.minLevel}+</span>
        </span>
      </div>

      <p className="text-zinc-200 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
        {r.description ?? '—'}
      </p>

      <div className="mt-auto flex items-center justify-between text-xs">
        <span className="text-zinc-500">
          by <span className="text-zinc-300">{r.user.battletag.split('#')[0]}</span>
          <span className="text-zinc-600 ml-2">{timeAgo(r.createdAt)}</span>
        </span>
        <span
          className={`font-mono font-bold ${spotsColor(r.spotsFilled, r.spotsTotal)}`}
        >
          {r.spotsFilled}/{r.spotsTotal}
        </span>
      </div>
    </div>
  );
}
