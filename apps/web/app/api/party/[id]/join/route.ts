import { requireAuth } from '@/lib/auth';
import { err, ok } from '@/lib/api';
import { joinPartyRequest } from '@/lib/services/party.service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(request);
  } catch (res) {
    return res as Response;
  }

  const { id } = await params;
  const result = await joinPartyRequest(id);
  if (!result.ok) {
    return err('Party is full or no longer open', 409);
  }
  return ok({
    message: 'Joined',
    spotsFilled: result.spotsFilled,
    spotsTotal: result.spotsTotal,
    status: result.status,
  });
}
