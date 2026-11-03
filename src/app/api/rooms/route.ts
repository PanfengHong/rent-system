import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Room, RoomStatus } from '@/lib/types';
import { todayISO, uid } from '@/lib/utils';

const STATUSES: RoomStatus[] = ['vacant', 'rented', 'maintenance'];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  const db = getDb();
  return ok(db.rooms);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await parseBody<Partial<Room>>(req);
  const db = getDb();

  if (!body.buildingId || !db.buildings.some((b) => b.id === body.buildingId)) return fail('请选择有效的楼栋');
  if (!body.roomNo?.trim()) return fail('请填写房间号');
  if (db.rooms.some((r) => r.buildingId === body.buildingId && r.roomNo === body.roomNo?.trim()))
    return fail('该楼栋下已存在相同房间号');

  const area = Number(body.area);
  const rent = Number(body.monthlyRent);
  if (!(area > 0)) return fail('建筑面积需大于 0');
  if (!(rent > 0)) return fail('月租金需大于 0');

  const floor = Number(body.floor) || Number(body.roomNo.trim().slice(0, 1)) || 1;
  const status: RoomStatus = STATUSES.includes(body.status as RoomStatus) ? (body.status as RoomStatus) : 'vacant';

  const room: Room = {
    id: uid('room'),
    buildingId: body.buildingId,
    roomNo: body.roomNo.trim(),
    floor,
    area,
    layout: body.layout?.trim() || '1室1厅',
    orientation: body.orientation?.trim() || '朝南',
    monthlyRent: rent,
    deposit: Number(body.deposit) || rent,
    status,
    facilities: Array.isArray(body.facilities) ? body.facilities : [],
    remark: body.remark?.trim() || undefined,
    updatedAt: todayISO(),
  };

  db.rooms.push(room);
  saveDb();
  return ok(room, 201);
}
