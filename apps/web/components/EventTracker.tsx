'use client';

import { useEffect, useState } from 'react';
import { eventImage } from '@sanctuary-hub/types';

interface EventsApi {
  helltide:  { nextSpawn: number | null; chestRespawn: number | null };
  worldBoss: { name: string; nextSpawn: number | null };
  legion:    { nextSpawn: number | null };
  source: 'diablo4.life' | 'calculated';
  cachedAt: number;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface EventCard {
  key: 'helltide' | 'worldboss' | 'legion';
  label: string;
  description: string;
  /** Next spawn timestamp (ms), or null if unknown. */
  nextSpawn: number | null;
  /** Optional subtitle (e.g. boss name). */
  subtitle?: string;
}

export function EventTracker() {
  const [data, setData] = useState<EventsApi | null>(null);
  const [now, setNow] = useState<number | null>(null);

  // Fetch the events feed on mount + every 5 minutes.
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const r = await fetch('/api/events', { cache: 'no-store' });
        const j = await r.json();
        if (live) setData(j.data ?? null);
      } catch {
        /* ignore — UI shows "loading" until next try */
      }
    }
    void load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

  // 1Hz local tick for countdowns.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cards: EventCard[] = data
    ? [
        {
          key: 'helltide',
          label: 'Helltide',
          description: 'Demonic surge — farm Aberrant Cinders',
          nextSpawn: data.helltide.nextSpawn,
          subtitle: 'Next demonic surge',
        },
        {
          key: 'worldboss',
          label: 'World Boss',
          description: 'World boss spawn — gather your party',
          nextSpawn: data.worldBoss.nextSpawn,
          subtitle: data.worldBoss.name
            ? `Next: ${data.worldBoss.name}`
            : 'Boss spawn',
        },
        {
          key: 'legion',
          label: 'Legion Event',
          description: 'Gathering Legion — every 25 minutes',
          nextSpawn: data.legion.nextSpawn,
          subtitle: 'Legion event spawn',
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Source badge row */}
      {data && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              data.source === 'diablo4.life'
                ? 'bg-green-900/60 text-green-300 border border-green-800/60'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                data.source === 'diablo4.life' ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            {data.source === 'diablo4.life' ? 'Live · diablo4.life' : 'Estimated'}
          </span>
          <span>Updated {new Date(data.cachedAt).toLocaleTimeString()}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(cards.length > 0 ? cards : [null, null, null]).map((evt, i) => {
          const timeLeft =
            evt?.nextSpawn != null && now != null
              ? Math.max(0, evt.nextSpawn - now)
              : null;
          const isActive = timeLeft !== null && timeLeft <= 0;
          return (
            <div
              key={evt?.key ?? `placeholder-${i}`}
              className="bg-zinc-800/60 backdrop-blur border border-zinc-700 rounded-xl p-5 hover:border-amber-500/40 transition-colors flex flex-col gap-3 min-h-[160px]"
            >
              {evt ? (
                <>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={eventImage(evt.key)}
                      alt=""
                      width={40}
                      height={40}
                      style={{
                        filter:
                          'invert(80%) sepia(50%) saturate(500%) hue-rotate(5deg) brightness(1.1)',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {evt.label}
                      </h3>
                      <p className="text-zinc-500 text-xs">{evt.description}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-1 rounded-md font-bold tracking-wide ${
                        isActive
                          ? 'bg-red-900 text-red-300 animate-pulse'
                          : 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {isActive ? '● ACTIVE' : 'NEXT IN'}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <div className="text-amber-400 font-mono text-3xl font-bold tabular-nums">
                      {timeLeft != null ? formatDuration(timeLeft) : '--:--'}
                    </div>
                    <p className="text-zinc-500 text-xs mt-1 truncate">
                      {evt.subtitle ?? 'Loading…'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-zinc-600 text-sm animate-pulse">Loading event data…</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
