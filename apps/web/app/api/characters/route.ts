import { and, desc, eq } from 'drizzle-orm';
import { characters } from '@sanctuary-hub/db';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { characterSchema } from '@/lib/validations/characters';

export async function GET(request: Request) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }
  const rows = await db
    .select()
    .from(characters)
    .where(eq(characters.userId, user.userId))
    .orderBy(desc(characters.createdAt));
  return ok({ characters: rows });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON', 400);
  }
  const parsed = characterSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  const [inserted] = await db
    .insert(characters)
    .values({
      userId: user.userId,
      name: parsed.data.name,
      class: parsed.data.class,
      level: parsed.data.level,
      season: parsed.data.season,
      isHardcore: parsed.data.isHardcore ?? false,
    })
    .returning();

  return ok({ character: inserted }, 201);
}

// Keep import for potential future filter helpers.
void and;
