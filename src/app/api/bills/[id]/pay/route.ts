import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { PayMethod } from '@/lib/types';

const METHODS: PayMethod[] = ['wechat', 'alipay', 'bank', 'cash'];

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const body = await parseBody<{ amount?: number; method?: PayMethod; note?: string }>(req);
  const db = getDb();
  const bill = db.bills.find((b) => b.id === id);
  if (!bill) return fail('账单不存在', 404);

  const outstanding = Math.max(0, bill.amount - bill.paidAmount);
  if (outstanding <= 0) return fail('该账单已收清', 409);

  const amount = Number(body.amount ?? outstanding);
  if (!(amount > 0)) return fail('收款金额需大于 0');
  if (amount > outstanding + 0.01) return fail(`收款金额不能超过待收金额 ¥${outstanding.toFixed(2)}`);

  bill.paidAmount = Math.round((bill.paidAmount + amount) * 100) / 100;
  bill.paidAt = new Date().toISOString();
  bill.method = METHODS.includes(body.method as PayMethod) ? (body.method as PayMethod) : 'wechat';
  if (body.note?.trim()) bill.note = body.note.trim();

  saveDb();
  return ok(bill);
}
