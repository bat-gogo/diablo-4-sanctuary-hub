import { ok } from '@/lib/api';
import { getSkills } from '@/lib/services/items.service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const skills = await getSkills({
    class: url.searchParams.get('class') ?? undefined,
  });
  return ok({ skills });
}
