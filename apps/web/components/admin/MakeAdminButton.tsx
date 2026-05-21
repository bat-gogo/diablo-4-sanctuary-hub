'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  id: string;
  battletag: string;
}

export function MakeAdminButton({ id, battletag }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function promote() {
    if (!confirm(`Promote ${battletag} to admin?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={promote}
      disabled={busy}
      className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-zinc-700 hover:bg-amber-700 text-zinc-300 hover:text-amber-100 transition-colors disabled:opacity-50"
    >
      make admin
    </button>
  );
}
