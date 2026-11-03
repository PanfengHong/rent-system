import type { Contract, Database } from './types';
import { buildBillPlan } from './billing';
import { uid } from './utils';

/** 生成不重复的合同编号：HT + 年份 + 三位流水 */
export function nextContractCode(db: Database, startDate: string) {
  const year = startDate.slice(0, 4);
  let seq = db.contracts.length + 1;
  let code = `HT${year}${String(seq).padStart(3, '0')}`;
  while (db.contracts.some((c) => c.code === code)) {
    seq += 1;
    code = `HT${year}${String(seq).padStart(3, '0')}`;
  }
  return code;
}

/** 按合同付款周期生成账单 */
export function pushBills(db: Database, contract: Contract) {
  const now = new Date().toISOString();
  buildBillPlan(contract).forEach((draft) => {
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
  });
}
