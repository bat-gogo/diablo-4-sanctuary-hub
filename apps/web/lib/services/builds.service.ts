import 'server-only';
import { and, desc, eq, ilike, lt, or, sql } from 'drizzle-orm';
import {
  builds,
  buildSkills,
  comments,
  skills,
  users,
  votes,
} from '@sanctuary-hub/db';
import { db } from '@/lib/db';

export type BuildFilters = {
  class?: string;
  season?: number;
  playstyle?: string;
  search?: string;
  cursor?: string;
  limit?: number;
};

export type BuildWithMeta = {
  id: string;
  title: string;
  description: string | null;
  class: string;
  season: number;
  playstyle: string;
  isFeatured: boolean;
  views: number;
  createdAt: Date;
  user: { id: string; battletag: string; avatarUrl: string | null };
  voteScore: number;
  commentCount: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

/**
 * Cursor pagination over builds. Cursor is the previous page's last build id;
 * we look it up to read its createdAt, then page using the stable
 * (createdAt DESC, id DESC) tuple so newer builds always come first and
 * ties on createdAt are broken by id.
 */
export async function getBuilds(filters: BuildFilters): Promise<{
  builds: BuildWithMeta[];
  nextCursor: string | null;
}> {
  const limit = clampLimit(filters.limit);

  // Resolve cursor → createdAt anchor.
  let cursorAnchor: { createdAt: Date; id: string } | null = null;
  if (filters.cursor) {
    const [row] = await db
      .select({ createdAt: builds.createdAt, id: builds.id })
      .from(builds)
      .where(eq(builds.id, filters.cursor))
      .limit(1);
    if (row) cursorAnchor = row;
  }

  const where = [
    filters.class ? eq(builds.class, filters.class as never) : undefined,
    filters.season ? eq(builds.season, filters.season) : undefined,
    filters.playstyle ? eq(builds.playstyle, filters.playstyle as never) : undefined,
    filters.search ? ilike(builds.title, `%${filters.search}%`) : undefined,
    cursorAnchor
      ? or(
          lt(builds.createdAt, cursorAnchor.createdAt),
          and(
            eq(builds.createdAt, cursorAnchor.createdAt),
            lt(builds.id, cursorAnchor.id),
          ),
        )
      : undefined,
  ].filter(Boolean);

  // Fetch limit + 1 to detect "has more".
  const rows = await db
    .select({
      id: builds.id,
      title: builds.title,
      description: builds.description,
      class: builds.class,
      season: builds.season,
      playstyle: builds.playstyle,
      isFeatured: builds.isFeatured,
      views: builds.views,
      createdAt: builds.createdAt,
      userId: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
      voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)`.as('vote_score'),
      commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`.as('comment_count'),
    })
    .from(builds)
    .innerJoin(users, eq(builds.userId, users.id))
    .leftJoin(votes, eq(votes.buildId, builds.id))
    .leftJoin(comments, eq(comments.buildId, builds.id))
    .where(where.length ? and(...(where as never[])) : undefined)
    .groupBy(builds.id, users.id)
    .orderBy(desc(builds.createdAt), desc(builds.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    builds: page.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      class: r.class,
      season: r.season,
      playstyle: r.playstyle,
      isFeatured: r.isFeatured,
      views: r.views,
      createdAt: r.createdAt,
      user: {
        id: r.userId,
        battletag: r.battletag,
        avatarUrl: r.avatarUrl,
      },
      voteScore: Number(r.voteScore),
      commentCount: Number(r.commentCount),
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

/**
 * Top builds ranked by aggregated vote score (then views as tie-breaker).
 * Used to populate the tier list.
 */
export async function getTierListBuilds(
  limit = 200,
): Promise<BuildWithMeta[]> {
  const rows = await db
    .select({
      id: builds.id,
      title: builds.title,
      description: builds.description,
      class: builds.class,
      season: builds.season,
      playstyle: builds.playstyle,
      isFeatured: builds.isFeatured,
      views: builds.views,
      createdAt: builds.createdAt,
      userId: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
      voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)`.as('vote_score'),
      commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`.as('comment_count'),
    })
    .from(builds)
    .innerJoin(users, eq(builds.userId, users.id))
    .leftJoin(votes, eq(votes.buildId, builds.id))
    .leftJoin(comments, eq(comments.buildId, builds.id))
    .groupBy(builds.id, users.id)
    .orderBy(
      sql`COALESCE(SUM(${votes.value}), 0) DESC`,
      desc(builds.views),
    )
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    class: r.class,
    season: r.season,
    playstyle: r.playstyle,
    isFeatured: r.isFeatured,
    views: r.views,
    createdAt: r.createdAt,
    user: { id: r.userId, battletag: r.battletag, avatarUrl: r.avatarUrl },
    voteScore: Number(r.voteScore),
    commentCount: Number(r.commentCount),
  }));
}

export async function getFeaturedBuilds(
  limit = 6,
): Promise<BuildWithMeta[]> {
  const rows = await db
    .select({
      id: builds.id,
      title: builds.title,
      description: builds.description,
      class: builds.class,
      season: builds.season,
      playstyle: builds.playstyle,
      isFeatured: builds.isFeatured,
      views: builds.views,
      createdAt: builds.createdAt,
      userId: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
      voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)`.as('vote_score'),
      commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`.as('comment_count'),
    })
    .from(builds)
    .innerJoin(users, eq(builds.userId, users.id))
    .leftJoin(votes, eq(votes.buildId, builds.id))
    .leftJoin(comments, eq(comments.buildId, builds.id))
    .where(eq(builds.isFeatured, true))
    .groupBy(builds.id, users.id)
    .orderBy(desc(builds.views))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    class: r.class,
    season: r.season,
    playstyle: r.playstyle,
    isFeatured: r.isFeatured,
    views: r.views,
    createdAt: r.createdAt,
    user: { id: r.userId, battletag: r.battletag, avatarUrl: r.avatarUrl },
    voteScore: Number(r.voteScore),
    commentCount: Number(r.commentCount),
  }));
}

export type BuildDetail = BuildWithMeta & {
  buildSkills: Array<{
    slot: number;
    rank: number;
    skill: {
      id: string;
      name: string;
      type: string;
      iconSlug: string | null;
      description: string | null;
    };
  }>;
};

export async function getBuildById(id: string): Promise<BuildDetail | null> {
  const [row] = await db
    .select({
      id: builds.id,
      title: builds.title,
      description: builds.description,
      class: builds.class,
      season: builds.season,
      playstyle: builds.playstyle,
      isFeatured: builds.isFeatured,
      views: builds.views,
      createdAt: builds.createdAt,
      userId: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
      voteScore: sql<number>`COALESCE(SUM(${votes.value}), 0)`.as('vote_score'),
      commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`.as('comment_count'),
    })
    .from(builds)
    .innerJoin(users, eq(builds.userId, users.id))
    .leftJoin(votes, eq(votes.buildId, builds.id))
    .leftJoin(comments, eq(comments.buildId, builds.id))
    .where(eq(builds.id, id))
    .groupBy(builds.id, users.id)
    .limit(1);

  if (!row) return null;

  const skillRows = await db
    .select({
      slot: buildSkills.slot,
      rank: buildSkills.rank,
      id: skills.id,
      name: skills.name,
      type: skills.type,
      iconSlug: skills.iconSlug,
      description: skills.description,
    })
    .from(buildSkills)
    .innerJoin(skills, eq(buildSkills.skillId, skills.id))
    .where(eq(buildSkills.buildId, id))
    .orderBy(buildSkills.slot);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    class: row.class,
    season: row.season,
    playstyle: row.playstyle,
    isFeatured: row.isFeatured,
    views: row.views,
    createdAt: row.createdAt,
    user: { id: row.userId, battletag: row.battletag, avatarUrl: row.avatarUrl },
    voteScore: Number(row.voteScore),
    commentCount: Number(row.commentCount),
    buildSkills: skillRows.map((s) => ({
      slot: s.slot,
      rank: s.rank,
      skill: {
        id: s.id,
        name: s.name,
        type: s.type,
        iconSlug: s.iconSlug,
        description: s.description,
      },
    })),
  };
}

export async function getUserVote(
  userId: string,
  buildId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: votes.value })
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.buildId, buildId)))
    .limit(1);
  return row?.value ?? 0;
}

export async function createBuild(
  userId: string,
  data: {
    title: string;
    description?: string;
    class: string;
    season: number;
    playstyle: string;
    skillIds: Array<{ skillId: string; rank: number; slot: number }>;
  },
): Promise<string> {
  const [inserted] = await db
    .insert(builds)
    .values({
      userId,
      title: data.title,
      description: data.description ?? null,
      class: data.class as never,
      season: data.season,
      playstyle: data.playstyle as never,
    })
    .returning({ id: builds.id });

  if (data.skillIds.length > 0) {
    await db.insert(buildSkills).values(
      data.skillIds.map((s) => ({
        buildId: inserted.id,
        skillId: s.skillId,
        rank: s.rank,
        slot: s.slot,
      })),
    );
  }

  return inserted.id;
}

export async function incrementViews(buildId: string): Promise<void> {
  await db
    .update(builds)
    .set({ views: sql`${builds.views} + 1` })
    .where(eq(builds.id, buildId));
}

export async function upsertVote(
  userId: string,
  buildId: string,
  value: 1 | -1,
): Promise<number> {
  await db
    .insert(votes)
    .values({ userId, buildId, value })
    .onConflictDoUpdate({
      target: [votes.userId, votes.buildId],
      set: { value },
    });

  const [agg] = await db
    .select({
      score: sql<number>`COALESCE(SUM(${votes.value}), 0)`,
    })
    .from(votes)
    .where(eq(votes.buildId, buildId));

  return Number(agg?.score ?? 0);
}

export type BuildComment = {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; battletag: string; avatarUrl: string | null };
};

export async function getComments(
  buildId: string,
  opts: { cursor?: string; limit?: number } = {},
): Promise<{ comments: BuildComment[]; nextCursor: string | null }> {
  const limit = clampLimit(opts.limit);

  let cursorAnchor: { createdAt: Date; id: string } | null = null;
  if (opts.cursor) {
    const [row] = await db
      .select({ createdAt: comments.createdAt, id: comments.id })
      .from(comments)
      .where(eq(comments.id, opts.cursor))
      .limit(1);
    if (row) cursorAnchor = row;
  }

  const where = [
    eq(comments.buildId, buildId),
    cursorAnchor
      ? or(
          lt(comments.createdAt, cursorAnchor.createdAt),
          and(
            eq(comments.createdAt, cursorAnchor.createdAt),
            lt(comments.id, cursorAnchor.id),
          ),
        )
      : undefined,
  ].filter(Boolean) as never[];

  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(...where))
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    comments: page.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      user: { id: r.userId, battletag: r.battletag, avatarUrl: r.avatarUrl },
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function createComment(
  userId: string,
  buildId: string,
  content: string,
): Promise<BuildComment> {
  const [row] = await db
    .insert(comments)
    .values({ userId, buildId, content })
    .returning({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
    });

  const [u] = await db
    .select({
      id: users.id,
      battletag: users.battletag,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    user: { id: u.id, battletag: u.battletag, avatarUrl: u.avatarUrl },
  };
}
