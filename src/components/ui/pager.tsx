'use client';

import { Icon } from '../icons';
import { cn } from '@/lib/utils';

export function Pager({
  page,
  pageSize,
  total,
  onChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const numbers: Array<number | '...'> = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i += 1) numbers.push(i);
  } else {
    numbers.push(1);
    if (page > 3) numbers.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i += 1) numbers.push(i);
    if (page < pages - 2) numbers.push('...');
    numbers.push(pages);
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="上一页"
      >
        <Icon name="chevron-left" size={13} />
      </button>
      {numbers.map((n, idx) =>
        n === '...' ? (
          <span key={`gap-${idx}`} className="px-1 text-xs text-slate-400">…</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'h-7 min-w-7 rounded-md px-1.5 text-xs font-medium tabular-nums transition',
              n === page ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            {n}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="下一页"
      >
        <Icon name="chevron-right" size={13} />
      </button>
    </div>
  );
}
