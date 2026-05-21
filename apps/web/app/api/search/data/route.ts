import { asc } from 'drizzle-orm';
import { builds, items, skills } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { ok } from '@/lib/api';

/**
 * Lightweight bundle for client-side Fuse.js indexing. Everything fits in
 * a single ~120 KB response (800 builds + 189 skills + 109 items × a few
 * fields each). Cached on the edge for 5 minutes.
 */
export async function GET() {
  const [b, s, i] = await Promise.all([
    db
      .select({
        id: builds.id,
        title: builds.title,
        class: builds.class,
        season: builds.season,
        playstyle: builds.playstyle,
      })
      .from(builds)
      .orderBy(asc(builds.title))
      .limit(2000),
    db
      .select({
        id: skills.id,
        name: skills.name,
        class: skills.class,
        type: skills.type,
      })
      .from(skills)
      .orderBy(asc(skills.name)),
    db
      .select({
        id: items.id,
        name: items.name,
        type: items.type,
        isUnique: items.isUnique,
        isMythic: items.isMythic,
      })
      .from(items)
      .orderBy(asc(items.name)),
  ]);
  return ok({ builds: b, skills: s, items: i });
}

export const revalidate = 300;
