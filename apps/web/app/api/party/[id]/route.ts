import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { partyRequests } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/auth';

/**
 * Admin-only edit. Activity stays immutable (it's foundational to how
 * other code groups parties); description / minLevel / spotsTotal / status
 * are all editable. If spotsTotal is reduced below the current spotsFilled
 * we reject — the admin should manually decrement filled (future feature)
 * or just delete the request.
 */
const PARTY_STATUSES = ['open', 'full', 'closed'] as const;
const patchSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  minLevel: z.number().int().min(1).max(100).optional(),
  spotsTotal: z.number().int().min(2).max(4).optional(),
  status: z.enum(PARTY_STATUSES).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, 'admin');
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

  const [existing] = await db
    .select({
      spotsFilled: partyRequests.spotsFilled,
      spotsTotal: partyRequests.spotsTotal,
    })
    .from(partyRequests)
    .where(eq(partyRequests.id, id))
    .limit(1);
  if (!existing) return err('Party request not found', 404);

  if (
    parsed.data.spotsTotal !== undefined &&
    parsed.data.spotsTotal < existing.spotsFilled
  ) {
    return err(
      `spotsTotal cannot drop below current spotsFilled (${existing.spotsFilled})`,
      400,
    );
  }

  // Auto-derive status if spotsTotal changes (full ↔ open) unless caller
  // explicitly set status.
  const next: typeof parsed.data & { spotsFilled?: number } = { ...parsed.data };
  if (parsed.data.spotsTotal !== undefined && parsed.data.status === undefined) {
    next.status =
      existing.spotsFilled >= parsed.data.spotsTotal ? 'full' : 'open';
  }

  const [updated] = await db
    .update(partyRequests)
    .set(next)
    .where(eq(partyRequests.id, id))
    .returning();

  return ok({ request: updated });
}

/**
 * Delete: owner of the request or any admin.
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
    .select({ userId: partyRequests.userId })
    .from(partyRequests)
    .where(eq(partyRequests.id, id))
    .limit(1);
  if (!existing) return err('Party request not found', 404);

  const isOwner = existing.userId === user.userId;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) return err('Forbidden', 403);

  await db.delete(partyRequests).where(eq(partyRequests.id, id));
  return ok({ deleted: true, id });
}

// Keep imports referenced (sql + and) in case future helpers need them.
void sql;
void and;
