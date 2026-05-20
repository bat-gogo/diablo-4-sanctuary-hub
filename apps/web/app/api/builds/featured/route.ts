import { ok } from '@/lib/api';
import { getFeaturedBuilds } from '@/lib/services/builds.service';

export async function GET() {
  const builds = await getFeaturedBuilds(6);
  return ok({ builds });
}
