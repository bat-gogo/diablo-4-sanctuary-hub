import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { users } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { err, ok } from '@/lib/api';

const roleSchema = z.object({
  role: z.enum(['guest', 'user', 'admin']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let me;
  try {
    me = await requireRole(request, 'admin');
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;
  if (id === me.userId) return err('Cannot change your own role', 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON', 400);
  }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return err('role must be guest/user/admin', 400);

  // Don't allow demoting the last admin.
  const [target] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) return err('User not found', 404);

  if (target.role === 'admin' && parsed.data.role !== 'admin') {
    const [count] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(eq(users.role, 'admin'));
    if (count.n <= 1) {
      return err('Cannot demote the last admin', 400);
    }
  }

  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      battletag: users.battletag,
      role: users.role,
    });

  return ok({ user: updated });
}

// Keep import alive for future audit-style queries.
void and;
