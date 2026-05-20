const ACTIVITY_STYLES: Record<string, string> = {
  helltide:          'bg-rose-900/60 text-rose-300',
  world_boss:        'bg-purple-900/60 text-purple-300',
  nightmare_dungeon: 'bg-orange-900/60 text-orange-300',
  uber_boss:         'bg-red-900/60 text-red-300',
  pit:               'bg-zinc-700 text-zinc-300',
  pvp:               'bg-violet-900/60 text-violet-300',
  leveling:          'bg-green-900/60 text-green-300',
};

const LABELS: Record<string, string> = {
  helltide: 'Helltide',
  world_boss: 'World Boss',
  nightmare_dungeon: 'Nightmare Dungeon',
  uber_boss: 'Uber Boss',
  pit: 'Pit',
  pvp: 'PvP',
  leveling: 'Leveling',
};

export function ActivityBadge({ activity }: { activity: string }) {
  const cls = ACTIVITY_STYLES[activity] ?? 'bg-zinc-700 text-zinc-300';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${cls}`}
    >
      {LABELS[activity] ?? activity}
    </span>
  );
}
