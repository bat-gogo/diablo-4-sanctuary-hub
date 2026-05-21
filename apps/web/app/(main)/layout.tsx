import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@sanctuary-hub/db';
import { eq } from 'drizzle-orm';
import { Navbar } from '@/components/Navbar';
import { CommandPalette } from '@/components/CommandPalette';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';
import { PageTransition } from '@/components/PageTransition';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('token')?.value ?? null;
  const payload = token ? await verifyToken(token) : null;

  let user:
    | { battletag: string; avatarUrl: string | null; role: string }
    | null = null;
  if (payload) {
    const [row] = await db
      .select({
        battletag: users.battletag,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    if (row) user = row;
  }

  return (
    <CommandPaletteProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar user={user} />
        <main className="pt-16 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="bg-zinc-950 border-t border-zinc-800 py-6">
          <p className="text-center text-zinc-600 text-sm px-4">
            Sanctuary Hub © 2026 — Fan site, not affiliated with Blizzard Entertainment
          </p>
        </footer>
        <CommandPalette />
      </div>
    </CommandPaletteProvider>
  );
}
