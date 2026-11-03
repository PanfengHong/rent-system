import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Building } from '@/lib/types';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (user.role !== 'admin') return fail('仅管理员可以修改楼栋信息', 403);

  const { id } = await params;
  const body = await parseBody<Partial<Building>>(req);
  const db = getDb();
  const building = db.buildings.find((b) => b.id === id);
  if (!building) return fail('楼栋不存在', 404);

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('楼栋名称不能为空');
    building.name = body.name.trim();
  }
  if (body.address !== undefined) {
    if (!body.address.trim()) return fail('楼栋地址不能为空');
    building.address = body.address.trim();
  }
  if (body.floors !== undefined) {
    const floors = Number(body.floors);
    if (!(floors > 0 && floors <= 60)) return fail('楼层数需在 1 - 60 之间');
    building.floors = floors;
  }
  if (body.keeper !== undefined) building.keeper = body.keeper.trim();
  if (body.remark !== undefined) building.remark = body.remark?.trim() || undefined;

  saveDb();
  return ok(building);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  if (user.role !== 'admin') return fail('仅管理员可以删除楼栋', 403);

  const { id } = await params;
  const db = getDb();
  if (!db.buildings.some((b) => b.id === id)) return fail('楼栋不存在', 404);
  if (db.rooms.some((r) => r.buildingId === id)) return fail('该楼栋下仍有房间，请先删除或迁移房间', 409);

  db.buildings = db.buildings.filter((b) => b.id !== id);
  saveDb();
  return ok({ id });
}
