import { and, eq } from 'drizzle-orm';
import { comments } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  const { id: buildId, commentId } = await params;

  // Look up the comment first so we can compare ownership before deleting.
  const [row] = await db
    .select({ userId: comments.userId, buildId: comments.buildId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!row) return err('Comment not found', 404);
  if (row.buildId !== buildId) return err('Comment belongs to a different build', 400);

  const isOwner = row.userId === user.userId;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) return err('Forbidden', 403);

  await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.buildId, buildId)));

  return ok({ deleted: true, id: commentId });
}
