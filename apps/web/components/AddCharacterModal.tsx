'use client';

import { useEffect, useState } from 'react';
import { classImage } from '@sanctuary-hub/types';

const CLASSES = [
  'barbarian', 'druid', 'necromancer', 'rogue', 'sorcerer', 'spiritborn', 'paladin', 'warlock',
] as const;
const SEASONS = [3, 4, 5, 6, 7];

export interface InitialCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  season: number;
  isHardcore: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Optional — when present the modal switches to edit mode. */
  initial?: InitialCharacter | null;
}

export function AddCharacterModal({ open, onClose, onSuccess, initial }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState('');
  const [klass, setKlass] = useState<string>('');
  const [level, setLevel] = useState(60);
  const [season, setSeason] = useState(7);
  const [hardcore, setHardcore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with the initial character whenever it changes (or when the
  // modal flips between create and edit).
  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setKlass(initial.class);
      setLevel(initial.level);
      setSeason(initial.season);
      setHardcore(initial.isHardcore);
    } else {
      setName('');
      setKlass('');
      setLevel(60);
      setSeason(7);
      setHardcore(false);
    }
    setError(null);
  }, [initial, open]);

  // ESC to close + body-scroll lock.
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
    if (!klass || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const url = isEdit ? `/api/characters/${initial!.id}` : '/api/characters';
      const method = isEdit ? 'PATCH' : 'POST';
      // For edit, class can't change.
      const body = isEdit
        ? { name, level, season, isHardcore: hardcore }
        : { name, class: klass, level, season, isHardcore: hardcore };
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? `Failed to ${isEdit ? 'update' : 'create'} character`);
        return;
      }
      onSuccess();
      onClose();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

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
            {isEdit ? 'Edit character' : 'Add character'}
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

        <label className="flex flex-col gap-1.5">
          <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            placeholder="e.g. Lirath"
            required
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
          />
        </label>

        <div>
          <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">
            Class{isEdit && <span className="ml-2 text-zinc-600 normal-case text-[10px]">(locked)</span>}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {CLASSES.map((c) => {
              const selected = klass === c;
              const disabled = isEdit;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setKlass(c)}
                  className={`relative rounded-lg p-2 flex flex-col items-center gap-1.5 transition-all border ${
                    selected
                      ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/40'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                  } ${disabled && !selected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={classImage(c)}
                    alt={c}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover object-top rounded"
                  />
                  <span className="text-xs capitalize text-zinc-300">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
              Level <span className="text-amber-400 ml-1">{level}</span>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="accent-amber-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">Season</span>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>S{s}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span
            className={`relative w-10 h-6 rounded-full transition-colors ${
              hardcore ? 'bg-red-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                hardcore ? 'translate-x-4' : ''
              }`}
            />
          </span>
          <span className="text-zinc-300 text-sm">
            Hardcore <span className="text-zinc-500">(one life, no resurrections)</span>
          </span>
          <input
            type="checkbox"
            checked={hardcore}
            onChange={(e) => setHardcore(e.target.checked)}
            className="sr-only"
          />
        </label>

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
            disabled={submitting || !klass || !name.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {submitting
              ? isEdit ? 'Saving…' : 'Creating…'
              : isEdit ? 'Save changes' : 'Create character'}
          </button>
        </div>
      </form>
    </div>
  );
}
