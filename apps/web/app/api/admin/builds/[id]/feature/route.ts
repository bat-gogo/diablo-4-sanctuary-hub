import { eq, sql } from 'drizzle-orm';
import { builds } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { err, ok } from '@/lib/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, 'admin');
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;
  const [updated] = await db
    .update(builds)
    .set({ isFeatured: sql`NOT ${builds.isFeatured}` })
    .where(eq(builds.id, id))
    .returning({ id: builds.id, isFeatured: builds.isFeatured });

  if (!updated) return err('Build not found', 404);
  return ok({ id: updated.id, isFeatured: updated.isFeatured });
}
