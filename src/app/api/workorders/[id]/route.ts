import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';

const STATUSES: WorkOrderStatus[] = ['pending', 'processing', 'done'];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const body = await parseBody<Partial<WorkOrder>>(req);
  const db = getDb();
  const order = db.workOrders.find((w) => w.id === id);
  if (!order) return fail('工单不存在', 404);

  if (body.status && STATUSES.includes(body.status)) {
    order.status = body.status;
    if (body.status === 'done') order.resolvedAt = new Date().toISOString();
  }
  if (body.assignee !== undefined) order.assignee = body.assignee.trim() || undefined;
  if (body.priority && ['low', 'medium', 'high'].includes(body.priority)) order.priority = body.priority;
  if (body.description !== undefined) order.description = body.description.trim();
  if (body.cost !== undefined) order.cost = Number(body.cost) || 0;

  saveDb();
  return ok(order);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const { id } = await params;
  const db = getDb();
  if (!db.workOrders.some((w) => w.id === id)) return fail('工单不存在', 404);
  db.workOrders = db.workOrders.filter((w) => w.id !== id);
  saveDb();
  return ok({ id });
}
