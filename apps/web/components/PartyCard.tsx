'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ActivityBadge } from './ActivityBadge';
import { PartyModal, type PartyInitial } from './PartyModal';
import { timeAgo } from '@/lib/timeAgo';
import type { PartyRequestWithUser } from '@/lib/services/party.service';

function spotsColor(filled: number, total: number): string {
  if (filled >= total) return 'text-red-400';
  if (total - filled === 1) return 'text-orange-400';
  return 'text-green-400';
}

interface Props {
  request: PartyRequestWithUser;
  /** When provided, action buttons become available. */
  viewerId?: string | null;
  viewerRole?: string | null;
}

export function PartyCard({ request: r, viewerId = null, viewerRole = null }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'join' | 'delete' | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = viewerId != null && r.user.id === viewerId;
  const isAdmin = viewerRole === 'admin';
  const isLoggedIn = viewerId != null;

  const isFull = r.spotsFilled >= r.spotsTotal;
  const isOpen = r.status === 'open' && !isFull;
  const canJoin = isLoggedIn && isOpen && !isOwner;

  async function join() {
    setBusy('join');
    setError(null);
    try {
      const res = await fetch(`/api/party/${r.id}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      const j = await res.json();
      if (!res.ok || j.error) {
        setError(j.error ?? 'Failed to join');
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`Delete this party request?`)) return;
    setBusy('delete');
    setError(null);
    try {
      const res = await fetch(`/api/party/${r.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json();
      if (!res.ok || j.error) {
        setError(j.error ?? 'Failed to delete');
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const editInitial: PartyInitial = {
    id: r.id,
    activity: r.activity,
    description: r.description,
    minLevel: r.minLevel,
    spotsTotal: r.spotsTotal,
    spotsFilled: r.spotsFilled,
    status: r.status,
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-zinc-500 transition-colors flex flex-col gap-3 min-h-[160px]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ActivityBadge activity={r.activity} />
        <div className="flex items-center gap-2 text-xs">
          {r.status === 'closed' && (
            <span className="text-zinc-500 uppercase tracking-wide font-bold">
              closed
            </span>
          )}
          {isFull && r.status !== 'closed' && (
            <span className="text-red-400 uppercase tracking-wide font-bold">
              full
            </span>
          )}
          <span className="text-zinc-500">
            Lvl <span className="text-zinc-300 font-medium">{r.minLevel}+</span>
          </span>
        </div>
      </div>

      <p className="text-zinc-200 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
        {r.description ?? '—'}
      </p>

      <div className="flex items-center justify-between text-xs gap-2">
        <span className="text-zinc-500 truncate">
          by <span className="text-zinc-300">{r.user.battletag.split('#')[0]}</span>
          <span className="text-zinc-600 ml-2">{timeAgo(r.createdAt)}</span>
        </span>
        <span
          className={`font-mono font-bold ${spotsColor(r.spotsFilled, r.spotsTotal)}`}
        >
          {r.spotsFilled}/{r.spotsTotal}
        </span>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded px-2 py-1">
          {error}
        </p>
      )}

      {/* Actions (only when a viewer is logged in) */}
      {isLoggedIn && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800 mt-1">
          {canJoin ? (
            <button
              onClick={join}
              disabled={busy !== null}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
            >
              {busy === 'join' ? '…' : '+ Join'}
            </button>
          ) : isOwner ? (
            <span className="text-zinc-500 text-xs italic">Your request</span>
          ) : !isOpen ? (
            <span className="text-zinc-600 text-xs italic">
              {isFull ? 'No spots left' : 'Not accepting'}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={() => setEditOpen(true)}
                className="text-zinc-500 hover:text-amber-400 p-1 transition-colors"
                aria-label="Edit party"
                title="Edit party (admin)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z" />
                </svg>
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button
                onClick={remove}
                disabled={busy !== null}
                className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                aria-label="Delete party"
                title={isAdmin && !isOwner ? 'Delete party (admin)' : 'Delete party'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <PartyModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => router.refresh()}
        initial={editInitial}
        adminMode={isAdmin}
      />
    </div>
  );
}
