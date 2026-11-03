import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { nextContractCode, pushBills } from '@/lib/contracts';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Contract } from '@/lib/types';
import { diffDays, todayISO, uid } from '@/lib/utils';

const CYCLES = [1, 3, 6, 12];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  return ok(getDb().contracts);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await parseBody<Partial<Contract>>(req);
  const db = getDb();

  const room = db.rooms.find((r) => r.id === body.roomId);
  if (!room) return fail('请选择有效的房间');
  if (!db.tenants.some((t) => t.id === body.tenantId)) return fail('请选择有效的租客');

  if (!body.startDate || !body.endDate) return fail('请选择租期起止日期');
  if (diffDays(body.startDate, body.endDate) < 1) return fail('结束日期需晚于开始日期');

  const monthlyRent = Number(body.monthlyRent ?? room.monthlyRent);
  const deposit = Number(body.deposit ?? room.deposit);
  if (!(monthlyRent > 0)) return fail('月租金需大于 0');
  if (deposit < 0) return fail('押金不能为负数');

  const payCycle = (CYCLES.includes(Number(body.payCycle)) ? Number(body.payCycle) : 1) as Contract['payCycle'];

  const conflicting = db.contracts.find(
    (c) => c.roomId === room.id && (c.status === 'active' || c.status === 'pending') && c.endDate >= body.startDate!
  );
  if (conflicting) return fail('该房间在所选租期内已有合同，请先办理退租或更换房间', 409);

  const contract: Contract = {
    id: uid('ctr'),
    code: nextContractCode(db, body.startDate),
    roomId: room.id,
    tenantId: body.tenantId!,
    startDate: body.startDate,
    endDate: body.endDate,
    monthlyRent,
    deposit,
    payCycle,
    status: body.startDate > todayISO() ? 'pending' : 'active',
    signedAt: todayISO(),
    remark: body.remark?.trim() || undefined,
  };

  db.contracts.push(contract);
  pushBills(db, contract);

  if (contract.status === 'active') {
    room.status = 'rented';
    room.currentTenantId = contract.tenantId;
    room.currentContractId = contract.id;
  }

  saveDb();
  return ok(contract, 201);
}
