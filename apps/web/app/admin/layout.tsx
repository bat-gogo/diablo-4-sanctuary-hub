import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyToken } from '@/lib/auth';
import { AdminSidebar } from '@/components/AdminSidebar';

export const metadata = { title: 'Admin — Sanctuary Hub' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('token')?.value ?? null;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) redirect('/login');
  if (payload.role !== 'admin') redirect('/');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
      <AdminSidebar />
      <div className="min-w-0">
        <header className="mb-6">
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">
            Control Room
          </p>
          <h1 className="text-white text-3xl md:text-4xl font-black mt-1">
            Admin Panel
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Signed in as <span className="text-zinc-300 font-mono">{payload.email}</span>{' '}
            ·{' '}
            <Link href="/" className="text-amber-400 hover:text-amber-300">
              ← Back to site
            </Link>
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
