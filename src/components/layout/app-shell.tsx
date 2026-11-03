'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/lib/types';
import { Icon, type IconName } from '../icons';
import { Avatar } from '../ui/base';
import { NavLink } from './nav-link';
import { NavigationProgress } from './navigation-progress';
import { RoutePreloader } from './route-preloader';
import { RouteTransition } from './route-transition';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: '概览', items: [{ href: '/', label: '工作台', icon: 'dashboard' }] },
  {
    title: '租赁运营',
    items: [
      { href: '/rooms', label: '房间管理', icon: 'room' },
      { href: '/buildings', label: '楼栋管理', icon: 'building' },
      { href: '/tenants', label: '租客管理', icon: 'users' },
      { href: '/contracts', label: '合同管理', icon: 'contract' },
    ],
  },
  { title: '财务', items: [{ href: '/bills', label: '账单收款', icon: 'bill' }] },
  { title: '服务与分析', items: [
    { href: '/maintenance', label: '报修工单', icon: 'wrench' },
    { href: '/reports', label: '经营分析', icon: 'chart' },
  ] },
];

const PAGE_TITLE: Record<string, { title: string; desc: string }> = {
  '/': { title: '工作台', desc: '一屏掌握公寓经营与待办事项' },
  '/rooms': { title: '房间管理', desc: '维护房源状态、租金与配置信息' },
  '/buildings': { title: '楼栋管理', desc: '管理楼盘档案与楼栋出租表现' },
  '/tenants': { title: '租客管理', desc: '租客档案、联系方式与在租情况' },
  '/contracts': { title: '合同管理', desc: '签约、续租、退租与到期提醒' },
  '/bills': { title: '账单收款', desc: '按期生成账单，跟踪回款与逾期' },
  '/maintenance': { title: '报修工单', desc: '受理、派单与跟进租客报修' },
  '/reports': { title: '经营分析', desc: '出租率、收入结构与回款质量' },
  '/settings': { title: '系统设置', desc: '账号权限与系统运行信息' },
};

/** 需要预热的全部路由（模块级常量，保证引用稳定） */
const ALL_HREFS = ['/', ...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)), '/settings'].filter(
  (href, i, arr) => arr.indexOf(href) === i
);

export interface ShellAlert {
  label: string;
  count: number;
  href: string;
  tone: 'amber' | 'red';
}

export function AppShell({
  user,
  alerts,
  children,
}: {
  user: SessionUser;
  alerts: ShellAlert[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const meta = PAGE_TITLE[pathname] ?? { title: '云居租房', desc: '' };
  const totalAlerts = alerts.reduce((sum, a) => sum + a.count, 0);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setBellOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
          <Icon name="logo" size={19} />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-slate-900">云居租房</p>
          <p className="text-[10px] tracking-wider text-slate-400">RENTAL OS</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <NavLink href={item.href} label={item.label} icon={item.icon} active={active} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 底部个人信息：点击弹出菜单（系统设置 / 退出登录） */}
      <div className="border-t border-slate-100 p-3">
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition',
              profileOpen
                ? 'bg-slate-100'
                : pathname === '/settings'
                  ? 'bg-brand-50 hover:bg-brand-100/70'
                  : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <Avatar name={user.name} size={30} />
            <div className="min-w-0 flex-1 leading-tight">
              <p
                className={cn(
                  'truncate text-[13px] font-medium',
                  pathname === '/settings' && !profileOpen ? 'text-brand-700' : 'text-slate-800'
                )}
              >
                {user.name}
              </p>
              <p
                className={cn(
                  'truncate text-[11px]',
                  pathname === '/settings' && !profileOpen ? 'text-brand-600/70' : 'text-slate-400'
                )}
              >
                {user.role === 'admin' ? '超级管理员' : '运营管家'}
              </p>
            </div>
            <Icon
              name="chevron-down"
              size={14}
              className={cn('shrink-0 text-slate-400 transition-transform', profileOpen && 'rotate-180')}
            />
          </button>

          {profileOpen ? (
            <div
              role="menu"
              className="absolute bottom-full left-0 right-0 z-10 mb-2 animate-slide-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop"
            >
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-[13px] font-medium text-slate-800">{user.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">@{user.username}</p>
              </div>
              <Link
                href="/settings"
                role="menuitem"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-[13px] transition',
                  pathname === '/settings' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Icon name="settings" size={15} className={pathname === '/settings' ? 'text-brand-600' : 'text-slate-400'} />
                系统设置
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-600 transition hover:bg-rose-50"
              >
                <Icon name="logout" size={15} />
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <RoutePreloader hrefs={ALL_HREFS} />
      <NavigationProgress />

      {/* 桌面端侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] border-r border-slate-200/80 bg-white lg:block">{nav}</aside>

      {/* 移动端抽屉 */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[236px] animate-slide-up bg-white shadow-pop">{nav}</aside>
        </div>
      ) : null}

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="打开菜单"
          >
            <Icon name="menu" size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold text-slate-900">{meta.title}</h1>
            <p className="hidden truncate text-xs text-slate-400 sm:block">{meta.desc}</p>
          </div>

          <span className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 md:flex">
            <Icon name="calendar" size={14} />
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </span>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="提醒"
            >
              <Icon name="bell" size={19} />
              {totalAlerts > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              ) : null}
            </button>
            {bellOpen ? (
              <div className="absolute right-0 top-11 w-72 animate-slide-up rounded-xl border border-slate-200 bg-white p-2 shadow-pop">
                <p className="px-2 py-1.5 text-xs font-semibold text-slate-500">待办提醒</p>
                {alerts.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-slate-400">暂无待处理事项</p>
                ) : (
                  alerts.map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn('h-1.5 w-1.5 rounded-full', a.tone === 'red' ? 'bg-rose-500' : 'bg-amber-500')} />
                        {a.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{a.count}</span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
          <RouteTransition>{children}</RouteTransition>
        </main>
      </div>
    </div>
  );
}
