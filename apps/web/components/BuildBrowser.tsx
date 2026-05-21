'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BuildCard } from './BuildCard';
import { BuildCardSkeleton } from './BuildCardSkeleton';
import { StaggerList, StaggerItem } from './MotionWrapper';
import type { BuildWithMeta } from '@/lib/services/builds.service';

interface BuildBrowserProps {
  initialBuilds: BuildWithMeta[];
  initialNextCursor: string | null;
}

interface Filters {
  class: string;
  season: number; // 0 = any
  playstyle: string;
  search: string;
}

const EMPTY_FILTERS: Filters = { class: '', season: 0, playstyle: '', search: '' };

const CLASSES = ['barbarian', 'druid', 'necromancer', 'rogue', 'sorcerer', 'spiritborn', 'paladin', 'warlock'];
const CLASS_ACTIVE_BG: Record<string, string> = {
  barbarian: 'bg-red-600 text-white',
  druid: 'bg-green-600 text-white',
  necromancer: 'bg-purple-600 text-white',
  rogue: 'bg-yellow-600 text-zinc-900',
  sorcerer: 'bg-blue-600 text-white',
  spiritborn: 'bg-teal-600 text-white',
  paladin: 'bg-amber-600 text-white',
  warlock: 'bg-slate-600 text-white',
};

const PLAYSTYLES = ['leveling', 'endgame', 'pit', 'helltide', 'pvp'];
const PLAYSTYLE_ACTIVE_BG: Record<string, string> = {
  leveling: 'bg-zinc-500 text-zinc-900',
  endgame: 'bg-orange-600 text-white',
  pit: 'bg-red-700 text-white',
  helltide: 'bg-rose-600 text-white',
  pvp: 'bg-violet-600 text-white',
};

const SEASONS = [3, 4, 5, 6, 7];

function pillClass(active: boolean, activeBg: string) {
  return `px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
    active ? activeBg : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
  }`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function BuildBrowser({ initialBuilds, initialNextCursor }: BuildBrowserProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [builds, setBuilds] = useState<BuildWithMeta[]>(initialBuilds);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  const buildParams = useCallback((f: Filters, cursor?: string | null) => {
    const p = new URLSearchParams();
    if (f.class)     p.set('class', f.class);
    if (f.season)    p.set('season', String(f.season));
    if (f.playstyle) p.set('playstyle', f.playstyle);
    if (f.search)    p.set('search', f.search);
    if (cursor)      p.set('cursor', cursor);
    p.set('limit', '24');
    return p;
  }, []);

  const runFetch = useCallback(
    async (f: Filters, append: boolean, cursor: string | null) => {
      const seq = ++requestSeq.current;
      if (append) setIsFetchingMore(true);
      else setIsLoading(true);
      try {
        const res = await fetch(`/api/builds?${buildParams(f, cursor)}`);
        const json = await res.json();
        if (seq !== requestSeq.current) return; // stale, ignore
        const newBuilds: BuildWithMeta[] = json.data?.builds ?? [];
        setNextCursor(json.data?.nextCursor ?? null);
        setBuilds((prev) => (append ? [...prev, ...newBuilds] : newBuilds));
      } finally {
        if (seq === requestSeq.current) {
          if (append) setIsFetchingMore(false);
          else setIsLoading(false);
        }
      }
    },
    [buildParams],
  );

  // Debounced fetch when filters change (skip initial render where filters == EMPTY)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runFetch(filters, false, null);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, runFetch]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const hasFilters =
    filters.class !== '' ||
    filters.season !== 0 ||
    filters.playstyle !== '' ||
    filters.search !== '';

  function loadMore() {
    if (!nextCursor || isFetchingMore) return;
    void runFetch(filters, true, nextCursor);
  }

  return (
    <div>
      {/* Filter bar — sticky under the navbar */}
      <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          {/* Row 1: search */}
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search builds…"
              className="w-full md:w-80 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
            {hasFilters && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-zinc-500 hover:text-white text-sm underline ml-auto whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Row 2: class pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            <button
              onClick={() => updateFilter('class', '')}
              className={pillClass(filters.class === '', 'bg-zinc-200 text-zinc-900')}
            >
              All classes
            </button>
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => updateFilter('class', filters.class === c ? '' : c)}
                className={pillClass(filters.class === c, CLASS_ACTIVE_BG[c])}
              >
                {capitalize(c)}
              </button>
            ))}
          </div>

          {/* Row 3: season + playstyle pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 flex-wrap">
            <button
              onClick={() => updateFilter('season', 0)}
              className={pillClass(filters.season === 0, 'bg-amber-500 text-zinc-900')}
            >
              All seasons
            </button>
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => updateFilter('season', filters.season === s ? 0 : s)}
                className={pillClass(filters.season === s, 'bg-amber-600 text-white')}
              >
                S{s}
              </button>
            ))}

            <span className="w-px bg-zinc-800 mx-1 self-stretch" />

            <button
              onClick={() => updateFilter('playstyle', '')}
              className={pillClass(filters.playstyle === '', 'bg-zinc-200 text-zinc-900')}
            >
              All playstyles
            </button>
            {PLAYSTYLES.map((p) => (
              <button
                key={p}
                onClick={() => updateFilter('playstyle', filters.playstyle === p ? '' : p)}
                className={pillClass(filters.playstyle === p, PLAYSTYLE_ACTIVE_BG[p])}
              >
                {capitalize(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-zinc-500 text-sm">
            Showing <span className="text-zinc-300 font-semibold">{builds.length}</span> build
            {builds.length === 1 ? '' : 's'}
            {hasFilters && <span className="text-amber-400/70"> · filtered</span>}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <BuildCardSkeleton key={i} />
            ))}
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <span className="text-6xl">🔍</span>
            <h3 className="text-white text-xl font-bold">No builds found</h3>
            <p className="text-zinc-500">Try adjusting your filters.</p>
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2 rounded-lg mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <StaggerList
              key={`${filters.class}-${filters.season}-${filters.playstyle}-${filters.search}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {builds.map((b) => (
                <StaggerItem key={b.id}>
                  <BuildCard build={b} />
                </StaggerItem>
              ))}
            </StaggerList>
          </AnimatePresence>
        )}

        {!isLoading && builds.length > 0 && (
          <div className="mt-8 flex justify-center">
            {nextCursor ? (
              <button
                onClick={loadMore}
                disabled={isFetchingMore}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white border border-zinc-700 rounded-xl px-8 py-3 w-full max-w-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                {isFetchingMore && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {isFetchingMore ? 'Loading…' : 'Load more builds'}
              </button>
            ) : (
              <p className="text-zinc-600 text-sm">You've seen all builds.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
