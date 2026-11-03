import type { Metadata } from 'next';
import { Icon } from '@/components/icons';
import { Badge, Card, CardHeader, Progress } from '@/components/ui/base';
import { ChartLegend, DonutChart, HBar, RevenueChart } from '@/components/charts';
import { PAY_METHOD_LABEL } from '@/lib/billing';
import { getReport } from '@/lib/queries';
import { cn, formatMoney, formatWan, percent } from '@/lib/utils';

export const metadata: Metadata = { title: '经营分析' };
export const dynamic = 'force-dynamic';

const METHOD_COLORS: Record<string, string> = {
  wechat: '#10b981',
  alipay: '#3b82f6',
  bank: '#2849e3',
  cash: '#f59e0b',
};

export default function ReportsPage() {
  const report = getReport();
  const maxAging = Math.max(...report.aging.map((a) => a.amount), 1);
  const maxBuildingRent = Math.max(...report.buildingIncome.map((b) => b.monthlyRent), 1);
  const methodTotal = report.methods.reduce((s, m) => s + m.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: '整体出租率', value: `${report.summary.occupancy}%`, hint: '在租房源 / 全部房源', trend: '环比上月持平' },
          { label: '平均月租金', value: formatMoney(report.summary.avgRent), hint: '在租房间成交均价', trend: `${report.summary.activeContracts} 份生效合同` },
          { label: '累计应收', value: formatMoney(report.summary.totalReceivable), hint: '全部账单金额', trend: `已收 ${formatWan(report.summary.totalReceived)}` },
          { label: '欠款租客占比', value: `${report.summary.overdueRate.toFixed(1)}%`, hint: '存在逾期账单的占比', trend: `${report.summary.debtorCount} 位欠款租客` },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1.5 text-xl font-semibold text-slate-900 tabular-nums">{s.value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{s.hint}</p>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-brand-600">
              <Icon name="sparkle" size={11} /> {s.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="近 12 个月租金收支"
            desc="应收按合同周期折算，实收按收款时间归集"
            action={<ChartLegend items={[{ label: '应收', color: '#a5b4fc', dashed: true }, { label: '实收', color: '#2849e3' }]} />}
          />
          <div className="px-3 pb-3 pt-4 sm:px-4">
            <RevenueChart data={report.revenue} />
          </div>
        </Card>

        <Card>
          <CardHeader title="本月收款方式" desc="按实收金额统计" />
          <div className="px-5 py-5">
            {methodTotal > 0 ? (
              <>
                <DonutChart
                  items={report.methods.map((m) => ({
                    label: PAY_METHOD_LABEL[m.method] ?? m.method,
                    value: Math.round(m.value),
                    color: METHOD_COLORS[m.method] ?? '#94a3b8',
                  }))}
                  centerValue={formatWan(methodTotal)}
                  centerLabel="本月实收"
                  size={160}
                />
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <p className="flex justify-between"><span>微信 / 支付宝占比</span><span className="font-medium text-slate-700">
                    {percent(
                      report.methods.filter((m) => m.method === 'wechat' || m.method === 'alipay').reduce((s, m) => s + m.value, 0),
                      methodTotal
                    )}%
                  </span></p>
                  <p className="flex justify-between"><span>对公转账占比</span><span className="font-medium text-slate-700">
                    {percent(report.methods.find((m) => m.method === 'bank')?.value ?? 0, methodTotal)}%
                  </span></p>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">本月暂无收款记录</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="楼栋出租率" desc="按楼栋对比在租情况" />
          <div className="space-y-4 px-5 py-4">
            {report.buildingIncome.map((b) => (
              <HBar key={b.id} label={b.name} value={b.rented} total={b.total} suffix={`${b.rented}/${b.total}`} color={b.occupancy >= 80 ? '#10b981' : '#2849e3'} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="楼栋月租金规模" desc="在租房间合同月租合计" />
          <div className="space-y-3.5 px-5 py-4">
            {report.buildingIncome.map((b) => (
              <div key={b.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{b.name}</span>
                  <span className="font-medium tabular-nums text-slate-800">{formatMoney(b.monthlyRent)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(b.monthlyRent / (maxBuildingRent * 1.12)) * 100}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">本期已收 {formatMoney(b.received)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="账龄分析" desc="未收账单按逾期时长分布" />
          <div className="space-y-4 px-5 py-4">
            {report.aging.map((a) => (
              <div key={a.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
                    {a.label}
                    <span className="text-slate-400">({a.count})</span>
                  </span>
                  <span className="font-medium tabular-nums text-slate-800">{formatMoney(a.amount)}</span>
                </div>
                <Progress value={(a.amount / maxAging) * 100} tone={a.label === '未到期' ? 'green' : a.label.includes('60') ? 'red' : 'amber'} />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500">待收合计</span>
              <span className="font-semibold text-slate-900">{formatMoney(report.aging.reduce((s, a) => s + a.amount, 0))}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="欠款排行" desc="建议优先跟进的租客，按欠款金额排序" action={<Badge tone="red">TOP {report.debtors.length}</Badge>} />
        {report.debtors.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">所有账单均已结清，回款状况良好</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table min-w-[620px]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>租客</th>
                  <th>房屋</th>
                  <th>欠款金额</th>
                  <th>最长逾期</th>
                  <th>风险</th>
                </tr>
              </thead>
              <tbody>
                {report.debtors.map((d, i) => (
                  <tr key={`${d.tenantName}-${i}`}>
                    <td className="w-10 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="font-medium text-slate-800">{d.tenantName}</td>
                    <td className="text-slate-600">{d.room}</td>
                    <td className="font-semibold text-rose-600 tabular-nums">{formatMoney(d.amount)}</td>
                    <td>
                      <span className={cn('text-xs tabular-nums', d.maxOverdue > 30 ? 'text-rose-600' : d.maxOverdue > 0 ? 'text-amber-600' : 'text-slate-500')}>
                        {d.maxOverdue > 0 ? `${d.maxOverdue} 天` : '未逾期'}
                      </span>
                    </td>
                    <td>
                      <Badge tone={d.maxOverdue > 60 ? 'red' : d.maxOverdue > 30 ? 'amber' : 'slate'}>
                        {d.maxOverdue > 60 ? '高风险' : d.maxOverdue > 30 ? '需关注' : '一般'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
