export function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'admin'
      ? 'bg-amber-900/60 text-amber-300 border-amber-800'
      : role === 'guest'
      ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
      : 'bg-zinc-700 text-zinc-300 border-zinc-600';
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-wide rounded border px-1.5 py-0.5 ${cls}`}
    >
      {role}
    </span>
  );
}
