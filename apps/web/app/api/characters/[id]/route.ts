import { and, eq } from 'drizzle-orm';
import { characters } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';

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
  const result = await db
    .delete(characters)
    .where(and(eq(characters.id, id), eq(characters.userId, user.userId)))
    .returning({ id: characters.id });

  if (result.length === 0) return err('Not found or forbidden', 404);
  return ok({ id });
}
