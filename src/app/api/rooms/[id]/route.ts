import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Room, RoomStatus } from '@/lib/types';
import { todayISO } from '@/lib/utils';

const STATUSES: RoomStatus[] = ['vacant', 'rented', 'maintenance'];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const body = await parseBody<Partial<Room>>(req);
  const db = getDb();
  const room = db.rooms.find((r) => r.id === id);
  if (!room) return fail('房间不存在', 404);

  if (body.buildingId && body.buildingId !== room.buildingId) {
    if (!db.buildings.some((b) => b.id === body.buildingId)) return fail('目标楼栋不存在');
    const duplicated = db.rooms.some(
      (r) => r.id !== id && r.buildingId === body.buildingId && r.roomNo === (body.roomNo?.trim() ?? room.roomNo)
    );
    if (duplicated) return fail('目标楼栋下已存在相同房间号');
    room.buildingId = body.buildingId;
  }

  if (body.roomNo !== undefined) {
    const roomNo = body.roomNo.trim();
    if (!roomNo) return fail('房间号不能为空');
    if (db.rooms.some((r) => r.id !== id && r.buildingId === room.buildingId && r.roomNo === roomNo))
      return fail('该楼栋下已存在相同房间号');
    room.roomNo = roomNo;
  }

  if (body.status && STATUSES.includes(body.status)) {
    const hasActive = db.contracts.some((c) => c.roomId === room.id && c.status === 'active');
    if (body.status !== 'rented' && hasActive && room.currentContractId) {
      return fail('该房间存在生效中的合同，请先在合同管理中办理退租', 409);
    }
    room.status = body.status;
    if (body.status === 'vacant') {
      room.currentTenantId = undefined;
      room.currentContractId = undefined;
    }
  }

  if (body.floor !== undefined) room.floor = Number(body.floor) || room.floor;
  if (body.area !== undefined) {
    if (!(Number(body.area) > 0)) return fail('建筑面积需大于 0');
    room.area = Number(body.area);
  }
  if (body.monthlyRent !== undefined) {
    if (!(Number(body.monthlyRent) > 0)) return fail('月租金需大于 0');
    room.monthlyRent = Number(body.monthlyRent);
  }
  if (body.deposit !== undefined) room.deposit = Number(body.deposit) || room.monthlyRent;
  if (body.layout !== undefined) room.layout = body.layout.trim();
  if (body.orientation !== undefined) room.orientation = body.orientation.trim();
  if (body.facilities !== undefined) room.facilities = body.facilities;
  if (body.remark !== undefined) room.remark = body.remark?.trim() || undefined;
  room.updatedAt = todayISO();

  saveDb();
  return ok(room);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const db = getDb();
  const room = db.rooms.find((r) => r.id === id);
  if (!room) return fail('房间不存在', 404);

  const relatedContracts = db.contracts.filter((c) => c.roomId === id);
  if (relatedContracts.some((c) => c.status === 'active')) {
    return fail('该房间仍有生效中的合同，无法删除', 409);
  }
  if (db.bills.some((b) => b.roomId === id && b.paidAmount > 0)) {
    return fail('该房间存在收款记录，出于财务留存要求不能删除；可将房态改为「维修中」暂停出租', 409);
  }

  db.rooms = db.rooms.filter((r) => r.id !== id);
  db.contracts = db.contracts.filter((c) => c.roomId !== id);
  db.bills = db.bills.filter((b) => b.roomId !== id);
  db.workOrders = db.workOrders.filter((w) => w.roomId !== id);

  saveDb();
  return ok({ id });
}
