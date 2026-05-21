'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClassBadge } from './ClassBadge';
import { AddCharacterModal, type InitialCharacter } from './AddCharacterModal';

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  season: number;
  isHardcore: boolean;
}

export function MyCharacters({ initial }: { initial: Character[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InitialCharacter | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(c: Character) {
    setEditing(c);
    setOpen(true);
  }

  async function remove(id: string) {
    if (!confirm('Delete this character?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-2xl font-bold">My Characters</h2>
        <button
          onClick={openCreate}
          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors inline-flex items-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span> Add character
        </button>
      </div>

      {initial.length === 0 ? (
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-400">You haven&apos;t created any characters yet.</p>
          <button
            onClick={openCreate}
            className="inline-block mt-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded-lg"
          >
            Create your first character
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {initial.map((c) => (
            <li
              key={c.id}
              className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-zinc-500 transition-colors flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{c.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <ClassBadge d4Class={c.class} size="sm" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 font-medium">
                    Lvl {c.level}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 font-medium">
                    S{c.season}
                  </span>
                  {c.isHardcore && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/70 text-red-300 font-bold">
                      ⚠ HC
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(c)}
                  className="text-zinc-500 hover:text-amber-400 p-1 transition-colors"
                  aria-label="Edit character"
                  title="Edit character"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => remove(c.id)}
                  disabled={deletingId === c.id}
                  className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  aria-label="Delete character"
                  title="Delete character"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddCharacterModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => router.refresh()}
        initial={editing}
      />
    </>
  );
}
