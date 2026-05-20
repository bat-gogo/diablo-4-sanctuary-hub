import { err, ok } from '@/lib/api';
import { getBuildById, incrementViews } from '@/lib/services/builds.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const build = await getBuildById(id);
  if (!build) return err('Build not found', 404);
  // Fire-and-forget view bump; don't block the response on it.
  incrementViews(id).catch(() => {});
  return ok({ build });
}
