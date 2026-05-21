'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin',          label: 'Overview',  icon: '◈' },
  { href: '/admin/users',    label: 'Users',     icon: '👥' },
  { href: '/admin/builds',   label: 'Builds',    icon: '⚔' },
  { href: '/admin/featured', label: 'Featured',  icon: '★' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="md:sticky md:top-24 md:self-start">
      <p className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-3 hidden md:block">
        Admin
      </p>
      <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-4 md:mx-0 px-4 md:px-0 pb-1 md:pb-0">
        {LINKS.map((l) => {
          const active =
            l.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="whitespace-nowrap">
              <Link
                href={l.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-900/40 text-amber-300 border border-amber-800/50'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span aria-hidden>{l.icon}</span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
