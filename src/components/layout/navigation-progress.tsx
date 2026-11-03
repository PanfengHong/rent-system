'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * 顶部细进度条（导航指示器）。
 *
 * 为什么不用路由级 loading.tsx 骨架屏：
 * App Router 的导航走 React transition，RSC 未就绪时 React 会保留旧页面而不是
 * 立刻显示 fallback，于是骨架屏往往在数据快到时才闪一下 —— 观感是「先卡住、
 * 再抖一下」。这里改为：旧内容继续留在原位，需要等待时在顶栏下方出现一条
 * 极细的进度条，既有反馈又不打断阅读，也不占布局（fixed，不影响内容宽度）。
 *
 * 100ms 延迟显示：命中预取缓存时（通常 40–80ms）根本不会出现，避免闪烁。
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const delayTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (delayTimer.current) window.clearTimeout(delayTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    delayTimer.current = null;
    safetyTimer.current = null;
  };

  // 路由提交完成 → 收起
  useEffect(() => {
    clearTimers();
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return;

      let next: URL;
      try {
        next = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (next.origin !== window.location.origin) return;
      if (next.pathname === window.location.pathname) return;

      clearTimers();
      delayTimer.current = window.setTimeout(() => setActive(true), 100);
      // 兜底：万一导航被中断，4s 后自动收起
      safetyTimer.current = window.setTimeout(() => setActive(false), 4000);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => clearTimers, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-16 z-40 h-[2px] overflow-hidden bg-brand-100/70 lg:left-[236px]"
    >
      <div className="nav-progress h-full w-1/4 bg-brand-600" />
    </div>
  );
}
