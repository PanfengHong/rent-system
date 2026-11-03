import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Tenant } from '@/lib/types';

const PHONE_RE = /^1[3-9]\d{9}$/;
const ID_RE = /^\d{17}[\dXx]$/;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const body = await parseBody<Partial<Tenant>>(req);
  const db = getDb();
  const tenant = db.tenants.find((t) => t.id === id);
  if (!tenant) return fail('租客不存在', 404);

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('租客姓名不能为空');
    tenant.name = body.name.trim();
  }
  if (body.phone !== undefined) {
    if (!PHONE_RE.test(body.phone.trim())) return fail('请输入有效的 11 位手机号');
    if (db.tenants.some((t) => t.id !== id && t.phone === body.phone!.trim())) return fail('该手机号已被其他租客使用');
    tenant.phone = body.phone.trim();
  }
  if (body.idCard !== undefined) {
    if (body.idCard && !ID_RE.test(body.idCard.trim())) return fail('身份证号格式不正确（18 位）');
    tenant.idCard = body.idCard.trim();
  }
  if (body.gender !== undefined) tenant.gender = body.gender === 'female' ? 'female' : 'male';
  if (body.occupation !== undefined) tenant.occupation = body.occupation.trim() || '未填写';
  if (body.emergencyName !== undefined) tenant.emergencyName = body.emergencyName.trim();
  if (body.emergencyPhone !== undefined) tenant.emergencyPhone = body.emergencyPhone.trim();
  if (body.remark !== undefined) tenant.remark = body.remark?.trim() || undefined;

  saveDb();
  return ok(tenant);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const db = getDb();
  if (!db.tenants.some((t) => t.id === id)) return fail('租客不存在', 404);
  if (db.contracts.some((c) => c.tenantId === id && c.status === 'active'))
    return fail('该租客存在生效中的合同，无法删除', 409);

  db.tenants = db.tenants.filter((t) => t.id !== id);
  db.contracts = db.contracts.filter((c) => c.tenantId !== id);
  db.bills = db.bills.filter((b) => b.tenantId !== id);
  saveDb();
  return ok({ id });
}
