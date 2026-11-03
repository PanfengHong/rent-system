import type { Bill, BillStatus, Contract } from './types';
import { addDays, addMonths, diffDays, todayISO } from './utils';

export interface BillDraft {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
}

/**
 * 按付款周期把合同拆成每期账单。
 * 租期不足一个完整周期时，最后一期按实际天数折算。
 */
export function buildBillPlan(
  contract: Pick<Contract, 'startDate' | 'endDate' | 'monthlyRent' | 'payCycle'>
): BillDraft[] {
  const drafts: BillDraft[] = [];
  const end = contract.endDate;
  const cycle = contract.payCycle;
  const dailyRent = contract.monthlyRent / 30;
  let cursor = contract.startDate;
  let guard = 0;

  while (cursor < end && guard < 80) {
    const rawCycleEnd = addDays(addMonths(cursor, cycle), -1);
    const isFullCycle = rawCycleEnd <= end;
    const periodEnd = isFullCycle ? rawCycleEnd : end;
    const remainDays = diffDays(cursor, end) + 1;

    // 末期不足 10 天时并入上一期，避免产生零碎账单
    if (!isFullCycle && drafts.length > 0 && remainDays <= 10) {
      const prev = drafts[drafts.length - 1];
      prev.periodEnd = end;
      prev.amount += Math.round(dailyRent * remainDays);
      break;
    }

    const amount = isFullCycle
      ? contract.monthlyRent * cycle
      : Math.round(dailyRent * (diffDays(cursor, periodEnd) + 1));

    drafts.push({
      periodStart: cursor,
      periodEnd,
      dueDate: addDays(cursor, 5), // 5 天缴费宽限期
      amount,
    });

    cursor = addDays(periodEnd, 1);
    guard += 1;
  }

  // 极短租期（不足一期且小于 10 天）单独出一期账单
  if (drafts.length === 0 && contract.startDate < end) {
    drafts.push({
      periodStart: contract.startDate,
      periodEnd: end,
      dueDate: addDays(contract.startDate, 5),
      amount: Math.round(dailyRent * (diffDays(contract.startDate, end) + 1)),
    });
  }

  return drafts;
}

export function billStatusOf(bill: Bill, today = todayISO()): BillStatus {
  if (bill.paidAmount >= bill.amount - 0.01) return 'paid';
  if (diffDays(bill.dueDate, today) > 0) return 'overdue';
  return bill.paidAmount > 0 ? 'partial' : 'unpaid';
}

export function outstandingOf(bill: Bill) {
  return Math.max(0, Math.round((bill.amount - bill.paidAmount) * 100) / 100);
}

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  paid: '已收清',
  partial: '部分收款',
  unpaid: '待收款',
  overdue: '已逾期',
};

export const PAY_METHOD_LABEL: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '银行转账',
  cash: '现金',
};
