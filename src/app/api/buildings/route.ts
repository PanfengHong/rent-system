import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Building } from '@/lib/types';
import { todayISO, uid } from '@/lib/utils';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  return ok(getDb().buildings);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (user.role !== 'admin') return fail('仅管理员可以新增楼栋', 403);

  const body = await parseBody<Partial<Building>>(req);
  if (!body.name?.trim()) return fail('请填写楼栋名称');
  if (!body.address?.trim()) return fail('请填写楼栋地址');

  const db = getDb();
  const floors = Number(body.floors ?? 6);
  if (!(floors > 0 && floors <= 60)) return fail('楼层数需在 1 - 60 之间');

  const building: Building = {
    id: uid('bld'),
    name: body.name.trim(),
    address: body.address.trim(),
    floors,
    keeper: body.keeper?.trim() || user.name,
    remark: body.remark?.trim() || undefined,
    createdAt: todayISO(),
  };

  db.buildings.push(building);
  saveDb();
  return ok(building, 201);
}
