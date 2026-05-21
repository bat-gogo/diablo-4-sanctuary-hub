import { ok } from '@/lib/api';

/**
 * Proxy the diablo4.life community tracker. We cache server-side for 60s
 * (Next.js fetch cache) so a refresh of the EventTracker doesn't hammer
 * their API. If the upstream is down we fall back to the same cyclic
 * calculation the client used in the first iteration.
 */
const D4LIFE_URL = 'https://diablo4.life/api/trackers/list';

const HELLTIDE_CYCLE  = 60 * 60 * 1000; // 60 min total
const HELLTIDE_ACTIVE = 55 * 60 * 1000; // 55 min on
const WORLDBOSS_CYCLE = 210 * 60 * 1000;
const LEGION_CYCLE    = 25 * 60 * 1000;
const ANCHOR          = Date.UTC(2025, 0, 1, 0, 0, 0);
const BOSSES = [
  'Ashava the Pestilent',
  'Wandering Death',
  'Avarice, the Gold Cursed',
  'Grigoire, the Galvanic Saint',
];

type EventsResponse = {
  helltide:  { nextSpawn: number | null; chestRespawn: number | null };
  worldBoss: { name: string; nextSpawn: number | null };
  legion:    { nextSpawn: number | null };
  source: 'diablo4.life' | 'calculated';
  cachedAt: number;
};

function fallback(): EventsResponse {
  const now = Date.now();
  const elapsed = now - ANCHOR;
  const htPos = elapsed % HELLTIDE_CYCLE;
  const htActive = htPos < HELLTIDE_ACTIVE;
  const htNext = htActive
    ? now + (HELLTIDE_ACTIVE - htPos)
    : now + (HELLTIDE_CYCLE - htPos);

  const bossIdx = Math.floor(elapsed / WORLDBOSS_CYCLE) % BOSSES.length;
  const bossNext = now + (WORLDBOSS_CYCLE - (elapsed % WORLDBOSS_CYCLE));

  const legionNext = now + (LEGION_CYCLE - (now % LEGION_CYCLE));

  return {
    helltide:  { nextSpawn: htNext, chestRespawn: null },
    worldBoss: { name: BOSSES[(bossIdx + 1) % BOSSES.length], nextSpawn: bossNext },
    legion:    { nextSpawn: legionNext },
    source: 'calculated',
    cachedAt: now,
  };
}

export async function GET() {
  try {
    const res = await fetch(D4LIFE_URL, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'SanctuaryHub/1.0 (fan site, educational capstone)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`d4life ${res.status}`);
    const data = (await res.json()) as {
      helltide?: { time?: number };
      worldBoss?: { name?: string; time?: number };
      nextWorldBoss?: { name?: string; time?: number };
      zoneEvent?: { time?: number };
      chestRespawn?: number;
    };
    const wb = data.worldBoss ?? data.nextWorldBoss ?? {};
    return ok<EventsResponse>({
      helltide: {
        nextSpawn: data.helltide?.time ?? null,
        chestRespawn: data.chestRespawn ?? null,
      },
      worldBoss: {
        name: wb.name ?? 'Unknown',
        nextSpawn: wb.time ?? null,
      },
      legion: {
        nextSpawn: data.zoneEvent?.time ?? null,
      },
      source: 'diablo4.life',
      cachedAt: Date.now(),
    });
  } catch {
    return ok(fallback());
  }
}
