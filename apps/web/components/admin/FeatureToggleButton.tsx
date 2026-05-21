'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  id: string;
  initialFeatured: boolean;
}

export function FeatureToggleButton({ id, initialFeatured }: Props) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initialFeatured);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/builds/${id}/feature`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && !json.error) {
        setFeatured(json.data.isFeatured);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded transition-colors ${
        featured
          ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
          : 'bg-zinc-700 hover:bg-amber-700 text-zinc-300 hover:text-amber-100'
      } disabled:opacity-50`}
    >
      {featured ? '★ unfeature' : 'feature'}
    </button>
  );
}
