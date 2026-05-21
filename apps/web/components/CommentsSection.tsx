'use client';

import Link from 'next/link';
import { useState } from 'react';
import { assetUrl, ASSETS } from '@sanctuary-hub/types';
import { timeAgo } from '@/lib/timeAgo';

export type CommentWithUser = {
  id: string;
  content: string;
  createdAt: Date | string;
  user: { id: string; battletag: string; avatarUrl: string | null };
};

interface Props {
  buildId: string;
  initialComments: CommentWithUser[];
  initialNextCursor: string | null;
  currentUserId: string | null;
  currentUserRole: string | null;
  totalCount: number;
}

// Deterministic colour for the fallback avatar based on the battletag.
const AVATAR_PALETTE = [
  'bg-red-700',     'bg-orange-700',  'bg-amber-700',  'bg-yellow-700',
  'bg-lime-700',    'bg-green-700',   'bg-emerald-700','bg-teal-700',
  'bg-cyan-700',    'bg-sky-700',     'bg-blue-700',   'bg-indigo-700',
  'bg-violet-700',  'bg-purple-700',  'bg-fuchsia-700','bg-pink-700',
];

function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export function CommentsSection({
  buildId,
  initialComments,
  initialNextCursor,
  currentUserId,
  currentUserRole,
  totalCount,
}: Props) {
  const [list, setList] = useState<CommentWithUser[]>(initialComments);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/builds/${buildId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to post comment');
        return;
      }
      // Prepend optimistically.
      setList((prev) => [json.data.comment, ...prev]);
      setDraft('');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/builds/${buildId}/comments?cursor=${nextCursor}`,
      );
      const json = await res.json();
      setList((prev) => [...prev, ...(json.data?.comments ?? [])]);
      setNextCursor(json.data?.nextCursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this comment?')) return;
    const previous = list;
    setList(list.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/builds/${buildId}/comments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        // Roll back
        setList(previous);
      }
    } catch {
      setList(previous);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-white text-xl font-bold">
          💬 Comments <span className="text-zinc-500 text-sm font-normal">({totalCount})</span>
        </h2>
      </header>

      {/* Compose */}
      {currentUserId ? (
        <form
          onSubmit={submit}
          className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Share your thoughts on this build…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none resize-none"
          />
          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-500 text-xs tabular-nums">
              {draft.length}/2000
            </span>
            <button
              type="submit"
              disabled={submitting || !draft.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-2"
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center text-zinc-400">
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
            Log in
          </Link>{' '}
          to leave a comment.
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-10 text-center text-zinc-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((c) => {
            const battletagShort = c.user.battletag.split('#')[0];
            const canDelete =
              currentUserId === c.user.id || currentUserRole === 'admin';
            const fallbackBg = hashColor(c.user.battletag);
            const avatarSrc = c.user.avatarUrl;
            return (
              <li
                key={c.id}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4"
              >
                <header className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt={c.user.battletag}
                        className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm border border-zinc-700 ${fallbackBg}`}
                        aria-hidden
                      >
                        {battletagShort.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/players/${encodeURIComponent(c.user.battletag)}`}
                        className="text-white text-sm font-semibold hover:text-amber-300 truncate block"
                      >
                        {battletagShort}
                        <span className="text-zinc-600 font-mono ml-1 text-xs">
                          #{c.user.battletag.split('#')[1]}
                        </span>
                      </Link>
                      <span className="text-zinc-500 text-xs">
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => remove(c.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                      aria-label="Delete comment"
                      title="Delete comment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </button>
                  )}
                </header>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {c.content}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center mt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white border border-zinc-700 rounded-xl px-6 py-2 text-sm font-medium transition-colors"
          >
            {loadingMore ? 'Loading…' : 'Load more comments'}
          </button>
        </div>
      )}

      {/* Hidden placeholder so eslint doesn't complain about unused ui asset */}
      <span className="hidden" data-avatar-placeholder={assetUrl(ASSETS.ui.avatarPlaceholder)} />
    </section>
  );
}
