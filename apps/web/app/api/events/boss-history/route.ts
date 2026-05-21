import { desc } from 'drizzle-orm';
import { worldBossHistory } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { ok } from '@/lib/api';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 100);

  const rows = await db
    .select({
      id: worldBossHistory.id,
      bossName: worldBossHistory.bossName,
      location: worldBossHistory.location,
      spawnedAt: worldBossHistory.spawnedAt,
      reportedBy: worldBossHistory.reportedBy,
      tier: worldBossHistory.tier,
    })
    .from(worldBossHistory)
    .orderBy(desc(worldBossHistory.spawnedAt))
    .limit(limit);

  return ok({ reports: rows });
}
