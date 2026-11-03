import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import type { User } from '@/lib/types';
import { todayISO, uid } from '@/lib/utils';

function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (user.role !== 'admin') return fail('仅管理员可查看账号列表', 403);
  return ok(getDb().users.map(publicUser));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (user.role !== 'admin') return fail('仅管理员可新增账号', 403);

  const body = await parseBody<{ username?: string; name?: string; password?: string; role?: User['role']; phone?: string; email?: string }>(req);
  const username = body.username?.trim().toLowerCase();
  if (!username || !/^[a-z0-9_]{3,20}$/.test(username)) return fail('用户名需为 3-20 位小写字母、数字或下划线');
  if (!body.name?.trim()) return fail('请填写姓名');
  if (!body.password || body.password.length < 6) return fail('密码至少 6 位');

  const db = getDb();
  if (db.users.some((u) => u.username === username)) return fail('该用户名已存在');

  const created: User = {
    id: uid('usr'),
    username,
    passwordHash: hashPassword(body.password),
    name: body.name.trim(),
    role: body.role === 'admin' ? 'admin' : 'manager',
    phone: body.phone?.trim() || '',
    email: body.email?.trim() || undefined,
    status: 'active',
    createdAt: todayISO(),
  };

  db.users.push(created);
  saveDb();
  return ok(publicUser(created), 201);
}
