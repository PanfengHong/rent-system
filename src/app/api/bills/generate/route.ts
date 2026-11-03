import { getSessionUser } from '@/lib/auth';
import { buildBillPlan } from '@/lib/billing';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok } from '@/lib/http';
import { todayISO, uid } from '@/lib/utils';

/** 为所有生效合同补齐未生成的账单期 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const db = getDb();
  const today = todayISO();
  const now = new Date().toISOString();
  let created = 0;

  db.contracts
    .filter((c) => c.status === 'active')
    .forEach((contract) => {
      const existing = new Set(db.bills.filter((b) => b.contractId === contract.id).map((b) => b.periodStart));
      buildBillPlan(contract).forEach((draft) => {
        if (draft.periodStart < today) return;
        if (existing.has(draft.periodStart)) return;
        db.bills.push({
          id: uid('bill'),
          contractId: contract.id,
          roomId: contract.roomId,
          tenantId: contract.tenantId,
          periodStart: draft.periodStart,
          periodEnd: draft.periodEnd,
          dueDate: draft.dueDate,
          amount: draft.amount,
          paidAmount: 0,
          createdAt: now,
        });
        created += 1;
      });
    });

  if (created > 0) saveDb();
  return ok({ created });
}
