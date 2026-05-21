'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteBuildButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function destroy() {
    if (!confirm(`Delete "${title}"? This will also delete its votes, comments and skills.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/builds/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={destroy}
      disabled={busy}
      className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-zinc-800 hover:bg-red-700 text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
    >
      {busy ? '…' : 'delete'}
    </button>
  );
}
