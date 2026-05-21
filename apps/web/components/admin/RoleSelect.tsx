'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ROLES = ['guest', 'user', 'admin'] as const;

interface Props {
  id: string;
  current: string;
  selfId?: string;
}

export function RoleSelect({ id, current, selfId }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isSelf = selfId === id;

  async function change(role: string) {
    if (role === value || isSelf) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setErr(json.error ?? 'Failed');
        return;
      }
      setValue(role);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={busy || isSelf}
        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {err && <span className="text-red-400 text-[10px]">{err}</span>}
      {isSelf && <span className="text-zinc-600 text-[10px]">you</span>}
    </div>
  );
}
