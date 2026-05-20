import Link from 'next/link';

export const metadata = { title: 'Tier List — Sanctuary Hub' };

export default function TierListPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
        Sanctum of Power
      </p>
      <h1 className="text-white text-5xl font-black mt-2">Tier List</h1>
      <p className="text-zinc-500 mt-4 text-lg">
        Class and build rankings for the current season — coming soon.
      </p>
      <div className="mt-10 inline-block bg-zinc-800/50 border border-zinc-800 rounded-xl p-8">
        <div className="text-6xl mb-2">📜</div>
        <p className="text-zinc-400 text-sm">
          We're hand-curating the next ranking. <br />
          Check back after the next patch.
        </p>
      </div>
      <div className="mt-8">
        <Link
          href="/builds"
          className="text-amber-400 hover:text-amber-300 text-sm font-medium"
        >
          Browse builds in the meantime →
        </Link>
      </div>
    </div>
  );
}
