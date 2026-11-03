'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 空闲时预热路由。
 *
 * 背景：本项目所有页面都读取 cookie（动态渲染），Next 15 对动态路由默认不做
 * 完整预取，用户第一次点某个菜单时才会真正发起 RSC 请求，其中还包含服务端
 * 首次加载该路由模块的成本，体感就是「冷路由卡一下」。
 *
 * 这里在首屏稳定后，按空闲时间逐个 router.prefetch，把 RSC 结果放进客户端
 * 路由缓存，同时把服务端对应路由模块也预热掉。之后点击基本命中缓存。
 */
export function RoutePreloader({ hrefs }: { hrefs: string[] }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const warm = () => {
      hrefs.forEach((href, i) => {
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) router.prefetch(href);
          }, i * 90)
        );
      });
    };

    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(warm, { timeout: 1200 })
        : window.setTimeout(warm, 300);

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      if (typeof window.cancelIdleCallback === 'function' && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [hrefs, router]);

  return null;
}
