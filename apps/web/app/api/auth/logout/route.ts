import { ok } from '@/lib/api';
import { buildClearAuthCookie, withCookie } from '@/lib/cookies';

export async function POST() {
  return withCookie(ok({ message: 'Logged out' }), buildClearAuthCookie());
}
