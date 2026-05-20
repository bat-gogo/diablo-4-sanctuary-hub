'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { assetUrl, ASSETS } from '@sanctuary-hub/types';

interface NavbarProps {
  user: { battletag: string; avatarUrl: string | null } | null;
}

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/builds',    label: 'Builds' },
  { href: '/items',     label: 'Items' },
  { href: '/party',     label: 'Party Finder' },
  { href: '/tier-list', label: 'Tier List' },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const avatarSrc = user?.avatarUrl ?? assetUrl(ASSETS.ui.avatarPlaceholder);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg group">
          <span className="text-amber-500 text-2xl leading-none group-hover:rotate-12 transition-transform">⚔</span>
          <span className="tracking-wide">Sanctuary Hub</span>
        </Link>

        {/* Center links (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? 'text-amber-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                title="Log out"
              >
                Logout
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt={user.battletag}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800"
                style={
                  avatarSrc.endsWith('.svg')
                    ? { filter: 'invert(60%) sepia(50%) saturate(500%) hue-rotate(5deg)' }
                    : undefined
                }
              />
              <span className="text-zinc-300 text-sm hidden lg:inline">
                {user.battletag.split('#')[0]}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 -mr-2 text-zinc-300 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm font-medium ${
                  isActive(l.href)
                    ? 'text-amber-400'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-zinc-800 mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block py-2 text-zinc-300 text-sm"
                  >
                    Dashboard ({user.battletag.split('#')[0]})
                  </Link>
                  <button
                    onClick={() => { setOpen(false); void handleLogout(); }}
                    className="block py-2 text-zinc-500 text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="block py-2 text-zinc-300 text-sm">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="block py-2 text-amber-400 text-sm font-semibold">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
