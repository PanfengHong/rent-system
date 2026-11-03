import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { Badge, Progress } from '@/components/ui/base';
import { ChartLegend, DonutChart, RevenueChart } from '@/components/charts';
import { getDashboard } from '@/lib/queries';
import { cn, formatMoney, formatWan, percent } from '@/lib/utils';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: '工作台' };
export const dynamic = 'force-dynamic';

function Trend({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-medium', up ? 'text-emerald-600' : 'text-rose-600')}>
      <Icon name={up ? 'arrow-up' : 'arrow-down'} size={11} />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon,
  tone,
  footer,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: 'room' | 'wallet' | 'bill' | 'wrench';
  tone: 'brand' | 'green' | 'amber' | 'rose';
  footer: ReactNode;
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tones[tone])}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="mt-2.5 text-[26px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span> : null}
      </p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">{footer}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = getDashboard();
  const { kpi } = data;
  const last = data.revenue[data.revenue.length - 1]?.received ?? 0;
  const prev = data.revenue[data.revenue.length - 2]?.received ?? 0;
  const mom = prev ? ((last - prev) / prev) * 100 : 0;
  const activeOrders = data.orders;

  return (
    <div className="space-y-5">
      {/* 欢迎条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-white px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold text-slate-900">
            {user.name}，{new Date().getHours() < 12 ? '上午好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            当前有 <span className="font-semibold text-brand-700">{kpi.expiringCount}</span> 份合同 60 天内到期，
            <span className="font-semibold text-rose-600">{kpi.overdueCount}</span> 笔账单逾期未收，需要关注。
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/contracts" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 hover:border-slate-300">
            <Icon name="contract" size={14} /> 处理合同
          </Link>
          <Link href="/bills" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[13px] font-medium text-white hover:bg-brand-700">
            <Icon name="wallet" size={14} /> 去收款
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="在管房源"
          value={String(kpi.totalRooms)}
          unit="间"
          icon="room"
          tone="brand"
          footer={
            <>
              <span>出租率 <b className="font-semibold text-slate-700">{kpi.occupancy}%</b></span>
              <span className="text-slate-300">|</span>
              <span>空置 {kpi.vacant} 间</span>
            </>
          }
        />
        <StatCard
          label="本期应收租金"
          value={formatMoney(kpi.periodReceivable).replace('¥', '')}
          unit="元"
          icon="wallet"
          tone="green"
          footer={
            <>
              <span>已收 {formatMoney(kpi.periodReceived)}</span>
              <span className="text-slate-300">|</span>
              <span>收缴率 <b className="font-semibold text-slate-700">{kpi.collectionRate}%</b></span>
            </>
          }
        />
        <StatCard
          label="本月回款"
          value={formatMoney(kpi.monthReceived).replace('¥', '')}
          unit="元"
          icon="bill"
          tone="brand"
          footer={
            <>
              <Trend value={mom} />
              <span>较上月</span>
            </>
          }
        />
        <StatCard
          label="逾期未收"
          value={formatMoney(kpi.overdueAmount).replace('¥', '')}
          unit="元"
          icon="wrench"
          tone="rose"
          footer={
            <>
              <span className="text-rose-600">{kpi.overdueCount} 笔逾期</span>
              <span className="text-slate-300">|</span>
              <span>待办工单 {kpi.pendingOrders}</span>
            </>
          }
        />
      </div>

      {/* 图表区 */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">租金收支趋势</h2>
              <p className="mt-0.5 text-xs text-slate-500">近 6 个月应收与实收对比，按合同周期折算</p>
            </div>
            <ChartLegend
              items={[
                { label: '应收', color: '#a5b4fc', dashed: true },
                { label: '实收', color: '#2849e3' },
              ]}
            />
          </div>
          <div className="px-3 pb-3 pt-4 sm:px-4">
            <RevenueChart data={data.revenue} />
          </div>
        </div>

        <div className="card">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">房态分布</h2>
            <p className="mt-0.5 text-xs text-slate-500">全部 {kpi.totalRooms} 间房源当前状态</p>
          </div>
          <div className="px-5 py-5">
            <DonutChart items={data.roomStatus} centerValue={`${kpi.occupancy}%`} centerLabel="整体出租率" />
            <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
              {data.buildings.map((b) => (
                <div key={b.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-slate-600">{b.name}</span>
                    <span className="tabular-nums text-slate-500">
                      {b.rented}/{b.total} · <b className="font-semibold text-slate-700">{b.occupancy}%</b>
                    </span>
                  </div>
                  <Progress value={b.occupancy} tone={b.occupancy >= 85 ? 'green' : b.occupancy >= 65 ? 'brand' : 'amber'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 到期 + 逾期 */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">即将到期合同</h2>
              <p className="mt-0.5 text-xs text-slate-500">60 天内到期，建议提前联系续租</p>
            </div>
            <Link href="/contracts" className="link-btn">全部合同</Link>
          </div>
          {data.expiring.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">近 60 天内没有到期的合同</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>租客 / 房间</th>
                    <th>月租</th>
                    <th>到期日</th>
                    <th>剩余</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expiring.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <p className="font-medium text-slate-800">{c.tenantName}</p>
                        <p className="text-xs text-slate-400">{c.buildingShort} · {c.roomNo} 室 · {c.code}</p>
                      </td>
                      <td className="tabular-nums">{formatMoney(c.monthlyRent)}</td>
                      <td className="tabular-nums text-slate-600">{c.endDate}</td>
                      <td>
                        <Badge tone={c.daysLeft <= 15 ? 'red' : c.daysLeft <= 30 ? 'amber' : 'slate'}>
                          {c.daysLeft} 天
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Link href="/contracts" className="link-btn">续租</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">逾期账单</h2>
              <p className="mt-0.5 text-xs text-slate-500">共 {kpi.overdueCount} 笔 · {formatMoney(kpi.overdueAmount)}</p>
            </div>
            <Link href="/bills" className="link-btn">去收款</Link>
          </div>
          {data.overdue.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">暂无逾期账单</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.overdue.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{b.tenantName}</p>
                    <p className="text-[11px] text-slate-400">{b.buildingShort} {b.roomNo} · 应缴 {b.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-rose-600 tabular-nums">{formatMoney(b.outstanding)}</p>
                    <p className="text-[11px] text-slate-400">{b.status === 'overdue' ? '已逾期' : '待收款'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 工单 + 楼栋 */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">待处理报修</h2>
              <p className="mt-0.5 text-xs text-slate-500">按创建时间排序，优先处理高优先级工单</p>
            </div>
            <Link href="/maintenance" className="link-btn">工单看板</Link>
          </div>
          {activeOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">所有报修均已处理完成</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      o.priority === 'high' ? 'bg-rose-50 text-rose-600' : o.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Icon name="wrench" size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800">{o.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {o.buildingShort} {o.roomNo} · {o.category} · {o.createdAt.slice(5, 16).replace('T', ' ')}
                    </p>
                  </div>
                  <Badge tone={o.status === 'processing' ? 'blue' : 'amber'}>{o.status === 'processing' ? '处理中' : '待受理'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">本月经营概览</h2>
            <p className="mt-0.5 text-xs text-slate-500">关键指标速览</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            {[
              { label: '出租率', value: `${kpi.occupancy}%`, hint: `${kpi.rented} / ${kpi.totalRooms} 间` },
              { label: '收缴率', value: `${kpi.collectionRate}%`, hint: `应收 ${formatWan(kpi.periodReceivable)}` },
              { label: '空置房源', value: `${kpi.vacant}`, hint: `占比 ${percent(kpi.vacant, kpi.totalRooms)}%` },
              { label: '维修中', value: `${kpi.maintenance}`, hint: '暂不可出租' },
            ].map((item) => (
              <div key={item.label} className="bg-white px-5 py-4">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1.5 text-xl font-semibold text-slate-900 tabular-nums">{item.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-4 py-3">
            <p className="px-1 text-[11px] font-medium text-slate-500">待办提醒</p>
            <div className="mt-1.5 space-y-0.5">
              {[
                { href: '/contracts', icon: 'contract' as const, label: '60 天内到期合同', value: `${kpi.expiringCount} 份`, color: 'text-amber-500' },
                { href: '/bills', icon: 'bill' as const, label: '逾期未收账单', value: `${kpi.overdueCount} 笔`, color: 'text-rose-500' },
                { href: '/maintenance', icon: 'wrench' as const, label: '待处理报修工单', value: `${kpi.pendingOrders} 单`, color: 'text-sky-500' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-lg px-1.5 py-1.5 text-[12px] text-slate-600 transition hover:bg-slate-50">
                  <span className="flex items-center gap-1.5">
                    <Icon name={item.icon} size={13} className={item.color} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
