import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import {
  builds,
  comments,
  partyRequests,
  users,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { FeatureToggleButton } from '@/components/admin/FeatureToggleButton';
import { MakeAdminButton } from '@/components/admin/MakeAdminButton';

export default async function AdminOverviewPage() {
  const [
    [{ users: userCount }],
    [{ builds: buildCount }],
    [{ open: openParties }],
    [{ comments: commentCount }],
    [{ views: totalViews }],
    recentBuilds,
    recentUsers,
  ] = await Promise.all([
    db.select({ users: sql<number>`COUNT(*)::int` }).from(users),
    db.select({ builds: sql<number>`COUNT(*)::int` }).from(builds),
    db
      .select({ open: sql<number>`COUNT(*)::int` })
      .from(partyRequests)
      .where(sql`${partyRequests.status} = 'open'`),
    db.select({ comments: sql<number>`COUNT(*)::int` }).from(comments),
    db.select({ views: sql<number>`COALESCE(SUM(${builds.views}), 0)::int` }).from(builds),
    db
      .select({
        id: builds.id,
        title: builds.title,
        class: builds.class,
        season: builds.season,
        views: builds.views,
        isFeatured: builds.isFeatured,
        author: users.battletag,
        createdAt: builds.createdAt,
      })
      .from(builds)
      .innerJoin(users, sql`${builds.userId} = ${users.id}`)
      .orderBy(desc(builds.createdAt))
      .limit(10),
    db
      .select({
        id: users.id,
        battletag: users.battletag,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Users"        value={userCount.toLocaleString()} />
        <Stat label="Builds"       value={buildCount.toLocaleString()} />
        <Stat label="Open parties" value={openParties.toLocaleString()} />
        <Stat label="Total views"  value={totalViews.toLocaleString()} />
        <Stat label="Comments"     value={commentCount.toLocaleString()} className="sm:col-span-2 md:col-span-4" />
      </section>

      {/* Recent builds */}
      <section>
        <header className="flex items-end justify-between mb-3">
          <h2 className="text-white text-xl font-bold">Recent builds</h2>
          <Link href="/admin/builds" className="text-amber-400 hover:text-amber-300 text-sm">
            View all →
          </Link>
        </header>
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <Th>Title</Th><Th>Class</Th><Th>Author</Th><Th>S</Th>
                <Th align="right">Views</Th><Th align="center">★</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {recentBuilds.map((b) => (
                <tr key={b.id} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                  <Td>
                    <Link href={`/builds/${b.id}`} className="text-white hover:text-amber-300">
                      {b.title}
                    </Link>
                  </Td>
                  <Td className="capitalize text-zinc-400">{b.class}</Td>
                  <Td className="text-zinc-400">{b.author.split('#')[0]}</Td>
                  <Td className="text-amber-400">{b.season}</Td>
                  <Td align="right" className="text-zinc-300 tabular-nums">
                    {b.views.toLocaleString()}
                  </Td>
                  <Td align="center">
                    {b.isFeatured && (
                      <span className="text-amber-400" title="Featured">★</span>
                    )}
                  </Td>
                  <Td>
                    <FeatureToggleButton id={b.id} initialFeatured={b.isFeatured} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent users */}
      <section>
        <header className="flex items-end justify-between mb-3">
          <h2 className="text-white text-xl font-bold">Recent users</h2>
          <Link href="/admin/users" className="text-amber-400 hover:text-amber-300 text-sm">
            View all →
          </Link>
        </header>
        <div className="overflow-x-auto border border-zinc-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <Th>Battletag</Th><Th>Email</Th><Th>Role</Th><Th>Joined</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                  <Td className="text-white font-medium">{u.battletag}</Td>
                  <Td className="text-zinc-400">{u.email}</Td>
                  <Td>
                    <RoleBadge role={u.role} />
                  </Td>
                  <Td className="text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Td>
                  <Td>
                    {u.role !== 'admin' && (
                      <MakeAdminButton id={u.id} battletag={u.battletag} />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`bg-zinc-800 border border-zinc-700 rounded-xl p-6 ${className}`}>
      <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
        {label}
      </p>
      <p className="text-amber-400 text-3xl font-black tabular-nums mt-1">
        {value}
      </p>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th className={`px-3 py-2 text-xs uppercase tracking-wide font-semibold text-${align}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return <td className={`px-3 py-2 text-${align} ${className}`}>{children}</td>;
}

export function RoleBadge({ role }: { role: string }) {
  const cls =
    role === 'admin'
      ? 'bg-amber-900/60 text-amber-300 border-amber-800'
      : role === 'guest'
      ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
      : 'bg-zinc-700 text-zinc-300 border-zinc-600';
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide rounded border px-1.5 py-0.5 ${cls}`}>
      {role}
    </span>
  );
}
