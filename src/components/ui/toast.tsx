'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '../icons';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastType, { ring: string; icon: 'check' | 'alert' | 'bell'; color: string }> = {
  success: { ring: 'ring-emerald-600/15', icon: 'check', color: 'text-emerald-600 bg-emerald-50' },
  error: { ring: 'ring-rose-600/15', icon: 'alert', color: 'text-rose-600 bg-rose-50' },
  info: { ring: 'ring-brand-600/15', icon: 'bell', color: 'text-brand-600 bg-brand-50' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, type, message }].slice(-4));
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-80 flex-col gap-2">
        {items.map((item) => {
          const style = STYLES[item.type];
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-xl bg-white px-4 py-3 shadow-pop ring-1 animate-slide-right',
                style.ring
              )}
            >
              <span className={cn('mt-0.5 flex h-5 w-5 items-center justify-center rounded-full', style.color)}>
                <Icon name={style.icon} size={12} />
              </span>
              <p className="flex-1 text-sm leading-relaxed text-slate-700">{item.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
