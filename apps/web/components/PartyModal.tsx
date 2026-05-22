'use client';

import { useEffect, useState } from 'react';

const ACTIVITIES = [
  { key: 'helltide',          label: 'Helltide' },
  { key: 'world_boss',        label: 'World Boss' },
  { key: 'nightmare_dungeon', label: 'Nightmare Dungeon' },
  { key: 'uber_boss',         label: 'Uber Boss' },
  { key: 'pit',               label: 'Pit' },
  { key: 'pvp',               label: 'PvP' },
  { key: 'leveling',          label: 'Leveling' },
] as const;

const STATUSES = ['open', 'full', 'closed'] as const;

export interface PartyInitial {
  id: string;
  activity: string;
  description: string | null;
  minLevel: number;
  spotsTotal: number;
  spotsFilled?: number;
  status?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Edit existing — admin only. Omit to create. */
  initial?: PartyInitial | null;
  /** True when the caller is an admin (enables status field in edit mode). */
  adminMode?: boolean;
}

export function PartyModal({ open, onClose, onSuccess, initial, adminMode }: Props) {
  const isEdit = !!initial;

  const [activity, setActivity] = useState<string>('helltide');
  const [description, setDescription] = useState('');
  const [minLevel, setMinLevel] = useState(60);
  const [spotsTotal, setSpotsTotal] = useState(4);
  const [status, setStatus] = useState<string>('open');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state on open / initial change.
  useEffect(() => {
    if (initial) {
      setActivity(initial.activity);
      setDescription(initial.description ?? '');
      setMinLevel(initial.minLevel);
      setSpotsTotal(initial.spotsTotal);
      setStatus(initial.status ?? 'open');
    } else {
      setActivity('helltide');
      setDescription('');
      setMinLevel(60);
      setSpotsTotal(4);
      setStatus('open');
    }
    setError(null);
  }, [initial, open]);

  // ESC + body scroll lock
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = isEdit ? `/api/party/${initial!.id}` : '/api/party';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit
        ? {
            description: description || null,
            minLevel,
            spotsTotal,
            ...(adminMode ? { status } : {}),
          }
        : {
            activity,
            description: description || undefined,
            minLevel,
            spotsTotal,
          };
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? `Failed to ${isEdit ? 'update' : 'create'} party`);
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const filled = initial?.spotsFilled ?? 0;
  const totalTooLow = isEdit && spotsTotal < filled;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">
            {isEdit ? 'Edit party request' : 'Looking for group'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Activity picker (locked in edit mode) */}
        <div>
          <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">
            Activity{isEdit && <span className="ml-2 text-zinc-600 normal-case text-[10px]">(locked)</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITIES.map((a) => {
              const selected = activity === a.key;
              const disabled = isEdit;
              return (
                <button
                  key={a.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setActivity(a.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    selected
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                  } ${disabled && !selected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <label className="flex flex-col gap-1.5">
          <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
            Description <span className="text-zinc-600 normal-case">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What's the plan? Voice chat? Build/level requirements?"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none resize-y"
          />
          <span className="text-zinc-600 text-xs">{description.length}/500</span>
        </label>

        {/* Level + spots */}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
              Min Level <span className="text-amber-400 ml-1">{minLevel}</span>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              value={minLevel}
              onChange={(e) => setMinLevel(Number(e.target.value))}
              className="accent-amber-500"
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
              Spots total
            </span>
            <div className="flex gap-1.5">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSpotsTotal(n)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors border ${
                    spotsTotal === n
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {isEdit && (
              <p
                className={`text-xs ${
                  totalTooLow ? 'text-red-400' : 'text-zinc-600'
                }`}
              >
                {filled}/{spotsTotal} currently filled
              </p>
            )}
          </div>
        </div>

        {/* Status (admin edit only) */}
        {adminMode && isEdit && (
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">
              Status
            </p>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors border ${
                    status === s
                      ? s === 'open'
                        ? 'bg-green-700 text-white border-green-600'
                        : s === 'full'
                        ? 'bg-red-700 text-white border-red-600'
                        : 'bg-zinc-700 text-white border-zinc-600'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || totalTooLow}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {submitting
              ? isEdit ? 'Saving…' : 'Posting…'
              : isEdit ? 'Save changes' : 'Post party'}
          </button>
        </div>
      </form>
    </div>
  );
}
