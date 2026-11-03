import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, saveDb } from '@/lib/db';
import { fail, ok, parseBody } from '@/lib/http';
import type { Priority, WorkOrder } from '@/lib/types';
import { uid } from '@/lib/utils';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);
  return ok(getDb().workOrders);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail('未登录', 401);

  const body = await parseBody<Partial<WorkOrder>>(req);
  const db = getDb();
  if (!body.roomId || !db.rooms.some((r) => r.id === body.roomId)) return fail('请选择报修房间');
  if (!body.title?.trim()) return fail('请填写报修事项');

  const createdAt = new Date().toISOString();
  const order: WorkOrder = {
    id: uid('wo'),
    code: `WO${createdAt.replace(/\D/g, '').slice(2, 10)}${String(db.workOrders.length + 1).padStart(2, '0')}`,
    roomId: body.roomId,
    tenantId: body.tenantId,
    title: body.title.trim(),
    description: body.description?.trim() || '无补充说明',
    category: body.category?.trim() || '其他',
    priority: PRIORITIES.includes(body.priority as Priority) ? (body.priority as Priority) : 'medium',
    status: 'pending',
    reporter: body.reporter?.trim() || user.name,
    createdAt,
  };

  db.workOrders.unshift(order);
  saveDb();
  return ok(order, 201);
}
