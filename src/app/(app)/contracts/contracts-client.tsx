'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Badge, Button, EmptyState, Field, Input, Progress, Select, Textarea } from '@/components/ui/base';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { DetailGrid, DetailNote, DetailSection, Drawer } from '@/components/ui/drawer';
import { Pager } from '@/components/ui/pager';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import { BILL_STATUS_META, CONTRACT_STATUS_META, PAY_CYCLE_LABEL } from '@/lib/labels';
import type { BillView, ContractView, RoomView, TenantView } from '@/lib/queries';
import type { ContractStatus } from '@/lib/types';
import { addDays, addMonths, cn, formatMoney, percent, todayISO } from '@/lib/utils';

interface Props {
  contracts: ContractView[];
  rooms: RoomView[];
  tenants: TenantView[];
  bills: BillView[];
}

interface Form {
  roomId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  payCycle: string;
  remark: string;
}

function defaultForm(): Form {
  const start = todayISO();
  return {
    roomId: '',
    tenantId: '',
    startDate: start,
    endDate: addDays(addMonths(start, 12), -1),
    monthlyRent: '',
    deposit: '',
    payCycle: '3',
    remark: '',
  };
}

export function ContractsClient({ contracts, rooms, tenants, bills }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'all' | ContractStatus>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Form>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<ContractView | null>(null);
  const [renewTarget, setRenewTarget] = useState<ContractView | null>(null);
  const [renewForm, setRenewForm] = useState({ months: '12', monthlyRent: '', payCycle: '3' });
  const [renewing, setRenewing] = useState(false);
  const [terminating, setTerminating] = useState<ContractView | null>(null);
  const [terminateLoading, setTerminateLoading] = useState(false);

  const counts = useMemo(
    () => ({
      all: contracts.length,
      active: contracts.filter((c) => c.status === 'active').length,
      pending: contracts.filter((c) => c.status === 'pending').length,
      expired: contracts.filter((c) => c.status === 'expired').length,
      terminated: contracts.filter((c) => c.status === 'terminated').length,
    }),
    [contracts]
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return contracts.filter((c) => {
      if (tab !== 'all' && c.status !== tab) return false;
      if (!kw) return true;
      return (
        c.code.toLowerCase().includes(kw) ||
        c.tenantName.toLowerCase().includes(kw) ||
        c.roomNo.includes(kw) ||
        c.tenantPhone.includes(kw)
      );
    });
  }, [contracts, keyword, tab]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [keyword, tab]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const vacantRooms = rooms.filter((r) => r.status === 'vacant');
  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const relatedBills = detail ? bills.filter((b) => b.contractId === detail.id) : [];

  function openCreate() {
    setForm(defaultForm());
    setError('');
    setCreateOpen(true);
  }

  function pickRoom(roomId: string) {
    const room = rooms.find((r) => r.id === roomId);
    setForm((prev) => ({
      ...prev,
      roomId,
      monthlyRent: room ? String(room.monthlyRent) : prev.monthlyRent,
      deposit: room ? String(room.deposit) : prev.deposit,
    }));
  }

  async function submit() {
    if (saving) return;
    if (!form.roomId) return setError('请选择出租房间');
    if (!form.tenantId) return setError('请选择租客');
    if (!form.startDate || !form.endDate) return setError('请选择租期');
    if (form.endDate <= form.startDate) return setError('结束日期需晚于开始日期');
    if (!(Number(form.monthlyRent) > 0)) return setError('请填写有效的月租金');

    setSaving(true);
    setError('');
    try {
      await api('/api/contracts', {
        body: {
          roomId: form.roomId,
          tenantId: form.tenantId,
          startDate: form.startDate,
          endDate: form.endDate,
          monthlyRent: Number(form.monthlyRent),
          deposit: Number(form.deposit) || 0,
          payCycle: Number(form.payCycle),
          remark: form.remark,
        },
      });
      toast.success('合同已创建，账单已自动生成');
      setCreateOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSaving(false);
    }
  }

  function openRenew(contract: ContractView) {
    setRenewTarget(contract);
    setRenewForm({ months: '12', monthlyRent: String(contract.monthlyRent), payCycle: String(contract.payCycle) });
  }

  async function submitRenew() {
    if (!renewTarget) return;
    setRenewing(true);
    try {
      await api(`/api/contracts/${renewTarget.id}`, {
        method: 'PATCH',
        body: { action: 'renew', months: Number(renewForm.months), monthlyRent: Number(renewForm.monthlyRent), payCycle: Number(renewForm.payCycle) },
      });
      toast.success('续租成功，已生成新合同与账单');
      setRenewTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '续租失败');
    } finally {
      setRenewing(false);
    }
  }

  async function confirmTerminate() {
    if (!terminating) return;
    setTerminateLoading(true);
    try {
      await api(`/api/contracts/${terminating.id}`, { method: 'PATCH', body: { action: 'terminate' } });
      toast.success('已办理退租，房间恢复为空置');
      setTerminating(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '退租失败');
    } finally {
      setTerminateLoading(false);
    }
  }

  const tabs: Array<{ key: 'all' | ContractStatus; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '履行中' },
    { key: 'pending', label: '待生效' },
    { key: 'expired', label: '已到期' },
    { key: 'terminated', label: '已退租' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '合同总数', value: counts.all, hint: '含历史合同' },
          { label: '履行中', value: counts.active, hint: '当前有效租约' },
          { label: '待生效', value: counts.pending, hint: '租期未开始' },
          { label: '即将到期', value: contracts.filter((c) => c.status === 'active' && c.daysLeft <= 30).length, hint: '30 天内到期' },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3.5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{s.value}<span className="ml-1 text-xs font-normal text-slate-400">份</span></p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap rounded-lg bg-slate-100 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.label}
                <span className={cn('ml-1 tabular-nums', tab === t.key ? 'text-brand-600' : 'text-slate-400')}>{counts[t.key]}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={15} />
            </span>
            <input
              className="field h-9 w-56 pl-8 text-[13px]"
              placeholder="搜索合同号 / 租客 / 房间"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="ml-auto">
            <Button size="sm" icon="plus" onClick={openCreate}>新建合同</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="contract" title="暂无合同记录" desc="选择空置房间与租客即可创建合同并自动生成账单" action={<Button size="sm" icon="plus" onClick={openCreate}>新建合同</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="data-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>合同编号</th>
                  <th>租客 / 房屋</th>
                  <th>租期</th>
                  <th>月租 / 付款</th>
                  <th>状态</th>
                  <th>回款进度</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => {
                  const total = c.paid + c.outstanding;
                  const rate = percent(c.paid, total);
                  return (
                    <tr key={c.id} onClick={() => setDetail(c)} className="cursor-pointer">
                      <td>
                        <p className="font-medium text-slate-800 tabular-nums">{c.code}</p>
                        <p className="text-[11px] text-slate-400">签约 {c.signedAt}</p>
                      </td>
                      <td>
                        <p className="text-slate-800">{c.tenantName}</p>
                        <p className="text-[11px] text-slate-400">{c.buildingShort} · {c.roomNo} 室</p>
                      </td>
                      <td>
                        <p className="tabular-nums text-slate-600">{c.startDate} 起</p>
                        <p className="text-[11px] text-slate-400">
                          至 {c.endDate}
                          {c.status === 'active' ? (
                            <span className={cn('ml-1', c.daysLeft <= 30 ? 'text-amber-600' : 'text-slate-400')}>（剩 {c.daysLeft} 天）</span>
                          ) : null}
                        </p>
                      </td>
                      <td>
                        <p className="tabular-nums text-slate-700">{formatMoney(c.monthlyRent)}<span className="text-[11px] text-slate-400">/月</span></p>
                        <p className="text-[11px] text-slate-400">{PAY_CYCLE_LABEL[c.payCycle]} · 押金 {formatMoney(c.deposit)}</p>
                      </td>
                      <td>
                        <Badge tone={CONTRACT_STATUS_META[c.status].tone} dot>{CONTRACT_STATUS_META[c.status].label}</Badge>
                      </td>
                      <td className="w-32">
                        <div className="flex items-center gap-1.5">
                          <Progress value={rate} tone={rate >= 99 ? 'green' : rate >= 60 ? 'brand' : 'amber'} className="w-16" />
                          <span className="text-[11px] tabular-nums text-slate-500">{Math.round(rate)}%</span>
                        </div>
                        {c.outstanding > 0 ? (
                          <p className="mt-1 text-[11px] text-rose-500">欠 {formatMoney(c.outstanding)}</p>
                        ) : (
                          <p className="mt-1 text-[11px] text-emerald-600">已结清</p>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDetail(c); }}
                            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                          >
                            详情
                          </button>
                          {c.status === 'active' || c.status === 'expired' ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openRenew(c); }}
                              className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                            >
                              续租
                            </button>
                          ) : null}
                          {c.status === 'active' || c.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setTerminating(c); }}
                              className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                              退租
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          <span>共 {filtered.length} 份合同</span>
          <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        </div>
      </div>

      {/* 新建合同 */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新建租赁合同"
        desc="签约后将自动按付款周期生成账单，并同步房间状态"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={submit} loading={saving}>确认签约</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="出租房间" required hint={`当前 ${vacantRooms.length} 间空置房源可选`}>
            <Select value={form.roomId} onChange={(e) => pickRoom(e.target.value)}>
              <option value="">请选择房间</option>
              {vacantRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.buildingShort} · {r.roomNo} 室（{r.layout} / {r.area}㎡ / {r.monthlyRent} 元）
                </option>
              ))}
            </Select>
          </Field>
          <Field label="承租租客" required>
            <Select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
              <option value="">请选择租客</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}（{t.phone}）{t.renting ? ' · 在租' : ''}</option>
              ))}
            </Select>
          </Field>
          <Field label="开始日期" required>
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="结束日期" required>
            <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <Field label="月租金（元）" required>
            <Input type="number" min={1} value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
          </Field>
          <Field label="押金（元）">
            <Input type="number" min={0} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
          </Field>
          <Field label="付款周期">
            <Select value={form.payCycle} onChange={(e) => setForm({ ...form, payCycle: e.target.value })}>
              <option value="1">月付</option>
              <option value="3">季付</option>
              <option value="6">半年付</option>
              <option value="12">年付</option>
            </Select>
          </Field>
          <Field label="租期预览">
            <div className="flex h-9 items-center rounded-lg bg-slate-50 px-3 text-xs text-slate-500">
              {selectedRoom ? `${selectedRoom.buildingShort} · ${selectedRoom.roomNo} 室` : '未选择房间'}
            </div>
          </Field>
          <Field label="备注" className="sm:col-span-2">
            <Textarea rows={2} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="例如：含物业费，水电按表另计" />
          </Field>
          {error ? (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* 合同详情 */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`合同 ${detail?.code ?? ''}`}
        desc={detail ? `${detail.tenantName} · ${detail.buildingShort} ${detail.roomNo} 室` : ''}
        extra={detail ? <Badge tone={CONTRACT_STATUS_META[detail.status].tone} dot>{CONTRACT_STATUS_META[detail.status].label}</Badge> : null}
        size="xl"
        footer={
          <>
            {detail && (detail.status === 'active' || detail.status === 'expired') ? (
              <Button variant="secondary" onClick={() => { const c = detail; setDetail(null); openRenew(c); }}>办理续租</Button>
            ) : null}
            <Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button>
          </>
        }
      >
        {detail ? (
          <>
            <DetailGrid
              columns={3}
              items={[
                { label: '租客', value: `${detail.tenantName}（${detail.tenantPhone}）` },
                { label: '房屋', value: `${detail.buildingName} ${detail.roomNo} 室` },
                { label: '租期', value: `${detail.startDate} → ${detail.endDate}` },
                { label: '月租 / 押金', value: `${formatMoney(detail.monthlyRent)} / ${formatMoney(detail.deposit)}` },
                { label: '付款方式', value: PAY_CYCLE_LABEL[detail.payCycle] },
                { label: '签约日期', value: detail.signedAt },
                { label: '已收金额', value: <span className="text-emerald-600">{formatMoney(detail.paid)}</span> },
                { label: '待收金额', value: <span className={detail.outstanding > 0 ? 'text-rose-600' : ''}>{formatMoney(detail.outstanding)}</span> },
                {
                  label: '剩余租期',
                  value: detail.status === 'active' ? `${detail.daysLeft} 天` : '—',
                },
              ]}
            />

            {detail.remark ? (
              <DetailSection title="备注">
                <DetailNote tone="amber">{detail.remark}</DetailNote>
              </DetailSection>
            ) : null}

            <DetailSection
              title={`账单明细（${relatedBills.length} 期）`}
              action={<span className="text-[11px] text-slate-400">合计 {formatMoney(detail.paid + detail.outstanding)}</span>}
            >
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>账期</th>
                      <th>应缴日</th>
                      <th>金额</th>
                      <th>已收</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedBills.map((b) => (
                      <tr key={b.id}>
                        <td className="text-xs tabular-nums">{b.periodStart} ~ {b.periodEnd}</td>
                        <td className="text-xs tabular-nums text-slate-500">{b.dueDate}</td>
                        <td className="text-xs tabular-nums">{formatMoney(b.amount)}</td>
                        <td className="text-xs tabular-nums">{formatMoney(b.paidAmount)}</td>
                        <td><Badge tone={BILL_STATUS_META[b.status].tone}>{BILL_STATUS_META[b.status].label}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailSection>
          </>
        ) : null}
      </Drawer>

      {/* 续租 */}
      <Modal
        open={Boolean(renewTarget)}
        onClose={() => setRenewTarget(null)}
        title="办理续租"
        desc={renewTarget ? `原合同 ${renewTarget.code} 到期日 ${renewTarget.endDate}，新合同从次日开始` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenewTarget(null)}>取消</Button>
            <Button onClick={submitRenew} loading={renewing}>确认续租</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="续租时长">
            <Select value={renewForm.months} onChange={(e) => setRenewForm({ ...renewForm, months: e.target.value })}>
              <option value="6">6 个月</option>
              <option value="12">12 个月</option>
              <option value="24">24 个月</option>
              <option value="36">36 个月</option>
            </Select>
          </Field>
          <Field label="付款周期">
            <Select value={renewForm.payCycle} onChange={(e) => setRenewForm({ ...renewForm, payCycle: e.target.value })}>
              <option value="1">月付</option>
              <option value="3">季付</option>
              <option value="6">半年付</option>
              <option value="12">年付</option>
            </Select>
          </Field>
          <Field label="新月租金（元）" className="col-span-2">
            <Input type="number" min={1} value={renewForm.monthlyRent} onChange={(e) => setRenewForm({ ...renewForm, monthlyRent: e.target.value })} />
          </Field>
          <p className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            续租后将自动生成 {renewForm.months} 个月租期对应的账单，并同步更新房间租金。
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(terminating)}
        onClose={() => setTerminating(null)}
        onConfirm={confirmTerminate}
        loading={terminateLoading}
        title="办理退租"
        confirmText="确认退租"
        desc={`确认为「${terminating?.tenantName ?? ''}」办理 ${terminating?.code ?? ''} 的退租吗？房间将恢复为空置，退租日之后未收款的账单会被清理。`}
      />
    </div>
  );
}
