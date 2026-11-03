'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Badge, Button, EmptyState, Field, Input, Progress, Select, Textarea } from '@/components/ui/base';
import { Modal } from '@/components/ui/modal';
import { DetailGrid, DetailNote, DetailSection, Drawer } from '@/components/ui/drawer';
import { Pager } from '@/components/ui/pager';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import { PAY_METHOD_LABEL } from '@/lib/billing';
import { BILL_STATUS_META } from '@/lib/labels';
import type { BillView } from '@/lib/queries';
import type { BillStatus, PayMethod } from '@/lib/types';
import { cn, csvEscape, diffDays, formatMoney, percent, todayISO } from '@/lib/utils';

interface Props {
  bills: BillView[];
}

const STATUS_TABS: Array<{ key: 'all' | BillStatus; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待收款' },
  { key: 'partial', label: '部分收款' },
  { key: 'overdue', label: '已逾期' },
  { key: 'paid', label: '已收清' },
];

export function BillsClient({ bills }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'all' | BillStatus>('all');
  const [month, setMonth] = useState('all');
  const [paying, setPaying] = useState<BillView | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'wechat' as PayMethod, note: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [detail, setDetail] = useState<BillView | null>(null);

  const months = useMemo(() => {
    const set = new Set(bills.map((b) => b.periodStart.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [bills]);

  const currentMonth = todayISO().slice(0, 7);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return bills.filter((b) => {
      if (tab !== 'all' && b.status !== tab) return false;
      if (month !== 'all' && b.periodStart.slice(0, 7) !== month) return false;
      if (!kw) return true;
      return b.tenantName.toLowerCase().includes(kw) || b.roomNo.includes(kw) || b.contractCode.toLowerCase().includes(kw);
    });
  }, [bills, tab, month, keyword]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [keyword, tab, month]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const summary = useMemo(() => {
    const source = month === 'all' ? bills.filter((b) => b.periodStart <= todayISO() && b.periodEnd >= todayISO()) : filtered;
    const total = source.reduce((s, b) => s + b.amount, 0);
    const paid = source.reduce((s, b) => s + b.paidAmount, 0);
    return {
      total,
      paid,
      outstanding: total - paid,
      rate: percent(paid, total),
      overdueAmount: bills.filter((b) => b.status === 'overdue').reduce((s, b) => s + b.outstanding, 0),
      overdueCount: bills.filter((b) => b.status === 'overdue').length,
    };
  }, [bills, filtered, month]);

  const counts = useMemo(
    () => ({
      all: bills.length,
      unpaid: bills.filter((b) => b.status === 'unpaid').length,
      partial: bills.filter((b) => b.status === 'partial').length,
      overdue: bills.filter((b) => b.status === 'overdue').length,
      paid: bills.filter((b) => b.status === 'paid').length,
    }),
    [bills]
  );

  function openPay(bill: BillView) {
    setPaying(bill);
    setPayForm({ amount: String(bill.outstanding), method: 'wechat', note: '' });
  }

  async function submitPay() {
    if (!paying) return;
    setPayLoading(true);
    try {
      await api(`/api/bills/${paying.id}/pay`, {
        body: { amount: Number(payForm.amount), method: payForm.method, note: payForm.note },
      });
      toast.success('收款已登记');
      setPaying(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '收款失败');
    } finally {
      setPayLoading(false);
    }
  }

  async function generateBills() {
    setGenerating(true);
    try {
      const res = await api<{ created: number }>('/api/bills/generate', { method: 'POST' });
      if (res.created > 0) {
        toast.success(`已补充生成 ${res.created} 期账单`);
        router.refresh();
      } else {
        toast.info('当前所有合同账单均已生成，无需补充');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  }

  function exportCsv() {
    const header = ['合同号', '租客', '楼栋', '房间', '账期开始', '账期结束', '应缴日', '金额', '已收', '状态'];
    const rows = filtered.map((b) => [
      b.contractCode,
      b.tenantName,
      b.buildingName,
      b.roomNo,
      b.periodStart,
      b.periodEnd,
      b.dueDate,
      b.amount,
      b.paidAmount,
      BILL_STATUS_META[b.status].label,
    ]);
    const csv = `\ufeff${[header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `账单明细_${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: month === 'all' ? '本期应收' : '所选账期应收', value: formatMoney(summary.total), hint: month === 'all' ? '当前计费周期账单' : month },
          { label: month === 'all' ? '本期已收' : '所选账期已收', value: formatMoney(summary.paid), hint: `收缴率 ${summary.rate}%` },
          { label: month === 'all' ? '本期待收' : '所选账期待收', value: formatMoney(summary.outstanding), hint: '当前周期未回款' },
          { label: '逾期未收', value: formatMoney(summary.overdueAmount), hint: `${summary.overdueCount} 笔 · 含历史账期` },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3.5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap rounded-lg bg-slate-100 p-1">
            {STATUS_TABS.map((t) => (
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

          <Select className="h-9 w-36 text-[13px]" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">全部账期</option>
            {months.map((m) => (
              <option key={m} value={m}>{m.replace('-', ' 年 ')} 月{m === currentMonth ? '（本期）' : ''}</option>
            ))}
          </Select>

          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={15} />
            </span>
            <input
              className="field h-9 w-52 pl-8 text-[13px]"
              placeholder="搜索租客 / 房间 / 合同号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" icon="download" onClick={exportCsv}>导出</Button>
            <Button variant="secondary" size="sm" icon="refresh" onClick={generateBills} loading={generating}>生成下期账单</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="bill" title="暂无账单记录" desc="签约后系统会自动生成账单，也可手动补充生成" />
        ) : (
          <div className="table-wrap">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>租客 / 房屋</th>
                  <th>账期</th>
                  <th>应缴日</th>
                  <th>应收金额</th>
                  <th>已收</th>
                  <th>状态</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((b) => {
                  const overdueDays = diffDays(b.dueDate, todayISO());
                  return (
                    <tr key={b.id} onClick={() => setDetail(b)} className="cursor-pointer">
                      <td>
                        <p className="font-medium text-slate-800">{b.tenantName}</p>
                        <p className="text-[11px] text-slate-400">{b.buildingShort} · {b.roomNo} 室 · {b.contractCode}</p>
                      </td>
                      <td className="text-xs tabular-nums text-slate-600">
                        {b.periodStart} <span className="text-slate-300">→</span> {b.periodEnd}
                      </td>
                      <td>
                        <p className="text-xs tabular-nums text-slate-600">{b.dueDate}</p>
                        {b.outstanding > 0 ? (
                          overdueDays > 0 ? (
                            <p className="text-[11px] text-rose-500">逾期 {overdueDays} 天</p>
                          ) : (
                            <p className="text-[11px] text-slate-400">{overdueDays === 0 ? '今天到期' : `剩 ${-overdueDays} 天`}</p>
                          )
                        ) : null}
                      </td>
                      <td className="tabular-nums font-medium text-slate-800">{formatMoney(b.amount)}</td>
                      <td>
                        <p className="tabular-nums text-slate-700">{formatMoney(b.paidAmount)}</p>
                        <Progress value={percent(b.paidAmount, b.amount)} tone={b.status === 'paid' ? 'green' : 'brand'} className="mt-1 w-16" />
                      </td>
                      <td>
                        <Badge tone={BILL_STATUS_META[b.status].tone} dot>{BILL_STATUS_META[b.status].label}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDetail(b); }}
                            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                          >
                            详情
                          </button>
                          {b.outstanding > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openPay(b); }}
                              className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                            >
                              登记收款
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {b.method ? `${PAY_METHOD_LABEL[b.method]} · ${b.paidAt?.slice(5, 10)}` : '已结清'}
                            </span>
                          )}
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
          <span>共 {filtered.length} 条账单 · 合计 {formatMoney(filtered.reduce((s, b) => s + b.amount, 0))}</span>
          <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        </div>
      </div>

      {/* 账单详情 */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.tenantName} · ${detail.roomNo} 室` : '账单详情'}
        desc={detail ? `${detail.buildingName} · 合同 ${detail.contractCode}` : ''}
        extra={detail ? <Badge tone={BILL_STATUS_META[detail.status].tone} dot>{BILL_STATUS_META[detail.status].label}</Badge> : null}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button>
            {detail && detail.outstanding > 0 ? (
              <Button onClick={() => { const b = detail; setDetail(null); openPay(b); }}>登记收款</Button>
            ) : null}
          </>
        }
      >
        {detail ? (
          <>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 px-4 py-3 text-center">
              <div>
                <p className="text-[11px] text-slate-400">应缴</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-800">{formatMoney(detail.amount)}</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[11px] text-slate-400">已收</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-600">{formatMoney(detail.paidAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">待收</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-rose-600">{formatMoney(detail.outstanding)}</p>
              </div>
            </div>

            <DetailSection title="账期信息">
              <DetailGrid
                items={[
                  { label: '账期', value: <span className="tabular-nums">{detail.periodStart} → {detail.periodEnd}</span> },
                  { label: '应缴日', value: <span className="tabular-nums">{detail.dueDate}</span> },
                  {
                    label: '收缴进度',
                    value: `${percent(detail.paidAmount, detail.amount)}%`,
                  },
                  {
                    label: '逾期情况',
                    value: (() => {
                      if (detail.outstanding <= 0) return '已结清';
                      const overdueDays = diffDays(detail.dueDate, todayISO());
                      if (overdueDays > 0) return <span className="text-rose-600">逾期 {overdueDays} 天</span>;
                      if (overdueDays === 0) return '今天到期';
                      return `剩 ${-overdueDays} 天到期`;
                    })(),
                  },
                ]}
              />
            </DetailSection>

            <DetailSection title="收款记录">
              {detail.paidAmount > 0 ? (
                <DetailGrid
                  items={[
                    { label: '收款方式', value: detail.method ? PAY_METHOD_LABEL[detail.method] : '—' },
                    { label: '收款时间', value: detail.paidAt ?? '—' },
                  ]}
                />
              ) : (
                <DetailNote>尚未登记收款，可点击下方「登记收款」记录回款。</DetailNote>
              )}
            </DetailSection>

            {detail.note ? (
              <DetailSection title="备注">
                <DetailNote tone="amber">{detail.note}</DetailNote>
              </DetailSection>
            ) : null}
          </>
        ) : null}
      </Drawer>

      <Modal
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="登记收款"
        desc={paying ? `${paying.tenantName} · ${paying.buildingShort} ${paying.roomNo} 室 · 账期 ${paying.periodStart} ~ ${paying.periodEnd}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaying(null)}>取消</Button>
            <Button onClick={submitPay} loading={payLoading}>确认收款</Button>
          </>
        }
      >
        {paying ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 px-4 py-3 text-center">
              <div>
                <p className="text-[11px] text-slate-400">应缴</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800 tabular-nums">{formatMoney(paying.amount)}</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[11px] text-slate-400">已收</p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-600 tabular-nums">{formatMoney(paying.paidAmount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">待收</p>
                <p className="mt-0.5 text-sm font-semibold text-rose-600 tabular-nums">{formatMoney(paying.outstanding)}</p>
              </div>
            </div>

            <Field label="本次收款金额（元）" required>
              <Input type="number" min={0} step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPayForm({ ...payForm, amount: String(paying.outstanding) })}>全额收款</Button>
              <Button variant="secondary" size="sm" onClick={() => setPayForm({ ...payForm, amount: String(Math.round(paying.outstanding / 2)) })}>收一半</Button>
            </div>

            <Field label="收款方式">
              <div className="grid grid-cols-4 gap-2">
                {(['wechat', 'alipay', 'bank', 'cash'] as PayMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayForm({ ...payForm, method: m })}
                    className={cn(
                      'h-9 rounded-lg border text-xs font-medium transition',
                      payForm.method === m ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    {PAY_METHOD_LABEL[m]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="备注">
              <Textarea rows={2} value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} placeholder="选填，如：转账流水号" />
            </Field>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
