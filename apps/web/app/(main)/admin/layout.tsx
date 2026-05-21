import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { AdminSidebar } from '@/components/AdminSidebar';

export const metadata = { title: 'Admin — Sanctuary Hub' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('token')?.value ?? null;
  const payload = token ? await verifyToken(token) : null;

  // The middleware also guards /admin, but the layout double-checks so we
  // never accidentally render admin content if the middleware matcher is
  // misconfigured.
  if (!payload) redirect('/login');
  if (payload.role !== 'admin') redirect('/');

  return (
    <>
      {/* Hero banner — matches the visual rhythm of the public pages. */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(245,158,11,0.18) 0%, transparent 60%), linear-gradient(180deg, rgba(24,24,27,0.4), rgba(9,9,11,1))',
          }}
          aria-hidden
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
            Control Room
          </p>
          <h1 className="text-white text-4xl md:text-5xl font-black mt-1">
            Admin Panel
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Signed in as{' '}
            <span className="text-zinc-300 font-mono">{payload.email}</span>
          </p>
        </div>
      </section>

      {/* Body: sidebar + content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
