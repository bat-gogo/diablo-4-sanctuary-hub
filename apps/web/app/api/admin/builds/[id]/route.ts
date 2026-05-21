import { eq } from 'drizzle-orm';
import { builds } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { err, ok } from '@/lib/api';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, 'admin');
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;
  // The schema defines ON DELETE CASCADE for build_skills, comments, and
  // votes referencing builds.id, so deleting the build row cleans those up.
  const result = await db
    .delete(builds)
    .where(eq(builds.id, id))
    .returning({ id: builds.id });

  if (result.length === 0) return err('Build not found', 404);
  return ok({ id });
}
