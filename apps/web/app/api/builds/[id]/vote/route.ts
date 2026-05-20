import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { upsertVote } from '@/lib/services/builds.service';
import { voteSchema } from '@/lib/validations/builds';

export async function POST(
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

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return err('value must be 1 or -1', 400);

  const score = await upsertVote(user.userId, id, parsed.data.value);
  return ok({ voteScore: score });
}
