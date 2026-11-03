'use client';

import { useState } from 'react';
import { cn, formatMoney } from '@/lib/utils';

/* ------------------------------ 收支趋势面积图 ----------------------------- */

export interface RevenuePoint {
  label: string;
  receivable: number;
  received: number;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mid = (p0.x + p1.x) / 2;
    d += ` C ${mid} ${p0.y}, ${mid} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 248;
  const padL = 50;
  const padR = 14;
  const padT = 18;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.receivable, d.received)));
  const niceMax = Math.max(40000, Math.ceil(maxValue / 40000) * 40000);
  const step = data.length > 1 ? chartW / (data.length - 1) : chartW;
  const xOf = (i: number) => padL + i * step;
  const yOf = (v: number) => padT + chartH - (v / niceMax) * chartH;

  const receivablePts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.receivable) }));
  const receivedPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.received) }));

  const areaPath = `${smoothPath(receivedPts)} L ${xOf(data.length - 1)} ${padT + chartH} L ${padL} ${padT + chartH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="租金收支趋势">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2849e3" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#2849e3" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = padT + chartH - t * chartH;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef1f6" strokeDasharray={t === 0 ? '0' : '4 4'} />
              <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {t === 0 ? '0' : `${(niceMax * t) / 10000}万`}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#areaFill)" />
        <path d={smoothPath(receivablePts)} fill="none" stroke="#c7d2fe" strokeWidth="2" strokeDasharray="5 4" />
        <path d={smoothPath(receivedPts)} fill="none" stroke="#2849e3" strokeWidth="2.5" strokeLinecap="round" />

        {data.map((d, i) => (
          <g key={d.label}>
            <text x={xOf(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {d.label}
            </text>
            {hover === i ? (
              <>
                <line x1={xOf(i)} y1={padT} x2={xOf(i)} y2={padT + chartH} stroke="#cbd5e1" strokeDasharray="3 3" />
                <circle cx={xOf(i)} cy={yOf(d.receivable)} r="4" fill="#fff" stroke="#a5b4fc" strokeWidth="2" />
                <circle cx={xOf(i)} cy={yOf(d.received)} r="4.5" fill="#fff" stroke="#2849e3" strokeWidth="2.5" />
              </>
            ) : null}
            <rect
              x={xOf(i) - step / 2}
              y={padT}
              width={step}
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
      </svg>

      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[130px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-pop backdrop-blur"
          style={{ left: `${(xOf(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? '-105%' : '8px'})` }}
        >
          <p className="mb-1 font-semibold text-slate-700">{data[hover].label}</p>
          <p className="flex items-center justify-between gap-3 text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#c7d2fe]" />应收</span>
            <span className="font-medium text-slate-700">{formatMoney(data[hover].receivable)}</span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-3 text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-brand-600" />实收</span>
            <span className="font-medium text-slate-700">{formatMoney(data[hover].received)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- 环形图 -------------------------------- */

export function DonutChart({
  items,
  size = 176,
  thickness = 16,
  centerLabel,
  centerValue,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {items.map((item) => {
            const len = (item.value / total) * circumference;
            const dash = `${len} ${circumference - len}`;
            const circle = (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">{centerValue}</span>
          <span className="mt-0.5 text-[11px] text-slate-400">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: item.color }} />
            <span className="flex-1 truncate text-slate-500">{item.label}</span>
            <span className="font-semibold text-slate-800">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- 横向条形 ------------------------------- */

export function HBar({
  label,
  value,
  total,
  suffix,
  color = '#2849e3',
}: {
  label: string;
  value: number;
  total: number;
  suffix?: string;
  color?: string;
}) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate text-slate-600">{label}</span>
        <span className="shrink-0 font-medium text-slate-800">
          {suffix ?? value}
          <span className="ml-1 text-slate-400">{Math.round(pct)}%</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* -------------------------------- 迷你趋势 ------------------------------- */

export function Sparkline({ values, tone = 'brand' }: { values: number[]; tone?: 'brand' | 'green' | 'amber' | 'rose' }) {
  const colors = { brand: '#2849e3', green: '#10b981', amber: '#f59e0b', rose: '#f43f5e' };
  const w = 84;
  const h = 28;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / Math.max(values.length - 1, 1)) * w,
    y: h - ((v - min) / span) * (h - 4) - 2,
  }));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={smoothPath(pts)} fill="none" stroke={colors[tone]} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- 图例组件 -------------------------------- */

export function ChartLegend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span
            className={cn('h-0.5 w-3.5 rounded', i.dashed && 'opacity-60')}
            style={{ background: i.dashed ? `repeating-linear-gradient(to right, ${i.color} 0 4px, transparent 4px 7px)` : i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
