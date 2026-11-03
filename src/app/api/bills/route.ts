import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { fail, ok } from '@/lib/http';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  return ok(getDb().bills);
}
