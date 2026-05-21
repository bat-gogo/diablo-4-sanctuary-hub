import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { builds } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { getBuildById, incrementViews } from '@/lib/services/builds.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const build = await getBuildById(id);
  if (!build) return err('Build not found', 404);
  // Fire-and-forget view bump; don't block the response on it.
  incrementViews(id).catch(() => {});
  return ok({ build });
}

const PLAYSTYLES = ['leveling', 'endgame', 'pit', 'helltide', 'pvp'] as const;

// Class isn't editable from this route — changing class would invalidate the
// linked buildSkills rows (which are class-scoped via the skills table). The
// skillIds list is also not editable here for the same reason; a future
// version can ship a full re-edit flow that wipes + re-inserts buildSkills.
const patchSchema = z.object({
  title: z.string().min(3).max(128).optional(),
  description: z.string().max(5000).optional().nullable(),
  season: z.number().int().min(1).max(20).optional(),
  playstyle: z.enum(PLAYSTYLES).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON', 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }
  if (Object.keys(parsed.data).length === 0) {
    return err('No fields to update', 400);
  }

  // Ownership + admin-bypass guard.
  const [existing] = await db
    .select({ userId: builds.userId })
    .from(builds)
    .where(eq(builds.id, id))
    .limit(1);
  if (!existing) return err('Build not found', 404);

  const isOwner = existing.userId === user.userId;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) return err('Forbidden', 403);

  const where = isAdmin
    ? eq(builds.id, id)
    : and(eq(builds.id, id), eq(builds.userId, user.userId));

  const [updated] = await db
    .update(builds)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(where)
    .returning();

  return ok({ build: updated });
}

/**
 * Delete a build. Allowed for the owner or any admin. ON DELETE CASCADE
 * on buildSkills / votes / comments cleans up the dependent rows.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;
  const [existing] = await db
    .select({ userId: builds.userId })
    .from(builds)
    .where(eq(builds.id, id))
    .limit(1);
  if (!existing) return err('Build not found', 404);

  const isOwner = existing.userId === user.userId;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) return err('Forbidden', 403);

  await db.delete(builds).where(eq(builds.id, id));
  return ok({ deleted: true, id });
}
