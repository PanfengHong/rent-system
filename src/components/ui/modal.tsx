'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Icon } from '../icons';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Modal({
  open,
  onClose,
  title,
  desc,
  footer,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  desc?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn('relative my-auto w-full animate-slide-up rounded-2xl bg-white shadow-pop', SIZES[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {desc ? <p className="mt-1 text-xs text-slate-500">{desc}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="关闭"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  confirmText = '确认删除',
  loading,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc?: string;
  confirmText?: string;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-9 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60',
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'
            )}
          >
            {loading ? '处理中…' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600')}>
          <Icon name="alert" size={18} />
        </span>
        <p className="pt-1.5 text-sm leading-relaxed text-slate-600">{desc || '此操作不可撤销，请确认后继续。'}</p>
      </div>
    </Modal>
  );
}
