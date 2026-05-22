'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClassBadge } from './ClassBadge';
import { PlaystyleBadge } from './PlaystyleBadge';

export interface MyBuild {
  id: string;
  title: string;
  class: string;
  season: number;
  playstyle: string;
  views: number;
}

export function MyBuildRow({ build }: { build: MyBuild }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`Delete "${build.title}"? Skills, votes and comments are removed too.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/builds/${build.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) {
        setError(j.error ?? 'Failed to delete');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-amber-500/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/builds/${build.id}`}
            className="text-white font-semibold hover:text-amber-300 truncate block"
          >
            {build.title}
          </Link>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <ClassBadge d4Class={build.class} size="sm" />
            <PlaystyleBadge playstyle={build.playstyle} />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
              S{build.season}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-zinc-500 text-xs tabular-nums">
            👁 {build.views.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/builds/${build.id}/edit`}
              className="text-zinc-500 hover:text-amber-400 p-1 transition-colors"
              aria-label="Edit build"
              title="Edit build"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z" />
              </svg>
            </Link>
            <button
              onClick={remove}
              disabled={busy}
              className="text-zinc-500 hover:text-red-400 p-1 transition-colors disabled:opacity-50"
              aria-label="Delete build"
              title="Delete build"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded px-2 py-1 mt-2">
          {error}
        </p>
      )}
    </li>
  );
}
