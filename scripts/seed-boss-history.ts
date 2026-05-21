/**
 * Mirror diablo4.life's world-boss community report history into our
 * world_boss_history table. Idempotent via the `source_id` unique key —
 * re-running just inserts new reports we haven't seen before.
 *
 * Usage: tsx scripts/seed-boss-history.ts
 */

import 'dotenv/config';
import { getDb, worldBossHistory } from '../packages/db/src/index';

const UA = 'SanctuaryHub/1.0 (educational capstone)';
const URL = 'https://diablo4.life/api/trackers/worldBoss/reportHistory';

interface UpstreamReport {
  _id: string;
  name: string;
  location: string;
  spawnTime: number;
  reportTime?: number;
  tier?: number;
  user?: { displayName?: string; battleTag?: string };
}

async function main() {
  const db = getDb();
  console.log(`Fetching ${URL} …`);

  const res = await fetch(URL, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`upstream ${res.status}`);
  }
  const body = (await res.json()) as { reports?: UpstreamReport[] };
  const reports = body.reports ?? [];
  console.log(`Got ${reports.length} reports`);

  if (reports.length === 0) {
    console.log('Nothing to insert.');
    process.exit(0);
  }

  // Normalize (clean NBSP whitespace in locations, trim battletag).
  const rows = reports
    .filter((r) => r._id && r.name && r.spawnTime)
    .map((r) => ({
      sourceId: r._id,
      bossName: r.name,
      location: r.location.replace(/ /g, ' ').trim(),
      spawnedAt: new Date(r.spawnTime),
      reportedBy:
        (r.user?.battleTag || r.user?.displayName || null)?.slice(0, 128) ?? null,
      tier: r.tier ?? null,
    }));

  // Insert in batches; ON CONFLICT skips already-imported ids.
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const out = await db
      .insert(worldBossHistory)
      .values(chunk)
      .onConflictDoNothing({ target: worldBossHistory.sourceId })
      .returning({ id: worldBossHistory.id });
    inserted += out.length;
  }

  console.log(`✓ Inserted ${inserted} new reports (${rows.length - inserted} already present)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
