import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { createPartyRequest, getPartyRequests } from '@/lib/services/party.service';
import { partyRequestSchema } from '@/lib/validations/party';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = url.searchParams;
  const result = await getPartyRequests({
    activity: p.get('activity') ?? undefined,
    status: p.get('status') ?? undefined,
    cursor: p.get('cursor') ?? undefined,
    limit: p.get('limit') ? Number(p.get('limit')) : undefined,
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

  const parsed = partyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  const id = await createPartyRequest(user.userId, parsed.data);
  return ok({ id }, 201);
}
