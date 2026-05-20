import { ok } from '@/lib/api';
import { getItems } from '@/lib/services/items.service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = url.searchParams;
  const result = await getItems({
    type: p.get('type') ?? undefined,
    classRestriction: p.get('classRestriction') ?? undefined,
    isUnique: p.has('isUnique') ? p.get('isUnique') === 'true' : undefined,
    isMythic: p.has('isMythic') ? p.get('isMythic') === 'true' : undefined,
    search: p.get('search') ?? undefined,
    cursor: p.get('cursor') ?? undefined,
    limit: p.get('limit') ? Number(p.get('limit')) : undefined,
  });
  return ok(result);
}
