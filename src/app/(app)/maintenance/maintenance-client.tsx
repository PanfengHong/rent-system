'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Badge, Button, Field, Input, Select, Textarea } from '@/components/ui/base';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { DetailGrid, DetailNote, DetailSection, Drawer } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import { ORDER_STATUS_META, PRIORITY_META, WORK_CATEGORIES } from '@/lib/labels';
import type { RoomView, WorkOrderView } from '@/lib/queries';
import type { Priority, WorkOrderStatus } from '@/lib/types';
import { cn, formatMoney, formatDateTime } from '@/lib/utils';

interface Props {
  orders: WorkOrderView[];
  rooms: RoomView[];
}

const COLUMNS: Array<{ key: WorkOrderStatus; title: string; hint: string; accent: string }> = [
  { key: 'pending', title: '待受理', hint: '等待派单', accent: 'bg-amber-400' },
  { key: 'processing', title: '处理中', hint: '师傅已上门', accent: 'bg-sky-400' },
  { key: 'done', title: '已完成', hint: '已回访确认', accent: 'bg-emerald-400' },
];

export function MaintenanceClient({ orders, rooms }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    roomId: '',
    title: '',
    category: '水电',
    priority: 'medium' as Priority,
    description: '',
    reporter: '租客报修',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<WorkOrderView | null>(null);
  const [detailForm, setDetailForm] = useState({ assignee: '', cost: '', description: '' });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<WorkOrderView | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(
    () => orders.filter((o) => priority === 'all' || o.priority === priority),
    [orders, priority]
  );

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    done: orders.filter((o) => o.status === 'done').length,
    cost: orders.filter((o) => o.status === 'done').reduce((s, o) => s + (o.cost ?? 0), 0),
  };

  async function updateOrder(id: string, body: Record<string, unknown>, message: string) {
    try {
      await api(`/api/workorders/${id}`, { method: 'PATCH', body });
      toast.success(message);
      setDetail(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function submit() {
    if (!form.roomId) return setError('请选择报修房间');
    if (!form.title.trim()) return setError('请填写报修事项');
    setSaving(true);
    setError('');
    try {
      await api('/api/workorders', { body: form });
      toast.success('报修工单已创建');
      setCreateOpen(false);
      setForm({ roomId: '', title: '', category: '水电', priority: 'medium', description: '', reporter: '租客报修' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }

  function openDetail(order: WorkOrderView) {
    setDetail(order);
    setDetailForm({ assignee: order.assignee ?? '', cost: order.cost ? String(order.cost) : '', description: order.description });
  }

  async function saveDetail() {
    if (!detail) return;
    setUpdating(true);
    try {
      await api(`/api/workorders/${detail.id}`, {
        method: 'PATCH',
        body: { assignee: detailForm.assignee, cost: detailForm.cost ? Number(detailForm.cost) : undefined, description: detailForm.description },
      });
      toast.success('工单信息已更新');
      setDetail(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setUpdating(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/workorders/${deleting.id}`, { method: 'DELETE' });
      toast.success('工单已删除');
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: '待受理', value: stats.pending, hint: '需要尽快派单', tone: 'text-amber-600' },
          { label: '处理中', value: stats.processing, hint: '跟进维修进度', tone: 'text-sky-600' },
          { label: '已完成', value: stats.done, hint: '历史累计', tone: 'text-emerald-600' },
          { label: '维修支出', value: formatMoney(stats.cost), hint: '已完成工单成本', tone: 'text-slate-800' },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3.5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={cn('mt-1 text-xl font-semibold tabular-nums', s.tone)}>{s.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-2.5 px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Icon name="wrench" size={15} className="text-slate-400" /> 工单看板
        </div>
        <div className="ml-2 flex rounded-lg bg-slate-100 p-1">
          {[
            { key: 'all' as const, label: '全部优先级' },
            { key: 'high' as const, label: '高' },
            { key: 'medium' as const, label: '中' },
            { key: 'low' as const, label: '低' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPriority(p.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition',
                priority === p.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button size="sm" icon="plus" onClick={() => { setError(''); setCreateOpen(true); }}>新建工单</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = filtered.filter((o) => o.status === col.key);
          return (
            <div key={col.key} className="rounded-xl2 border border-slate-200/80 bg-slate-100/50">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', col.accent)} />
                  <p className="text-sm font-semibold text-slate-800">{col.title}</p>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">{list.length}</span>
                </div>
                <span className="text-[11px] text-slate-400">{col.hint}</span>
              </div>

              <div className="space-y-2.5 px-3 pb-3">
                {list.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-8 text-center text-xs text-slate-400">
                    暂无工单
                  </div>
                ) : (
                  list.map((order) => (
                    <div key={order.id} className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-card">
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => openDetail(order)} className="text-left text-[13px] font-medium leading-snug text-slate-800 hover:text-brand-700">
                          {order.title}
                        </button>
                        <Badge tone={PRIORITY_META[order.priority].tone}>{PRIORITY_META[order.priority].label}优</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                        <Icon name="home" size={11} /> {order.buildingShort} · {order.roomNo} 室
                        {order.tenantName ? <span className="text-slate-400"> / {order.tenantName}</span> : null}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{order.description}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">{order.category}</span>
                        <span>{order.code}</span>
                        {order.assignee ? <span className="text-slate-500">· {order.assignee}</span> : null}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-[10.5px] text-slate-400">
                          {order.status === 'done' && order.resolvedAt
                            ? `完成于 ${order.resolvedAt.slice(5, 10)}${order.cost ? ` · ¥${order.cost}` : ''}`
                            : formatDateTime(order.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          {order.status === 'pending' ? (
                            <button type="button" onClick={() => updateOrder(order.id, { status: 'processing' }, '工单已受理')} className="rounded-md bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-100">
                              受理派单
                            </button>
                          ) : null}
                          {order.status === 'processing' ? (
                            <button type="button" onClick={() => updateOrder(order.id, { status: 'done' }, '工单已完成')} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">
                              标记完成
                            </button>
                          ) : null}
                          <button type="button" onClick={() => setDeleting(order)} className="rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500" aria-label="删除工单">
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 新建工单 */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新建报修工单"
        desc="记录租客报修内容，便于派单与跟进"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={submit} loading={saving}>创建工单</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="报修房间" required className="sm:col-span-2">
            <Select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
              <option value="">请选择房间</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.buildingShort} · {r.roomNo} 室{r.tenantName ? `（${r.tenantName}）` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="报修事项" required className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：卫生间下水道堵塞" />
          </Field>
          <Field label="报修分类">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {WORK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="优先级">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </Select>
          </Field>
          <Field label="报修来源">
            <Input value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} placeholder="租客报修 / 巡检发现" />
          </Field>
          <Field label="问题描述" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="补充说明故障现象、方便上门的时间等" />
          </Field>
          {error ? (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* 工单详情 */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title ?? '工单详情'}
        desc={detail ? `${detail.code} · ${detail.buildingShort} ${detail.roomNo} 室 · 报修于 ${formatDateTime(detail.createdAt)}` : ''}
        extra={
          detail ? (
            <>
              <Badge tone={ORDER_STATUS_META[detail.status].tone} dot>{ORDER_STATUS_META[detail.status].label}</Badge>
              <Badge tone={PRIORITY_META[detail.priority].tone}>{PRIORITY_META[detail.priority].label}优先</Badge>
            </>
          ) : null
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button>
            <Button onClick={saveDetail} loading={updating}>保存</Button>
          </>
        }
      >
        {detail ? (
          <>
            <DetailGrid
              items={[
                { label: '报修分类', value: detail.category },
                { label: '优先级', value: PRIORITY_META[detail.priority].label },
                { label: '报修人', value: detail.reporter },
                {
                  label: '租客',
                  value: detail.tenantName ? `${detail.tenantName}（${detail.tenantPhone}）` : '—',
                },
                { label: '房屋', value: `${detail.buildingName} ${detail.roomNo} 室` },
                {
                  label: '完成时间',
                  value: detail.resolvedAt ? formatDateTime(detail.resolvedAt) : '—',
                },
              ]}
            />

            <DetailSection title="问题描述">
              <Textarea rows={4} value={detailForm.description} onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })} />
            </DetailSection>

            <DetailSection title="处理信息">
              <div className="grid grid-cols-2 gap-3">
                <Field label="维修师傅">
                  <Input value={detailForm.assignee} onChange={(e) => setDetailForm({ ...detailForm, assignee: e.target.value })} placeholder="例如：王师傅" />
                </Field>
                <Field label="维修费用（元）">
                  <Input type="number" min={0} value={detailForm.cost} onChange={(e) => setDetailForm({ ...detailForm, cost: e.target.value })} placeholder="0" />
                </Field>
              </div>
            </DetailSection>

            <DetailSection title="流转">
              <div className="flex flex-wrap gap-2">
                {detail.status !== 'processing' ? (
                  <Button variant="secondary" size="sm" onClick={() => updateOrder(detail.id, { status: 'processing' }, '工单已受理')}>标记处理中</Button>
                ) : null}
                {detail.status !== 'done' ? (
                  <Button variant="soft" size="sm" onClick={() => updateOrder(detail.id, { status: 'done' }, '工单已完成')}>标记已完成</Button>
                ) : null}
                {detail.status === 'processing' || detail.status === 'done' ? (
                  <Button variant="secondary" size="sm" onClick={() => updateOrder(detail.id, { status: 'pending' }, '工单已退回待受理')}>退回待受理</Button>
                ) : null}
              </div>
              <DetailNote>
                修改师傅、费用或问题描述后需点击「保存」；状态流转会即时生效。
              </DetailNote>
            </DetailSection>
          </>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="删除工单"
        desc={`确认删除工单「${deleting?.title ?? ''}」吗？删除后无法恢复。`}
      />
    </div>
  );
}
