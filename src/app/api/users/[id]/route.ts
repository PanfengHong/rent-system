import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import type { User } from '@/lib/types';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const current = await getSessionUser();
  if (!current) return fail('未登录', 401);
  if (current.role !== 'admin') return fail('仅管理员可修改账号', 403);

  const { id } = await params;
  const body = await parseBody<{ name?: string; role?: User['role']; phone?: string; email?: string; status?: User['status']; password?: string }>(req);
  const db = getDb();
  const target = db.users.find((u) => u.id === id);
  if (!target) return fail('账号不存在', 404);

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('姓名不能为空');
    target.name = body.name.trim();
  }
  if (body.role !== undefined) {
    if (body.role === 'manager' && target.role === 'admin' && db.users.filter((u) => u.role === 'admin' && u.status === 'active').length <= 1) {
      return fail('系统需保留至少一名管理员', 409);
    }
    target.role = body.role === 'admin' ? 'admin' : 'manager';
  }
  if (body.status !== undefined) {
    if (target.id === current.id && body.status === 'disabled') return fail('不能停用当前登录账号', 409);
    if (body.status === 'disabled' && target.role === 'admin' && db.users.filter((u) => u.role === 'admin' && u.status === 'active').length <= 1) {
      return fail('系统需保留至少一名启用状态的管理员', 409);
    }
    target.status = body.status === 'disabled' ? 'disabled' : 'active';
  }
  if (body.phone !== undefined) target.phone = body.phone.trim();
  if (body.email !== undefined) target.email = body.email.trim() || undefined;
  if (body.password) {
    if (body.password.length < 6) return fail('密码至少 6 位');
    target.passwordHash = hashPassword(body.password);
  }

  saveDb();
  const { passwordHash: _hash, ...rest } = target;
  return ok(rest);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const current = await getSessionUser();
  if (!current) return fail('未登录', 401);
  if (current.role !== 'admin') return fail('仅管理员可删除账号', 403);

  const { id } = await params;
  if (id === current.id) return fail('不能删除当前登录账号', 409);

  const db = getDb();
  const target = db.users.find((u) => u.id === id);
  if (!target) return fail('账号不存在', 404);
  if (target.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1) {
    return fail('系统需保留至少一名管理员', 409);
  }

  db.users = db.users.filter((u) => u.id !== id);
  saveDb();
  return ok({ id });
}
