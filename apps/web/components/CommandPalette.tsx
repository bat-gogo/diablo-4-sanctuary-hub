'use client';

import { Command } from 'cmdk';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';

interface BuildRow {
  id: string;
  title: string;
  class: string;
  season: number;
  playstyle: string;
}
interface SkillRow {
  id: string;
  name: string;
  class: string;
  type: string;
}
interface ItemRow {
  id: string;
  name: string;
  type: string;
  isUnique: boolean;
  isMythic: boolean;
}
interface SearchData {
  builds: BuildRow[];
  skills: SkillRow[];
  items: ItemRow[];
}

const FUSE_OPTS: IFuseOptions<unknown> = {
  threshold: 0.32,
  ignoreLocation: true,
};

const CLASS_DOT: Record<string, string> = {
  barbarian: 'bg-red-400',
  druid: 'bg-green-400',
  necromancer: 'bg-purple-400',
  rogue: 'bg-yellow-400',
  sorcerer: 'bg-blue-400',
  spiritborn: 'bg-teal-400',
  paladin: 'bg-amber-400',
  warlock: 'bg-slate-400',
};

const QUICK_ACTIONS = [
  { label: 'Browse builds',  href: '/builds',   icon: '⚔' },
  { label: 'Party Finder',   href: '/party',    icon: '👥' },
  { label: 'Events tracker', href: '/events',   icon: '⚡' },
  { label: 'Tier list',      href: '/tier-list', icon: '🏆' },
  { label: 'Meta dashboard', href: '/meta',     icon: '📊' },
  { label: 'Classes',        href: '/classes',  icon: '✦' },
];

export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchData | null>(null);

  // Load index when the palette is first opened.
  useEffect(() => {
    if (!open || data) return;
    let live = true;
    void fetch('/api/search/data')
      .then((r) => r.json())
      .then((j) => {
        if (live) setData(j.data ?? null);
      });
    return () => {
      live = false;
    };
  }, [open, data]);

  // Cmd/Ctrl + K shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const fuses = useMemo(() => {
    if (!data) return null;
    return {
      builds: new Fuse(data.builds, { ...FUSE_OPTS, keys: ['title', 'class', 'playstyle'] }),
      skills: new Fuse(data.skills, { ...FUSE_OPTS, keys: ['name', 'class', 'type'] }),
      items:  new Fuse(data.items,  { ...FUSE_OPTS, keys: ['name', 'type'] }),
    };
  }, [data]);

  const results = useMemo(() => {
    if (!fuses || !query.trim()) {
      return { builds: [] as BuildRow[], skills: [] as SkillRow[], items: [] as ItemRow[] };
    }
    return {
      builds: fuses.builds.search(query, { limit: 5 }).map((r) => r.item),
      skills: fuses.skills.search(query, { limit: 4 }).map((r) => r.item),
      items:  fuses.items.search(query,  { limit: 4 }).map((r) => r.item),
    };
  }, [fuses, query]);

  function go(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const noResults =
    hasQuery && results.builds.length === 0 && results.skills.length === 0 && results.items.length === 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Sanctuary Hub command palette"
      shouldFilter={false}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm pt-[10vh] px-4"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder={data ? 'Search builds, skills, items, players…' : 'Loading index…'}
          className="w-full bg-transparent border-b border-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-500 outline-none"
        />
        <Command.List className="max-h-[400px] overflow-y-auto py-2">
          {!hasQuery && (
            <Command.Group heading="Quick actions" className="px-2 py-1">
              {QUICK_ACTIONS.map((a) => (
                <Command.Item
                  key={a.href}
                  value={a.label}
                  onSelect={() => go(a.href)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-zinc-200 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-amber-300 transition-colors"
                >
                  <span className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                    {a.icon}
                  </span>
                  <span className="flex-1 text-sm">{a.label}</span>
                  <span className="text-xs text-zinc-600">→</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {hasQuery && results.builds.length > 0 && (
            <Command.Group heading="Builds" className="px-2 py-1">
              {results.builds.map((b) => (
                <Command.Item
                  key={b.id}
                  value={`build-${b.id}-${b.title}`}
                  onSelect={() => go(`/builds/${b.id}`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-zinc-200 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-amber-300 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full ${CLASS_DOT[b.class] ?? 'bg-zinc-400'}`} />
                  <span className="flex-1 truncate text-sm">{b.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {b.class} · S{b.season}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {hasQuery && results.skills.length > 0 && (
            <Command.Group heading="Skills" className="px-2 py-1">
              {results.skills.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`skill-${s.id}-${s.name}`}
                  onSelect={() => go(`/builds?search=${encodeURIComponent(s.name)}`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-zinc-200 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-amber-300 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full ${CLASS_DOT[s.class] ?? 'bg-zinc-400'}`} />
                  <span className="flex-1 text-sm">{s.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {s.class} · {s.type}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {hasQuery && results.items.length > 0 && (
            <Command.Group heading="Items" className="px-2 py-1">
              {results.items.map((it) => (
                <Command.Item
                  key={it.id}
                  value={`item-${it.id}-${it.name}`}
                  onSelect={() => go(`/items?search=${encodeURIComponent(it.name)}`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-zinc-200 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-amber-300 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="flex-1 text-sm">{it.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {it.type}
                    {it.isMythic && <span className="text-amber-400 ml-1">mythic</span>}
                    {!it.isMythic && it.isUnique && <span className="text-orange-400 ml-1">unique</span>}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {noResults && (
            <div className="px-6 py-10 text-center text-zinc-500">
              <p className="text-sm">No results for &ldquo;{query}&rdquo;.</p>
              <p className="text-xs mt-1 text-zinc-600">
                Try a class name, skill, or build keyword.
              </p>
            </div>
          )}
        </Command.List>
        <div className="border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-[10px] text-zinc-600">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
              ⌘K
            </kbd>{' '}
            to toggle
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
