'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  /** Layout flavor. `pills` = two side-by-side compact buttons (navbar);
   *  `stack` = full-width stacked buttons (mobile drawer). */
  variant?: 'pills' | 'stack';
  /** Called after a successful login (e.g. to close the mobile drawer). */
  onSuccess?: () => void;
}

const ACCOUNTS = [
  {
    label: 'Admin demo',
    short: 'Admin',
    role: 'admin' as const,
    email: 'admin@sanctuaryhub.gg',
    password: 'AdminPass123!',
    redirect: '/admin',
    cls: 'from-amber-600 to-amber-500 text-white border-amber-400',
  },
  {
    label: 'User demo',
    short: 'User',
    role: 'user' as const,
    email: 'user@test.com',
    password: 'Password123!',
    redirect: '/dashboard',
    cls: 'from-zinc-700 to-zinc-600 text-white border-zinc-500',
  },
];

export function DemoLoginButtons({ variant = 'pills', onSuccess }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'admin' | 'user' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginAs(acc: (typeof ACCOUNTS)[number]) {
    setBusy(acc.role);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        setError(json.error ?? 'Login failed');
        return;
      }
      onSuccess?.();
      router.push(acc.redirect);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (variant === 'stack') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-semibold mt-1">
          Quick demo
        </p>
        {ACCOUNTS.map((a) => (
          <button
            key={a.role}
            onClick={() => loginAs(a)}
            disabled={busy !== null}
            className={`bg-gradient-to-r ${a.cls} border rounded-lg px-3 py-2 text-sm font-bold transition-opacity disabled:opacity-50 inline-flex items-center justify-between gap-2`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>{a.role === 'admin' ? '◈' : '◇'}</span>
              {a.label}
            </span>
            {busy === a.role ? <span className="text-xs">…</span> : null}
          </button>
        ))}
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <span className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold mr-1 hidden lg:inline">
        Demo
      </span>
      {ACCOUNTS.map((a) => (
        <button
          key={a.role}
          onClick={() => loginAs(a)}
          disabled={busy !== null}
          title={`Log in as ${a.label} (${a.email})`}
          className={`relative inline-flex items-center gap-1 bg-gradient-to-r ${a.cls} border rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span aria-hidden className="opacity-80">
            {a.role === 'admin' ? '◈' : '◇'}
          </span>
          {a.short}
          {busy === a.role && (
            <span className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          )}
        </button>
      ))}
      {error && (
        <span className="text-red-400 text-[10px] ml-2 hidden lg:inline">{error}</span>
      )}
    </div>
  );
}
