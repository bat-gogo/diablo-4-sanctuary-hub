import 'server-only';
import { and, asc, eq, ilike, lt, or } from 'drizzle-orm';
import { items, skills } from '@sanctuary-hub/db';
import { db } from '@/lib/db';

export type ItemRow = {
  id: string;
  name: string;
  type: string;
  classRestriction: string | null;
  isUnique: boolean;
  isMythic: boolean;
  description: string | null;
  requiredLevel: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export async function getItems(filters: {
  type?: string;
  classRestriction?: string;
  isUnique?: boolean;
  isMythic?: boolean;
  search?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ items: ItemRow[]; nextCursor: string | null }> {
  const limit = clampLimit(filters.limit);

  // Cursor pages by name ASC, id ASC for a stable alphabetical browse.
  let cursorAnchor: { name: string; id: string } | null = null;
  if (filters.cursor) {
    const [row] = await db
      .select({ name: items.name, id: items.id })
      .from(items)
      .where(eq(items.id, filters.cursor))
      .limit(1);
    if (row) cursorAnchor = row;
  }

  const where = [
    filters.type ? eq(items.type, filters.type as never) : undefined,
    filters.classRestriction
      ? eq(items.classRestriction, filters.classRestriction as never)
      : undefined,
    filters.isUnique !== undefined ? eq(items.isUnique, filters.isUnique) : undefined,
    filters.isMythic !== undefined ? eq(items.isMythic, filters.isMythic) : undefined,
    filters.search ? ilike(items.name, `%${filters.search}%`) : undefined,
    cursorAnchor
      ? or(
          lt(items.name, cursorAnchor.name),
          and(eq(items.name, cursorAnchor.name), lt(items.id, cursorAnchor.id)),
        )
      : undefined,
  ].filter(Boolean) as never[];

  const rows = await db
    .select()
    .from(items)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(items.name), asc(items.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export type SkillRow = {
  id: string;
  name: string;
  class: string;
  description: string | null;
  maxRank: number;
  type: string;
  iconSlug: string | null;
};

export async function getSkills(filters: { class?: string }): Promise<SkillRow[]> {
  const where = filters.class
    ? eq(skills.class, filters.class as never)
    : undefined;

  return db
    .select()
    .from(skills)
    .where(where)
    .orderBy(asc(skills.type), asc(skills.name));
}
