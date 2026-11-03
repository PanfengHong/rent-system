'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from '../icons';

/**
 * 侧边栏导航项。
 * 刻意不加任何 loading / pending 视觉：菜单是固定框架的一部分，
 * 切换时只应有高亮变化，转圈会让人感觉「框架在等数据」。
 */
export function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-150',
        active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-brand-600" />
      ) : null}
      <Icon
        name={icon}
        size={17}
        className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'}
      />
      {label}
    </Link>
  );
}
