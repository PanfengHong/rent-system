'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Badge, Button, Field, Input, Progress, Textarea } from '@/components/ui/base';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import type { Building, Room } from '@/lib/types';
import { formatMoney, percent } from '@/lib/utils';

interface Props {
  buildings: Building[];
  rooms: Room[];
  canManage: boolean;
}

interface Form {
  id?: string;
  name: string;
  address: string;
  floors: string;
  keeper: string;
  remark: string;
}

const emptyForm: Form = { name: '', address: '', floors: '6', keeper: '', remark: '' };

export function BuildingsClient({ buildings, rooms, canManage }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Building | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const stats = buildings.map((b) => {
    const list = rooms.filter((r) => r.buildingId === b.id);
    const rented = list.filter((r) => r.status === 'rented');
    const income = rented.reduce((sum, r) => sum + r.monthlyRent, 0);
    return { ...b, total: list.length, rented: rented.length, occupancy: percent(rented.length, list.length), income };
  });

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setOpen(true);
  }

  function openEdit(b: Building) {
    setForm({ id: b.id, name: b.name, address: b.address, floors: String(b.floors), keeper: b.keeper, remark: b.remark ?? '' });
    setError('');
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) return setError('请填写楼栋名称');
    if (!form.address.trim()) return setError('请填写楼栋地址');
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        address: form.address,
        floors: Number(form.floors) || 1,
        keeper: form.keeper,
        remark: form.remark,
      };
      if (form.id) {
        await api(`/api/buildings/${form.id}`, { method: 'PATCH', body: payload });
        toast.success('楼栋信息已更新');
      } else {
        await api('/api/buildings', { body: payload });
        toast.success('楼栋已创建');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/buildings/${deleting.id}`, { method: 'DELETE' });
      toast.success('楼栋已删除');
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalRooms = stats.reduce((s, b) => s + b.total, 0);
  const totalRented = stats.reduce((s, b) => s + b.rented, 0);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-slate-500">楼栋数量</p>
            <p className="text-xl font-semibold text-slate-900 tabular-nums">{stats.length}<span className="ml-1 text-xs font-normal text-slate-400">栋</span></p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div>
            <p className="text-xs text-slate-500">房源总数</p>
            <p className="text-xl font-semibold text-slate-900 tabular-nums">{totalRooms}<span className="ml-1 text-xs font-normal text-slate-400">间</span></p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div>
            <p className="text-xs text-slate-500">整体出租率</p>
            <p className="text-xl font-semibold text-slate-900 tabular-nums">{percent(totalRented, totalRooms)}<span className="ml-0.5 text-xs font-normal text-slate-400">%</span></p>
          </div>
        </div>
        {canManage ? (
          <Button size="sm" icon="plus" onClick={openCreate}>新增楼栋</Button>
        ) : (
          <span className="text-xs text-slate-400">仅管理员可维护楼栋档案</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((b) => (
          <div key={b.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="building" size={19} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">{b.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <Icon name="map-pin" size={11} /> {b.address}
                  </p>
                </div>
              </div>
              {b.occupancy >= 85 ? <Badge tone="green">满租</Badge> : b.occupancy >= 60 ? <Badge tone="brand">稳定</Badge> : <Badge tone="amber">待提升</Badge>}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50/80 py-2.5 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-800 tabular-nums">{b.total}</p>
                <p className="text-[11px] text-slate-400">房间</p>
              </div>
              <div className="border-x border-slate-200/70">
                <p className="text-sm font-semibold text-slate-800 tabular-nums">{b.rented}</p>
                <p className="text-[11px] text-slate-400">在租</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 tabular-nums">{b.floors}</p>
                <p className="text-[11px] text-slate-400">楼层</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>出租率 {b.occupancy}%</span>
                <span className="tabular-nums">月租金 {formatMoney(b.income)}</span>
              </div>
              <Progress value={b.occupancy} tone={b.occupancy >= 85 ? 'green' : b.occupancy >= 60 ? 'brand' : 'amber'} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">
                  {b.keeper.slice(-2)}
                </span>
                管家 {b.keeper}
              </span>
              {canManage ? (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => openEdit(b)} className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">编辑</button>
                  <button type="button" onClick={() => setDeleting(b)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="删除楼栋">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-[188px] flex-col items-center justify-center gap-2 rounded-xl2 border border-dashed border-slate-300 bg-white/50 text-slate-400 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-600"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Icon name="plus" size={18} />
            </span>
            <span className="text-sm font-medium">新增楼栋</span>
            <span className="text-[11px]">录入新的楼盘档案</span>
          </button>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? '编辑楼栋' : '新增楼栋'}
        desc="楼栋信息用于房源归档与运营统计"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={submit} loading={saving}>{form.id ? '保存修改' : '创建楼栋'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="楼栋名称" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：云居公寓 · 望京 A 座" />
          </Field>
          <Field label="详细地址" required className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="北京市朝阳区……" />
          </Field>
          <Field label="楼层数">
            <Input type="number" min={1} max={60} value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} />
          </Field>
          <Field label="负责管家">
            <Input value={form.keeper} onChange={(e) => setForm({ ...form, keeper: e.target.value })} placeholder="选填" />
          </Field>
          <Field label="备注" className="sm:col-span-2">
            <Textarea rows={3} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="配套设施、特殊说明等" />
          </Field>
          {error ? (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="删除楼栋"
        desc={`确认删除「${deleting?.name ?? ''}」吗？仅当该楼栋下没有房间时才能删除。`}
      />
    </div>
  );
}
