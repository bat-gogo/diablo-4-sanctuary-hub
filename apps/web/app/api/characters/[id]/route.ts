import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { characters } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { characterSchema } from '@/lib/validations/characters';

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

// PATCH accepts the same shape as POST but every field is optional so the
// client can save only what changed. Class isn't editable because changing
// it would invalidate any future linkage with class-scoped data (skills,
// items) — users delete + recreate if they really want a different class.
const patchSchema = characterSchema.partial().omit({ class: true });

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

  const result = await db
    .update(characters)
    .set(parsed.data)
    .where(and(eq(characters.id, id), eq(characters.userId, user.userId)))
    .returning();

  if (result.length === 0) return err('Not found or forbidden', 404);
  return ok({ character: result[0] });
}

// silence unused import lint when we re-shape patchSchema
void z;
