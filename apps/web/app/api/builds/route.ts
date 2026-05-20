import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { createBuild, getBuilds } from '@/lib/services/builds.service';
import { buildSchema } from '@/lib/validations/builds';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const result = await getBuilds({
    class: params.get('class') ?? undefined,
    season: params.get('season') ? Number(params.get('season')) : undefined,
    playstyle: params.get('playstyle') ?? undefined,
    search: params.get('search') ?? undefined,
    cursor: params.get('cursor') ?? undefined,
    limit: params.get('limit') ? Number(params.get('limit')) : undefined,
  });
  return ok(result);
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

  const parsed = buildSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  const id = await createBuild(user.userId, parsed.data);
  return ok({ id }, 201);
}
