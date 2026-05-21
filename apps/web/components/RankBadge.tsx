import { getNextRank, getRank } from '@/lib/ranks';

interface RankBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function RankBadge({ score, size = 'md', showProgress = false }: RankBadgeProps) {
  const rank = getRank(score);
  const next = getNextRank(score);
  const progress = next
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(((score - rank.minScore) / (next.minScore - rank.minScore)) * 100),
        ),
      )
    : 100;

  const padding =
    size === 'sm' ? 'px-1.5 py-0.5 gap-1' : size === 'lg' ? 'px-3 py-1.5 gap-2' : 'px-2 py-1 gap-1.5';
  const text = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`inline-flex items-center rounded-lg border ${rank.bgColor} ${rank.borderColor} ${padding} self-start`}
        title={rank.description}
      >
        <span className={`font-mono font-bold ${rank.color} ${text}`}>{rank.icon}</span>
        <span className={`font-medium ${rank.color} ${text}`}>{rank.name}</span>
        {size !== 'sm' && (
          <span className="text-zinc-500 font-mono text-[10px] ml-1.5 tabular-nums">
            {score}
          </span>
        )}
      </div>
      {showProgress && next && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 tabular-nums whitespace-nowrap">
            {score - rank.minScore}/{next.minScore - rank.minScore} → {next.name}
          </span>
        </div>
      )}
      {showProgress && !next && (
        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
          Max rank
        </span>
      )}
    </div>
  );
}
