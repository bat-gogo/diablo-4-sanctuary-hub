'use client';

import { useEffect, useState } from 'react';
import { assetUrl, ASSETS, eventImage } from '@sanctuary-hub/types';

// 2025-01-01T00:00:00Z — shared anchor for all cyclic D4 events.
const ANCHOR = Date.UTC(2025, 0, 1, 0, 0, 0);

const HELLTIDE_CYCLE  = 75 * 60 * 1000; // 75 min total cycle
const HELLTIDE_ACTIVE = 55 * 60 * 1000; // 55 min active
const WORLDBOSS_CYCLE = 210 * 60 * 1000; // 3.5 h
const LEGION_CYCLE    = 25 * 60 * 1000;  // 25 min

const WORLD_BOSSES = [
  'Ashava the Pestilent',
  'Wandering Death',
  'Avarice the Gold Cursed',
  'Grigoire, the Galvanic Saint',
];

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface EventState {
  isActive: boolean;
  timeLeft: number;
  subtitle: string;
}

function computeHelltide(now: number): EventState {
  const elapsed = now - ANCHOR;
  const pos = elapsed % HELLTIDE_CYCLE;
  const isActive = pos < HELLTIDE_ACTIVE;
  return {
    isActive,
    timeLeft: isActive ? HELLTIDE_ACTIVE - pos : HELLTIDE_CYCLE - pos,
    subtitle: isActive ? 'Hell rains on Sanctuary' : 'Next demonic surge',
  };
}

function computeWorldBoss(now: number): EventState {
  const elapsed = now - ANCHOR;
  const bossIndex = Math.floor(elapsed / WORLDBOSS_CYCLE) % WORLD_BOSSES.length;
  return {
    isActive: false,
    timeLeft: WORLDBOSS_CYCLE - (elapsed % WORLDBOSS_CYCLE),
    subtitle: `Next: ${WORLD_BOSSES[(bossIndex + 1) % WORLD_BOSSES.length]}`,
  };
}

function computeLegion(now: number): EventState {
  return {
    isActive: false,
    timeLeft: LEGION_CYCLE - (now % LEGION_CYCLE),
    subtitle: 'Legion event spawn',
  };
}

interface EventConfig {
  key: 'helltide' | 'worldboss' | 'legion';
  label: string;
  description: string;
  compute: (now: number) => EventState;
}

const EVENTS: EventConfig[] = [
  { key: 'helltide',  label: 'Helltide',   description: 'Demonic surge — farm Aberrant Cinders', compute: computeHelltide },
  { key: 'worldboss', label: 'World Boss', description: 'World boss spawn — gather your party',  compute: computeWorldBoss },
  { key: 'legion',    label: 'Legion Event', description: 'Gathering Legion — every 25 minutes', compute: computeLegion },
];

export function EventTracker() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {EVENTS.map((evt) => {
        const state = now === null ? null : evt.compute(now);
        return (
          <div
            key={evt.key}
            className="bg-zinc-800/60 backdrop-blur border border-zinc-700 rounded-xl p-5 hover:border-amber-500/40 transition-colors flex flex-col gap-3 min-h-[150px]"
          >
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
                <h3 className="text-white font-bold text-lg leading-tight">{evt.label}</h3>
                <p className="text-zinc-500 text-xs">{evt.description}</p>
              </div>
              {state && (
                <span
                  className={`text-[10px] px-2 py-1 rounded-md font-bold tracking-wide ${
                    state.isActive
                      ? 'bg-red-900 text-red-300 animate-pulse'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {state.isActive ? '● ACTIVE' : 'NEXT IN'}
                </span>
              )}
            </div>
            <div className="mt-auto">
              <div className="text-amber-400 font-mono text-3xl font-bold tabular-nums">
                {state ? formatDuration(state.timeLeft) : '--:--'}
              </div>
              <p className="text-zinc-500 text-xs mt-1">
                {state?.subtitle ?? 'Calculating…'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to silence unused-imports for assetUrl/ASSETS during build cache.
void assetUrl;
void ASSETS;
