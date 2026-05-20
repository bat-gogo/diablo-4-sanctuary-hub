const CLASS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  barbarian:   { bg: 'bg-red-900/60',    text: 'text-red-300',    border: 'border-red-800',    dot: 'bg-red-400' },
  druid:       { bg: 'bg-green-900/60',  text: 'text-green-300',  border: 'border-green-800',  dot: 'bg-green-400' },
  necromancer: { bg: 'bg-purple-900/60', text: 'text-purple-300', border: 'border-purple-800', dot: 'bg-purple-400' },
  rogue:       { bg: 'bg-yellow-900/60', text: 'text-yellow-300', border: 'border-yellow-800', dot: 'bg-yellow-400' },
  sorcerer:    { bg: 'bg-blue-900/60',   text: 'text-blue-300',   border: 'border-blue-800',   dot: 'bg-blue-400' },
  spiritborn:  { bg: 'bg-teal-900/60',   text: 'text-teal-300',   border: 'border-teal-800',   dot: 'bg-teal-400' },
  paladin:     { bg: 'bg-amber-900/60',  text: 'text-amber-300',  border: 'border-amber-800',  dot: 'bg-amber-400' },
};

interface ClassBadgeProps {
  d4Class: string;
  size?: 'sm' | 'md';
}

export function ClassBadge({ d4Class, size = 'md' }: ClassBadgeProps) {
  const s = CLASS_STYLES[d4Class] ?? CLASS_STYLES.barbarian;
  const sizing =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 gap-1'
      : 'text-xs px-2 py-1 gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium uppercase tracking-wide ${s.bg} ${s.text} ${s.border} ${sizing}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {d4Class}
    </span>
  );
}
