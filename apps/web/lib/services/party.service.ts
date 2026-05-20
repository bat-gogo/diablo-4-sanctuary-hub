import 'server-only';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import { partyRequests, users } from '@sanctuary-hub/db';
import { db } from '@/lib/db';

export type PartyRequestWithUser = {
  id: string;
  activity: string;
  description: string | null;
  minLevel: number;
  spotsTotal: number;
  spotsFilled: number;
  status: string;
  createdAt: Date;
  user: { id: string; battletag: string; avatarUrl: string | null };
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export async function getPartyRequests(filters: {
  activity?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ requests: PartyRequestWithUser[]; nextCursor: string | null }> {
  const limit = clampLimit(filters.limit);

  let cursorAnchor: { createdAt: Date; id: string } | null = null;
  if (filters.cursor) {
    const [row] = await db
      .select({ createdAt: partyRequests.createdAt, id: partyRequests.id })
      .from(partyRequests)
      .where(eq(partyRequests.id, filters.cursor))
      .limit(1);
    if (row) cursorAnchor = row;
  }

  const where = [
    filters.activity ? eq(partyRequests.activity, filters.activity as never) : undefined,
    filters.status ? eq(partyRequests.status, filters.status as never) : undefined,
    cursorAnchor
      ? or(
          lt(partyRequests.createdAt, cursorAnchor.createdAt),
          and(
            eq(partyRequests.createdAt, cursorAnchor.createdAt),
            lt(partyRequests.id, cursorAnchor.id),
          ),
        )
      : undefined,
  ].filter(Boolean) as never[];

  const rows = await db
    .select({
      id: partyRequests.id,
      activity: partyRequests.activity,
      description: partyRequests.description,
      minLevel: partyRequests.minLevel,
      spotsTotal: partyRequests.spotsTotal,
      spotsFilled: partyRequests.spotsFilled,
      status: partyRequests.status,
      createdAt: partyRequests.createdAt,
      userId: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
    })
    .from(partyRequests)
    .innerJoin(users, eq(partyRequests.userId, users.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(partyRequests.createdAt), desc(partyRequests.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    requests: page.map((r) => ({
      id: r.id,
      activity: r.activity,
      description: r.description,
      minLevel: r.minLevel,
      spotsTotal: r.spotsTotal,
      spotsFilled: r.spotsFilled,
      status: r.status,
      createdAt: r.createdAt,
      user: { id: r.userId, battletag: r.battletag, avatarUrl: r.avatarUrl },
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function createPartyRequest(
  userId: string,
  data: {
    activity: string;
    description?: string;
    minLevel: number;
    spotsTotal: number;
  },
): Promise<string> {
  const [inserted] = await db
    .insert(partyRequests)
    .values({
      userId,
      activity: data.activity as never,
      description: data.description ?? null,
      minLevel: data.minLevel,
      spotsTotal: data.spotsTotal,
    })
    .returning({ id: partyRequests.id });
  return inserted.id;
}

/**
 * Atomic join: bumps spotsFilled only if the request is still open and has
 * room, and flips status to 'full' if that fills the last spot. Uses a
 * single UPDATE so we don't race against other joiners.
 */
export async function joinPartyRequest(requestId: string): Promise<{
  ok: boolean;
  spotsFilled: number;
  spotsTotal: number;
  status: string;
}> {
  const result = await db
    .update(partyRequests)
    .set({
      spotsFilled: sql`${partyRequests.spotsFilled} + 1`,
      status: sql<'open' | 'full'>`CASE
        WHEN ${partyRequests.spotsFilled} + 1 >= ${partyRequests.spotsTotal}
          THEN 'full'
        ELSE ${partyRequests.status}
      END`,
    })
    .where(
      and(
        eq(partyRequests.id, requestId),
        eq(partyRequests.status, 'open'),
        sql`${partyRequests.spotsFilled} < ${partyRequests.spotsTotal}`,
      ),
    )
    .returning({
      spotsFilled: partyRequests.spotsFilled,
      spotsTotal: partyRequests.spotsTotal,
      status: partyRequests.status,
    });

  if (result.length === 0) {
    return { ok: false, spotsFilled: 0, spotsTotal: 0, status: 'unavailable' };
  }
  return {
    ok: true,
    spotsFilled: result[0].spotsFilled,
    spotsTotal: result[0].spotsTotal,
    status: result[0].status,
  };
}
