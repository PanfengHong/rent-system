'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Badge, Button, EmptyState, Field, Input, Select, Textarea } from '@/components/ui/base';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { DetailGrid, DetailNote, DetailSection, Drawer } from '@/components/ui/drawer';
import { Pager } from '@/components/ui/pager';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import { FACILITIES, ROOM_STATUS_META } from '@/lib/labels';
import type { RoomView } from '@/lib/queries';
import type { Building, RoomStatus } from '@/lib/types';
import { cn, csvEscape, formatMoney, formatWan, todayISO } from '@/lib/utils';

interface Props {
  rooms: RoomView[];
  buildings: Building[];
}

interface RoomForm {
  id?: string;
  buildingId: string;
  roomNo: string;
  floor: string;
  layout: string;
  orientation: string;
  area: string;
  monthlyRent: string;
  deposit: string;
  status: RoomStatus;
  facilities: string[];
  remark: string;
}

const LAYOUT_OPTIONS = ['开间', '1室1厅', '2室1厅', '2室2厅', '3室1厅'];
const ORIENTATION_OPTIONS = ['朝南', '朝东南', '朝东', '朝西南', '朝北', '朝西'];

function emptyForm(buildings: Building[]): RoomForm {
  return {
    buildingId: buildings[0]?.id ?? '',
    roomNo: '',
    floor: '1',
    layout: '1室1厅',
    orientation: '朝南',
    area: '',
    monthlyRent: '',
    deposit: '',
    status: 'vacant',
    facilities: ['空调', '热水器', '宽带', '衣柜'],
    remark: '',
  };
}

export function RoomsClient({ rooms, buildings }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [buildingId, setBuildingId] = useState('all');
  const [status, setStatus] = useState<'all' | RoomStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RoomForm>(emptyForm(buildings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<RoomView | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detail, setDetail] = useState<RoomView | null>(null);

  const counts = useMemo(
    () => ({
      all: rooms.length,
      rented: rooms.filter((r) => r.status === 'rented').length,
      vacant: rooms.filter((r) => r.status === 'vacant').length,
      maintenance: rooms.filter((r) => r.status === 'maintenance').length,
    }),
    [rooms]
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      if (buildingId !== 'all' && room.buildingId !== buildingId) return false;
      if (status !== 'all' && room.status !== status) return false;
      if (!kw) return true;
      return (
        room.roomNo.includes(kw) ||
        room.buildingName.toLowerCase().includes(kw) ||
        (room.tenantName ?? '').toLowerCase().includes(kw) ||
        (room.tenantPhone ?? '').includes(kw)
      );
    });
  }, [rooms, keyword, buildingId, status]);

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [keyword, buildingId, status]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const monthlyRentSum = filtered.reduce((sum, r) => (r.status === 'rented' ? sum + r.monthlyRent : sum), 0);

  function openCreate() {
    setForm(emptyForm(buildings));
    setError('');
    setModalOpen(true);
  }

  function openEdit(room: RoomView) {
    setForm({
      id: room.id,
      buildingId: room.buildingId,
      roomNo: room.roomNo,
      floor: String(room.floor),
      layout: room.layout,
      orientation: room.orientation,
      area: String(room.area),
      monthlyRent: String(room.monthlyRent),
      deposit: String(room.deposit),
      status: room.status,
      facilities: [...room.facilities],
      remark: room.remark ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function submit() {
    if (saving) return;
    if (!form.buildingId) return setError('请选择所属楼栋');
    if (!form.roomNo.trim()) return setError('请填写房间号');
    if (!(Number(form.area) > 0)) return setError('请填写有效的建筑面积');
    if (!(Number(form.monthlyRent) > 0)) return setError('请填写有效的月租金');

    setSaving(true);
    setError('');
    try {
      const payload = {
        buildingId: form.buildingId,
        roomNo: form.roomNo,
        floor: Number(form.floor) || 1,
        layout: form.layout,
        orientation: form.orientation,
        area: Number(form.area),
        monthlyRent: Number(form.monthlyRent),
        deposit: Number(form.deposit) || Number(form.monthlyRent),
        status: form.status,
        facilities: form.facilities,
        remark: form.remark,
      };
      if (form.id) {
        await api(`/api/rooms/${form.id}`, { method: 'PATCH', body: payload });
        toast.success('房间信息已更新');
      } else {
        await api('/api/rooms', { body: payload });
        toast.success('房间已创建');
      }
      setModalOpen(false);
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
      await api(`/api/rooms/${deleting.id}`, { method: 'DELETE' });
      toast.success('房间已删除');
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  }

  function exportCsv() {
    const header = ['楼栋', '房间号', '楼层', '户型', '朝向', '面积(㎡)', '月租(元)', '押金(元)', '状态', '租客', '联系电话'];
    const rows = filtered.map((r) => [
      r.buildingName,
      r.roomNo,
      r.floor,
      r.layout,
      r.orientation,
      r.area,
      r.monthlyRent,
      r.deposit,
      ROOM_STATUS_META[r.status].label,
      r.tenantName ?? '',
      r.tenantPhone ?? '',
    ]);
    const csv = `\ufeff${[header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `房间列表_${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const tabs: Array<{ key: 'all' | RoomStatus; label: string; count: number }> = [
    { key: 'all', label: '全部', count: counts.all },
    { key: 'rented', label: '已出租', count: counts.rented },
    { key: 'vacant', label: '空置', count: counts.vacant },
    { key: 'maintenance', label: '维修中', count: counts.maintenance },
  ];

  return (
    <div className="space-y-4">
      {/* 概览 */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: '房源总数', value: counts.all, unit: '间', hint: `覆盖 ${buildings.length} 栋楼` },
          { label: '在租房间', value: counts.rented, unit: '间', hint: `月租合计 ${formatWan(monthlyRentSum)}` },
          { label: '空置待租', value: counts.vacant, unit: '间', hint: '建议尽快排房' },
          { label: '维修中', value: counts.maintenance, unit: '间', hint: '暂不参与出租' },
        ].map((item) => (
          <div key={item.label} className="card flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                {item.value}
                <span className="ml-1 text-xs font-normal text-slate-400">{item.unit}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <Icon name="room" size={17} />
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 px-4 py-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  status === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
                <span className={cn('ml-1 tabular-nums', status === tab.key ? 'text-brand-600' : 'text-slate-400')}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={15} />
            </span>
            <input
              className="field h-9 w-56 pl-8 text-[13px]"
              placeholder="搜索房间号 / 租客 / 电话"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <Select className="h-9 w-40 text-[13px]" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
            <option value="all">全部楼栋</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" icon="download" onClick={exportCsv}>导出</Button>
            <Button size="sm" icon="plus" onClick={openCreate}>新增房间</Button>
          </div>
        </div>

        {/* 表格 */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="room"
            title="没有符合条件的房间"
            desc="尝试调整筛选条件，或新增一间房源"
            action={<Button size="sm" icon="plus" onClick={openCreate}>新增房间</Button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>房间</th>
                  <th>楼层 / 面积</th>
                  <th>户型 / 朝向</th>
                  <th>租金</th>
                  <th>状态</th>
                  <th>当前租客</th>
                  <th>合同</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((room) => (
                  <tr key={room.id} onClick={() => setDetail(room)} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                          <Icon name="home" size={15} />
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">{room.roomNo}</p>
                          <p className="text-[11px] text-slate-400">{room.buildingShort}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600">
                      <span className="tabular-nums">{room.floor} 层</span>
                      <span className="mx-1 text-slate-300">/</span>
                      <span className="tabular-nums">{room.area} ㎡</span>
                    </td>
                    <td className="text-slate-600">{room.layout} · {room.orientation}</td>
                    <td>
                      <p className="font-medium tabular-nums text-slate-800">{formatMoney(room.monthlyRent)}<span className="text-[11px] font-normal text-slate-400">/月</span></p>
                      <p className="text-[11px] text-slate-400">押金 {formatMoney(room.deposit)}</p>
                    </td>
                    <td>
                      <Badge tone={ROOM_STATUS_META[room.status].tone} dot>{ROOM_STATUS_META[room.status].label}</Badge>
                    </td>
                    <td>
                      {room.tenantName ? (
                        <div>
                          <p className="text-slate-700">{room.tenantName}</p>
                          <p className="text-[11px] tabular-nums text-slate-400">{room.tenantPhone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500 tabular-nums">{room.contractCode ?? '—'}</td>
                    <td>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDetail(room); }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                        >
                          详情
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEdit(room); }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleting(room); }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="删除房间"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          <span>共 {filtered.length} 间房 · 在租 {filtered.filter((r) => r.status === 'rented').length} 间</span>
          <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
          <span className="hidden sm:block">数据更新于 {todayISO()}</span>
        </div>
      </div>

      {/* 房间详情 */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.buildingShort} · ${detail.roomNo} 室` : '房间详情'}
        desc={detail ? `${detail.buildingName} · ${detail.layout} · ${detail.area} ㎡` : ''}
        extra={detail ? <Badge tone={ROOM_STATUS_META[detail.status].tone} dot>{ROOM_STATUS_META[detail.status].label}</Badge> : null}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button>
            <Button onClick={() => { const r = detail; setDetail(null); if (r) openEdit(r); }}>编辑房间</Button>
          </>
        }
      >
        {detail ? (
          <>
            <DetailGrid
              columns={3}
              items={[
                { label: '楼层', value: `${detail.floor} 层` },
                { label: '建筑面积', value: `${detail.area} ㎡` },
                { label: '户型', value: detail.layout },
                { label: '朝向', value: detail.orientation },
                { label: '月租金', value: <span className="text-slate-900">{formatMoney(detail.monthlyRent)}</span> },
                { label: '押金', value: formatMoney(detail.deposit) },
                {
                  label: '单位租金',
                  value: `${(detail.monthlyRent / Math.max(1, detail.area)).toFixed(1)} 元/㎡`,
                },
                { label: '房态', value: ROOM_STATUS_META[detail.status].label },
                { label: '最近更新', value: detail.updatedAt.slice(0, 10) },
              ]}
            />

            <DetailSection title="当前租客">
              {detail.tenantName ? (
                <div className="rounded-xl border border-slate-200/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-800">{detail.tenantName}</p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-slate-400">{detail.tenantPhone}</p>
                    </div>
                    {detail.contractCode ? (
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] tabular-nums text-slate-600">{detail.contractCode}</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <DetailNote>{detail.status === 'maintenance' ? '房间维修中，暂不可签约。' : '房间空置中，可直接新建租赁合同。'}</DetailNote>
              )}
            </DetailSection>

            <DetailSection title="配套设施">
              {detail.facilities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detail.facilities.map((f) => (
                    <span key={f} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{f}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">未登记配套设施</p>
              )}
            </DetailSection>

            {detail.remark ? (
              <DetailSection title="备注">
                <DetailNote tone="amber">{detail.remark}</DetailNote>
              </DetailSection>
            ) : null}
          </>
        ) : null}
      </Drawer>

      {/* 新增 / 编辑 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? '编辑房间' : '新增房间'}
        desc={form.id ? '修改房源基础信息与出租状态' : '录入新房源，创建后可立即签约'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={submit} loading={saving}>{form.id ? '保存修改' : '创建房间'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="所属楼栋" required>
            <Select value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="房间号" required hint="例如 301，同楼栋内需唯一">
            <Input value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} placeholder="301" />
          </Field>
          <Field label="楼层">
            <Input type="number" min={1} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          </Field>
          <Field label="建筑面积（㎡）" required>
            <Input type="number" min={1} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="45" />
          </Field>
          <Field label="户型">
            <Select value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })}>
              {LAYOUT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="朝向">
            <Select value={form.orientation} onChange={(e) => setForm({ ...form, orientation: e.target.value })}>
              {ORIENTATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
          <Field label="月租金（元）" required>
            <Input type="number" min={1} value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} placeholder="4200" />
          </Field>
          <Field label="押金（元）" hint="留空时默认等于一个月租金">
            <Input type="number" min={0} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="4200" />
          </Field>
          <Field label="房态" hint={form.id ? '存在生效合同时不可改为空置' : '新房间默认可出租'}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}>
              <option value="vacant">空置待租</option>
              <option value="rented">已出租</option>
              <option value="maintenance">维修中</option>
            </Select>
          </Field>
          <Field label="备注">
            <Input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="选填" />
          </Field>

          <div className="sm:col-span-2">
            <label className="label">配套设施</label>
            <div className="flex flex-wrap gap-2">
              {FACILITIES.map((item) => {
                const active = form.facilities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        facilities: active ? form.facilities.filter((f) => f !== item) : [...form.facilities, item],
                      })
                    }
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-xs transition',
                      active
                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

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
        title="删除房间"
        desc={`确认删除「${deleting?.buildingShort ?? ''} ${deleting?.roomNo ?? ''}」吗？该房间的历史合同与账单也会一并删除，且无法恢复。`}
      />
    </div>
  );
}
