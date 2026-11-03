'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * 内容区过渡。
 *
 * 侧边栏与顶栏是固定的框架，路由切换只替换这里的内容。
 * 用 pathname 作为 key，让新内容挂载时播一次极短的淡入，
 * 避免「骨架 → 内容」的硬切换，视觉上更连贯。
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}
