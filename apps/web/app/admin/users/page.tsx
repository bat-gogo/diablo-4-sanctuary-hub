import { cookies } from 'next/headers';
import { desc, eq, ilike, sql } from 'drizzle-orm';
import { builds, users } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { RoleBadge } from '@/app/admin/page';

export const metadata = { title: 'Users — Admin' };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const token = (await cookies()).get('token')?.value ?? null;
  const me = token ? await verifyToken(token) : null;

  const rows = await db
    .select({
      id: users.id,
      battletag: users.battletag,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      buildCount: sql<number>`COUNT(${builds.id})::int`,
    })
    .from(users)
    .leftJoin(builds, eq(builds.userId, users.id))
    .where(search ? ilike(users.battletag, `%${search}%`) : undefined)
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(50);

  return (
    <div>
      <header className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-white text-xl font-bold">All users</h2>
        <form className="flex items-center gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Search battletag…"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
          />
          <button
            type="submit"
            className="text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            Search
          </button>
        </form>
      </header>

      <div className="overflow-x-auto border border-zinc-800 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-zinc-400">
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Battletag</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Email</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Role</th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wide font-semibold">Builds</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Joined</th>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-semibold">Change role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                <td className="px-3 py-2 text-white font-medium">{u.battletag}</td>
                <td className="px-3 py-2 text-zinc-400 text-xs">{u.email}</td>
                <td className="px-3 py-2"><RoleBadge role={u.role} /></td>
                <td className="px-3 py-2 text-right text-zinc-300 tabular-nums">
                  {u.buildCount}
                </td>
                <td className="px-3 py-2 text-zinc-500 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <RoleSelect id={u.id} current={u.role} selfId={me?.userId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-zinc-600 text-xs mt-3">
        Showing {rows.length} user{rows.length === 1 ? '' : 's'}
        {search && <> matching "{search}"</>}.
      </p>
    </div>
  );
}
