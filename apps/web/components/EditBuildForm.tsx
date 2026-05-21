'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClassBadge } from './ClassBadge';

const PLAYSTYLES = ['leveling', 'endgame', 'pit', 'helltide', 'pvp'] as const;
const SEASONS = [3, 4, 5, 6, 7];

interface InitialBuild {
  id: string;
  title: string;
  description: string | null;
  class: string;
  season: number;
  playstyle: string;
}

export function EditBuildForm({ build }: { build: InitialBuild }) {
  const router = useRouter();
  const [title, setTitle] = useState(build.title);
  const [description, setDescription] = useState(build.description ?? '');
  const [season, setSeason] = useState(build.season);
  const [playstyle, setPlaystyle] = useState(build.playstyle);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    title !== build.title ||
    description !== (build.description ?? '') ||
    season !== build.season ||
    playstyle !== build.playstyle;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/builds/${build.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          season,
          playstyle,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to save build');
        return;
      }
      router.push(`/builds/${build.id}`);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Network error');
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!confirm(`Delete "${build.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/builds/${build.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Failed to delete');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      {/* Read-only class + skill summary */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
        <p className="text-zinc-500 text-xs uppercase tracking-wide font-semibold mb-2">
          Class (locked)
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <ClassBadge d4Class={build.class} size="md" />
          <span className="text-zinc-500 text-xs">
            To change the class, delete this build and create a new one.
          </span>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
          Title
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={128}
          required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-base focus:border-amber-500 outline-none"
        />
        <span className="text-zinc-600 text-xs">{title.length}/128 — min 3</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
            Season
          </span>
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>Season {s}</option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-1.5">
            Playstyle
          </p>
          <div className="flex flex-wrap gap-2">
            {PLAYSTYLES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlaystyle(p)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors border ${
                  playstyle === p
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          rows={6}
          placeholder="Describe your build, rotation, key aspects, leveling tips…"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:border-amber-500 outline-none resize-y"
        />
        <span className="text-zinc-600 text-xs">{description.length}/5000</span>
      </label>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
        <button
          type="button"
          onClick={destroy}
          disabled={deleting || saving}
          className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete build'}
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/builds/${build.id}`}
            className="text-zinc-400 hover:text-white px-4 py-2 text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
