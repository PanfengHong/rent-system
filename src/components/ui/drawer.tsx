'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Icon } from '../icons';

const WIDTHS = {
  sm: 'sm:max-w-[360px]',
  md: 'sm:max-w-[440px]',
  lg: 'sm:max-w-[560px]',
  xl: 'sm:max-w-[720px]',
} as const;

/**
 * 右侧滑出抽屉，用于展示表格行的详情。
 * 与 Modal 的区别：贴边全高、从右侧滑入，内容可长滚动，不会遮挡左侧列表。
 */
export function Drawer({
  open,
  onClose,
  title,
  desc,
  extra,
  footer,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  desc?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex h-full w-full animate-drawer-in flex-col bg-white shadow-[-16px_0_48px_-16px_rgba(16,24,40,0.28)]',
          WIDTHS[size]
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold text-slate-900">{title}</h2>
              {extra}
            </div>
            {desc ? <p className="mt-1 text-xs text-slate-500">{desc}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="-mr-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5">{footer}</footer>
        ) : null}
      </aside>
    </div>,
    document.body
  );
}

/** 抽屉内的分区标题 */
export function DetailSection({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold tracking-wide text-slate-400">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 抽屉内的键值对网格 */
export function DetailGrid({
  items,
  columns = 2,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-x-4 gap-y-3 rounded-xl bg-slate-50 px-4 py-3.5',
        columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : columns === 1 ? 'grid-cols-1' : 'grid-cols-2',
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-[11px] text-slate-400">{item.label}</p>
          <div className="mt-0.5 break-words text-[13px] font-medium text-slate-800">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

/** 抽屉内的提示条 */
export function DetailNote({ tone = 'slate', children }: { tone?: 'slate' | 'amber' | 'brand'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2 text-xs leading-relaxed',
        tone === 'amber' && 'bg-amber-50/70 text-amber-800',
        tone === 'brand' && 'bg-brand-50/70 text-brand-800',
        tone === 'slate' && 'bg-slate-50 text-slate-600'
      )}
    >
      {children}
    </div>
  );
}
