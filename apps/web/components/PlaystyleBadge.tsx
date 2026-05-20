const PLAYSTYLE_STYLES: Record<string, string> = {
  leveling: 'bg-zinc-700 text-zinc-300',
  endgame:  'bg-orange-900/60 text-orange-300',
  pit:      'bg-red-900/60 text-red-400',
  helltide: 'bg-rose-900/60 text-rose-300',
  pvp:      'bg-violet-900/60 text-violet-300',
};

const LABELS: Record<string, string> = {
  leveling: 'Leveling',
  endgame: 'Endgame',
  pit: 'Pit',
  helltide: 'Helltide',
  pvp: 'PvP',
};

export function PlaystyleBadge({ playstyle }: { playstyle: string }) {
  const cls = PLAYSTYLE_STYLES[playstyle] ?? 'bg-zinc-700 text-zinc-300';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${cls}`}
    >
      {LABELS[playstyle] ?? playstyle}
    </span>
  );
}
