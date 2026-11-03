import type { NextRequest } from 'next/server';
import { createSession } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody, rateLimit } from '@/lib/http';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const limit = rateLimit(`login:${ip}`);
  if (!limit.allowed) {
    return fail('尝试次数过多，请 5 分钟后再试', 429);
  }

  const { username, password } = await parseBody<{ username?: string; password?: string }>(req);
  if (!username?.trim() || !password) {
    return fail('请输入账号和密码');
  }

  const db = getDb();
  const user = db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail('账号或密码不正确', 401);
  }
  if (user.status !== 'active') {
    return fail('账号已被停用，请联系管理员', 403);
  }

  user.lastLoginAt = new Date().toISOString();
  saveDb();

  const sessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    email: user.email,
  };
  await createSession(sessionUser);

  return ok(sessionUser);
}
