import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { createComment, getComments } from '@/lib/services/builds.service';
import { commentSchema } from '@/lib/validations/comments';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const result = await getComments(id, {
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit')
      ? Number(url.searchParams.get('limit'))
      : undefined,
  });
  return ok(result);
}

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

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return err('Content is required (1-2000 chars)', 400);

  const comment = await createComment(user.userId, id, parsed.data.content);
  return ok({ comment }, 201);
}
