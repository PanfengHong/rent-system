import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from '../icons';

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  block?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  block,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-4 text-sm',
        VARIANTS[variant],
        block && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 13 : 15} /> : icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  tone = 'default',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
        tone === 'danger' && 'hover:bg-rose-50 hover:text-rose-600',
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/* --------------------------------- Spinner -------------------------------- */

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn('animate-spin', className)} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.22" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('card', className)}>{children}</section>;
}

export function CardHeader({
  title,
  desc,
  action,
  className,
}: {
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {desc ? <p className="mt-0.5 text-xs text-slate-500">{desc}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ---------------------------------- Badge --------------------------------- */

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'violet' | 'brand';

const TONES: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
};

export function Badge({
  tone = 'slate',
  children,
  dot,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

/* ---------------------------------- Field --------------------------------- */

export function Field({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      {label ? (
        <label className="label">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field', className)} {...rest} />;
}

const SELECT_ARROW =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")";

export function Select({ className, children, style, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('field appearance-none bg-no-repeat pr-8', className)}
      style={{ backgroundImage: SELECT_ARROW, backgroundPosition: 'right 0.6rem center', ...style }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field resize-none', className)} {...rest} />;
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  icon = 'layers',
  title,
  desc,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  desc?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon name={icon} size={22} />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {desc ? <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">{desc}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const palette = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700'];
  const idx = name.charCodeAt(0) % palette.length;
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', palette[idx], className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.slice(-2)}
    </span>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function Progress({ value, tone = 'brand', className }: { value: number; tone?: 'brand' | 'green' | 'amber' | 'red'; className?: string }) {
  const colors = {
    brand: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
  };
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full transition-all', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
