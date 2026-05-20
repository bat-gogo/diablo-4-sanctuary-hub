import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { builds as buildsTable, users } from '@sanctuary-hub/db';
import { ClassBadge } from '@/components/ClassBadge';
import { PlaystyleBadge } from '@/components/PlaystyleBadge';

export const metadata = { title: 'Dashboard — Sanctuary Hub' };

export default async function DashboardPage() {
  const token = (await cookies()).get('token')?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) redirect('/login');

  const [me] = await db
    .select({
      battletag: users.battletag,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  const myBuilds = await db
    .select({
      id: buildsTable.id,
      title: buildsTable.title,
      class: buildsTable.class,
      season: buildsTable.season,
      playstyle: buildsTable.playstyle,
      views: buildsTable.views,
      createdAt: buildsTable.createdAt,
    })
    .from(buildsTable)
    .where(eq(buildsTable.userId, payload.userId))
    .limit(20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
            Welcome back
          </p>
          <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
            {me?.battletag.split('#')[0] ?? 'Wanderer'}
            <span className="text-zinc-600 text-2xl font-mono ml-2">
              #{me?.battletag.split('#')[1]}
            </span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2">{me?.email}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wide ${
              me?.role === 'admin'
                ? 'bg-amber-900/60 text-amber-300 border border-amber-800'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {me?.role}
          </span>
          {me?.role === 'admin' && (
            <Link
              href="/admin"
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Admin panel →
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="My builds" value={myBuilds.length.toString()} />
        <StatCard
          label="Total views"
          value={myBuilds.reduce((s, b) => s + b.views, 0).toLocaleString()}
        />
        <StatCard
          label="Joined"
          value={me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : '—'}
        />
      </div>

      {/* My builds */}
      <h2 className="text-white text-2xl font-bold mb-4">My builds</h2>
      {myBuilds.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-400">You haven't published any builds yet.</p>
          <Link
            href="/builds/create"
            className="inline-block mt-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded-lg"
          >
            Create your first build
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {myBuilds.map((b) => (
            <li
              key={b.id}
              className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/builds/${b.id}`}
                    className="text-white font-semibold hover:text-amber-300 truncate block"
                  >
                    {b.title}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <ClassBadge d4Class={b.class} size="sm" />
                    <PlaystyleBadge playstyle={b.playstyle} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
                      S{b.season}
                    </span>
                  </div>
                </div>
                <span className="text-zinc-500 text-xs tabular-nums">
                  👁 {b.views.toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-800 rounded-xl p-5">
      <p className="text-zinc-500 text-xs uppercase tracking-wide font-semibold">
        {label}
      </p>
      <p className="text-white text-3xl font-black mt-1 tabular-nums">{value}</p>
    </div>
  );
}
