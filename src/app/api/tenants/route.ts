import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Tenant } from '@/lib/types';
import { todayISO, uid } from '@/lib/utils';

const PHONE_RE = /^1[3-9]\d{9}$/;
const ID_RE = /^\d{17}[\dXx]$/;

function validateTenant(body: Partial<Tenant>) {
  if (!body.name?.trim()) return '请填写租客姓名';
  if (!body.phone || !PHONE_RE.test(body.phone.trim())) return '请输入有效的 11 位手机号';
  if (body.idCard && !ID_RE.test(body.idCard.trim())) return '身份证号格式不正确（18 位）';
  return null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  return ok(getDb().tenants);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await parseBody<Partial<Tenant>>(req);
  const error = validateTenant(body);
  if (error) return fail(error);

  const db = getDb();
  const phone = body.phone!.trim();
  if (db.tenants.some((t) => t.phone === phone)) return fail('该手机号已被其他租客使用');

  const tenant: Tenant = {
    id: uid('ten'),
    name: body.name!.trim(),
    phone,
    idCard: body.idCard?.trim() || '',
    gender: body.gender === 'female' ? 'female' : 'male',
    occupation: body.occupation?.trim() || '未填写',
    emergencyName: body.emergencyName?.trim() || '',
    emergencyPhone: body.emergencyPhone?.trim() || '',
    remark: body.remark?.trim() || undefined,
    createdAt: todayISO(),
  };

  db.tenants.push(tenant);
  saveDb();
  return ok(tenant, 201);
}
