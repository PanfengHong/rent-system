import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { nextContractCode, pushBills } from '@/lib/contracts';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Contract } from '@/lib/types';
import { addDays, addMonths, todayISO, uid } from '@/lib/utils';

type Ctx = { params: Promise<{ id: string }> };

interface PatchBody {
  action?: 'terminate' | 'renew' | 'update';
  remark?: string;
  months?: number;
  monthlyRent?: number;
  payCycle?: Contract['payCycle'];
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const body = await parseBody<PatchBody>(req);
  const db = getDb();
  const contract = db.contracts.find((c) => c.id === id);
  if (!contract) return fail('合同不存在', 404);

  const room = db.rooms.find((r) => r.id === contract.roomId);
  const action = body.action ?? 'update';

  if (action === 'terminate') {
    if (contract.status !== 'active' && contract.status !== 'pending') {
      return fail('该合同已结束，无需退租', 409);
    }
    const today = todayISO();
    contract.status = 'terminated';
    contract.terminatedAt = today;

    if (room && room.currentContractId === contract.id) {
      // 若同一房间还有其他覆盖今日的生效合同（例如续租合同），房间保持出租
      const stillActive = db.contracts.find(
        (c) =>
          c.id !== contract.id &&
          c.roomId === contract.roomId &&
          c.status === 'active' &&
          c.startDate <= today &&
          c.endDate >= today
      );
      if (stillActive) {
        room.status = 'rented';
        room.currentTenantId = stillActive.tenantId;
        room.currentContractId = stillActive.id;
      } else {
        room.status = 'vacant';
        room.currentTenantId = undefined;
        room.currentContractId = undefined;
      }
      room.updatedAt = today;
    }

    // 清理退租日之后尚未收款的账单
    db.bills = db.bills.filter(
      (b) => !(b.contractId === contract.id && b.paidAmount === 0 && b.periodStart > today)
    );

    saveDb();
    return ok(contract);
  }

  if (action === 'renew') {
    if (contract.status === 'terminated') return fail('已退租的合同无法续签', 409);
    const months = Number(body.months ?? 12);
    if (!(months >= 1 && months <= 36)) return fail('续签月数需在 1 - 36 之间');

    const startDate = addDays(contract.endDate, 1);
    const endDate = addDays(addMonths(startDate, months), -1);
    const monthlyRent = Number(body.monthlyRent ?? contract.monthlyRent);
    if (!(monthlyRent > 0)) return fail('月租金需大于 0');

    const renewed: Contract = {
      id: uid('ctr'),
      code: nextContractCode(db, startDate),
      roomId: contract.roomId,
      tenantId: contract.tenantId,
      startDate,
      endDate,
      monthlyRent,
      deposit: contract.deposit,
      payCycle: (body.payCycle ?? contract.payCycle) as Contract['payCycle'],
      status: 'active',
      signedAt: todayISO(),
      remark: `由合同 ${contract.code} 续签`,
    };

    if (contract.endDate < todayISO()) contract.status = 'expired';
    db.contracts.push(renewed);
    pushBills(db, renewed);

    if (room) {
      room.status = 'rented';
      // 续租合同尚未生效时，房间仍关联当前合同
      if (renewed.startDate <= todayISO()) {
        room.currentTenantId = contract.tenantId;
        room.currentContractId = renewed.id;
      }
      room.monthlyRent = monthlyRent;
      room.updatedAt = todayISO();
    }

    saveDb();
    return ok(renewed, 201);
  }

  if (body.remark !== undefined) contract.remark = body.remark?.trim() || undefined;
  if (body.monthlyRent !== undefined) {
    const rent = Number(body.monthlyRent);
    if (!(rent > 0)) return fail('月租金需大于 0');
    contract.monthlyRent = rent;
  }
  if (body.payCycle !== undefined && [1, 3, 6, 12].includes(Number(body.payCycle))) {
    contract.payCycle = Number(body.payCycle) as Contract['payCycle'];
  }

  saveDb();
  return ok(contract);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const db = getDb();
  const contract = db.contracts.find((c) => c.id === id);
  if (!contract) return fail('合同不存在', 404);
  if (contract.status === 'active' || contract.status === 'pending') {
    return fail('生效中的合同无法删除，请先办理退租', 409);
  }
  if (db.bills.some((b) => b.contractId === id && b.paidAmount > 0)) {
    return fail('该合同已有收款记录，出于财务留存要求不能删除', 409);
  }

  db.contracts = db.contracts.filter((c) => c.id !== id);
  db.bills = db.bills.filter((b) => b.contractId !== id);
  saveDb();
  return ok({ id });
}
